#!/bin/bash

# Quick test script to create test alerts in the database
# This bypasses Kafka and directly inserts alerts to test the Alerts page

echo "🧪 Creating test alerts in database..."

docker exec timescaledb psql -U postgres -d pulseboard << EOF

-- Critical alert - Above threshold
INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
VALUES ('google', 6, 'Temp-3', 'temperature', 'threshold_breach', 'Critical', 'Sensor value 35.00 °C exceeds maximum threshold of 30 °C', 35, 20, 30, NOW())
ON CONFLICT DO NOTHING;

-- Warning alert - Near threshold
INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
VALUES ('google', 6, 'Temp-3', 'temperature', 'anomaly', 'Warning', 'Warning: Sensor value 28.50 °C is approaching maximum threshold of 30 °C', 28.5, 20, 30, NOW())
ON CONFLICT DO NOTHING;

-- Critical alert - Below threshold
INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
VALUES ('google', 6, 'Temp-3', 'temperature', 'threshold_breach', 'Critical', 'Sensor value 15.00 °C is below minimum threshold of 20 °C', 15, 20, 30, NOW())
ON CONFLICT DO NOTHING;


SELECT '✅ Test alerts created!' as status;
SELECT id, sensor_name, severity, message, created_at FROM alerts WHERE org_id = 'google' ORDER BY created_at DESC LIMIT 5;

EOF

echo ""
echo "✅ Test alerts created!"
echo "📋 Next steps:"
echo "1. Open http://localhost:3000/dashboard/alerts"
echo "2. Refresh the page - you should see the test alerts"
echo "3. Test filtering by severity (Critical, Warning)"
echo "4. Test search by sensor name"
echo ""
