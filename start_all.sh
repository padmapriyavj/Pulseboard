#!/bin/bash

echo "🚀 Starting PulseBoard services..."
echo ""

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for services to initialize
echo "Waiting for services to initialize..."
sleep 5

# Check status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Docker services started!"
echo ""
echo "📋 If you see 'sensor_id' or 'alerts' errors, run once: ./run_migrations.sh"
echo ""
echo "   Then start (in separate terminals):"
echo "   1. cd apps/sensor-simulator && npm start"
echo "   2. cd apps/kafka-processor && npm start"
echo "   3. cd apps/frontend/pulseboard-dashboard && npm start"
echo ""
echo "   Open http://localhost:3000 → Login → Sensors → Alerts"
echo ""
