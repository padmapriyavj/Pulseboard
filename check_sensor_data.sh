#!/bin/bash

echo "🔍 Checking sensor data generation..."
echo ""

echo "1. Sensors by organization:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT org_id, COUNT(*) as sensor_count FROM sensors WHERE delete_status = FALSE GROUP BY org_id ORDER BY org_id;"
echo ""

echo "2. Recent data (last 5 minutes) by organization:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT org_id, COUNT(*) as recent_readings FROM sensor_metrics WHERE timestamp > NOW() - INTERVAL '5 minutes' GROUP BY org_id ORDER BY org_id;"
echo ""

echo "3. Sensors with no data:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT s.id, s.name, s.org_id, s.type, COUNT(sm.*) as reading_count FROM sensors s LEFT JOIN sensor_metrics sm ON s.id = sm.sensor_id WHERE s.delete_status = FALSE GROUP BY s.id, s.name, s.org_id, s.type HAVING COUNT(sm.*) = 0 ORDER BY s.org_id, s.id;"
echo ""

echo "4. Latest sensor readings by org:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT s.org_id, s.name, MAX(sm.timestamp) as last_reading FROM sensors s LEFT JOIN sensor_metrics sm ON s.id = sm.sensor_id WHERE s.delete_status = FALSE GROUP BY s.org_id, s.name ORDER BY s.org_id, last_reading DESC NULLS LAST LIMIT 10;"
echo ""

echo "💡 If sensors have no data:"
echo "   1. Make sure sensor-simulator is running: cd apps/sensor-simulator && npm start"
echo "   2. Wait 30 seconds for simulator to pick up new sensors"
echo "   3. Data should start appearing within 3-5 seconds after that"
echo ""
