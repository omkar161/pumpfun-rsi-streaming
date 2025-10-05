fn main() {
    println!("Hello, world!");
}
// src/main.rs
use std::collections::HashMap;
use std::time::Duration;
use futures::StreamExt;
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{StreamConsumer, Consumer};
use rdkafka::message::BorrowedMessage;
use rdkafka::producer::{FutureProducer, FutureRecord};
use serde::Deserialize;
use serde_json::Value;
use tokio::sync::Mutex;
use std::sync::Arc;

#[derive(Debug, Deserialize)]
struct Trade {
    // Use serde_json::Value for unknown fields, or explicit fields
    token_address: String,
    price_in_sol: Option<String>, // CSV -> string; will parse to f64
    ingested_at: Option<String>,
    // ... other fields as needed
}

struct RsiState {
    prev_price: Option<f64>,
    period_count: usize,
    avg_gain: Option<f64>,
    avg_loss: Option<f64>,
    // for first window we collect raw gains/losses
    gains: Vec<f64>,
    losses: Vec<f64>,
}

impl RsiState {
    fn new() -> Self {
        Self { prev_price: None, period_count: 0, avg_gain: None, avg_loss: None, gains: Vec::new(), losses: Vec::new() }
    }

    fn update_and_compute(&mut self, price: f64) -> Option<f64> {
        if let Some(prev) = self.prev_price {
            let diff = price - prev;
            let gain = if diff > 0.0 { diff } else { 0.0 };
            let loss = if diff < 0.0 { -diff } else { 0.0 };

            self.period_count += 1;

            if self.period_count <= 14 {
                self.gains.push(gain);
                self.losses.push(loss);

                if self.period_count == 14 {
                    let avg_gain = self.gains.iter().sum::<f64>() / 14.0;
                    let avg_loss = self.losses.iter().sum::<f64>() / 14.0;
                    self.avg_gain = Some(avg_gain);
                    self.avg_loss = Some(avg_loss);
                    return Some(calc_rsi(avg_gain, avg_loss));
                } else {
                    return None;
                }
            } else {
                // Wilder smoothing
                let prev_avg_gain = self.avg_gain.unwrap_or(0.0);
                let prev_avg_loss = self.avg_loss.unwrap_or(0.0);
                let new_avg_gain = (prev_avg_gain * 13.0 + gain) / 14.0;
                let new_avg_loss = (prev_avg_loss * 13.0 + loss) / 14.0;
                self.avg_gain = Some(new_avg_gain);
                self.avg_loss = Some(new_avg_loss);
                return Some(calc_rsi(new_avg_gain, new_avg_loss));
            }
        }
        // first price only, just store
        self.prev_price = Some(price);
        None
    }
}

fn calc_rsi(avg_gain: f64, avg_loss: f64) -> f64 {
    if avg_loss == 0.0 {
        return 100.0;
    }
    let rs = avg_gain / avg_loss;
    100.0 - (100.0 / (1.0 + rs))
}

#[tokio::main]
async fn main() {
    // Kafka client config
    let brokers = "localhost:19092"; // redpanda external broker
    let group_id = "rsi-calculator-group";

    let consumer: StreamConsumer = ClientConfig::new()
        .set("group.id", group_id)
        .set("bootstrap.servers", brokers)
        .set("enable.partition.eof", "false")
        .create()
        .expect("Consumer creation failed");

    consumer.subscribe(&["trade-data"]).expect("subscribe failed");

    let producer: FutureProducer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .create()
        .expect("producer create");

    // Shared state: token -> RsiState
    let state: Arc<Mutex<HashMap<String, RsiState>>> = Arc::new(Mutex::new(HashMap::new()));

    let mut message_stream = consumer.stream();

    println!("RSI service started. Waiting for messages...");

    while let Some(message) = message_stream.next().await {
        match message {
            Ok(m) => {
                if let Some(payload) = m.payload_view::<str>().ok().flatten() {
                    // parse JSON
                    let v: Value = match serde_json::from_str(payload) {
                        Ok(x) => x,
                        Err(e) => { eprintln!("json parse err: {}", e); continue; }
                    };

                    // get token and price fields
                    let token = v.get("token_address")
                        .and_then(|t| t.as_str())
                        .unwrap_or("unknown")
                        .to_string();

                    // price may be string or number
                    let price_opt = v.get("price_in_sol")
                        .and_then(|p| {
                            if p.is_string() { p.as_str()?.parse::<f64>().ok() }
                            else if p.is_number() { p.as_f64() }
                            else { None }
                        });

                    if let Some(price) = price_opt {
                        // update token state
                        let mut map = state.lock().await;
                        let st = map.entry(token.clone()).or_insert_with(RsiState::new);
                        // set prev_price if not set
                        if st.prev_price.is_none() {
                            st.prev_price = Some(price);
                            continue; // need diff for next message
                        }
                        if let Some(rsi) = st.update_and_compute(price) {
                            // publish RSI result to rsi-data
                            let out = serde_json::json!({
                                "token_address": token,
                                "rsi": ( (rsi * 100.0).round() / 100.0 ), // round 2 decimals
                                "price": price,
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            });
                            let payload = out.to_string();
                            let produce_future = producer.send(
                                FutureRecord::to("rsi-data").payload(&payload).key(&""),
                                Duration::from_secs(0)
                            );
                            // don't block main loop - await the send if necessary
                            match produce_future.await {
                                Ok(delivery) => {
                                    println!("Published RSI: {:?}", out);
                                }
                                Err((e, _)) => {
                                    eprintln!("Failed to publish RSI: {:?}", e);
                                }
                            }
                        }
                        st.prev_price = Some(price);
                    }
                }
            }
            Err(e) => eprintln!("Kafka error: {}", e),
        }
    }
}
