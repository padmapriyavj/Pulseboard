#!/bin/bash

echo "🚀 Starting kafka-processor..."
echo ""
echo "This will:"
echo "  1. Consume messages from Kafka"
echo "  2. Insert sensor data into the database"
echo "  3. Create alerts for threshold breaches"
echo ""
echo "Make sure Kafka is running first!"
echo ""

cd apps/kafka-processor
npm start
