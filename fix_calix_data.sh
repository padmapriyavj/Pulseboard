#!/bin/bash

echo "🔧 Fixing data generation for calix organization..."
echo ""

echo "1. Checking calix sensors:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT id, name, type, org_id, min, max FROM sensors WHERE org_id = 'calix' AND delete_status = FALSE;"
echo ""

echo "2. Current data count for calix:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT COUNT(*) as total_metrics FROM sensor_metrics WHERE org_id = 'calix';"
echo ""

echo "💡 Solutions:"
echo ""
echo "Option 1: Restart sensor-simulator (Recommended)"
echo "   cd apps/sensor-simulator"
echo "   npm start"
echo ""
echo "Option 2: Wait 30 seconds"
echo "   The simulator refreshes sensor list every 30 seconds"
echo "   It should automatically pick up the calix sensor"
echo ""
echo "Option 3: Manually trigger data generation (for testing)"
echo "   You can use the test script to send data directly to Kafka"
echo ""
