// ingest/ingest.js
const fs = require('fs');
const csv = require('csv-parser');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'csv-ingestor',
  brokers: ['localhost:19092'] // redpanda external broker
});

const producer = kafka.producer();

async function main() {
  await producer.connect();
  const rows = [];
  fs.createReadStream('../trades_data.csv')
    .pipe(csv())
    .on('data', row => rows.push(row))
    .on('end', async () => {
      console.log(`Read ${rows.length} rows, producing to trade-data...`);
      for (const r of rows) {
        // Optional: sanitise fields (convert numeric strings to numbers)
        const message = { ...r };
        await producer.send({
          topic: 'trade-data',
          messages: [{ value: JSON.stringify(message) }]
        });
        // optional small sleep to simulate streaming:
        await new Promise(res => setTimeout(res, 20));
      }
      console.log('All messages produced.');
      await producer.disconnect();
      process.exit(0);
    });
}

main().catch(err => { console.error(err); process.exit(1); });
