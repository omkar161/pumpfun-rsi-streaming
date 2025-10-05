import csv
from confluent_kafka import Producer
import sys

def delivery_report(err, msg):
    if err is not None:
        print(f"Message delivery failed: {err}")
    else:
        print(f"Message delivered to {msg.topic()} [{msg.partition()}]")

def read_csv(file_path):
    with open(file_path, mode='r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            yield row

def produce_to_redpanda(producer, topic, data):
    try:
        producer.produce(topic, value=data, callback=delivery_report)
        producer.flush()
    except Exception as e:
        print(f"Failed to produce message: {e}")

def main(csv_file_path, topic):
    producer = Producer({'bootstrap.servers': 'localhost:9092'})

    for row in read_csv(csv_file_path):
        produce_to_redpanda(producer, topic, str(row))

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python csv_to_redpanda.py <csv_file_path> <topic>")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    topic = sys.argv[2]
    main(csv_file_path, topic)