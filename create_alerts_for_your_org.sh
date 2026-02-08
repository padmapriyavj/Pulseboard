#!/bin/bash

echo "🔍 What organization are you logged in as?"
echo "Check the top header of your dashboard or browser console"
echo ""
read -p "Enter your org_id (e.g., 'google', 'microsoft'): " USER_ORG

if [ -z "$USER_ORG" ]; then
  echo "❌ No org_id provided. Exiting."
  exit 1
fi

echo ""
echo "📝 Creating test alerts for org: $USER_ORG"
echo ""

docker exec timescaledb psql -U postgres -d pulseboard << EOF

-- Get a sensor ID for this org
DO \$\$
DECLARE
    sensor_id_var INTEGER;
    sensor_name_var TEXT;
BEGIN
    -- Get first sensor for this org
    SELECT id, name INTO sensor_id_var, sensor_name_var
    FROM sensors 
    WHERE org_id = '$USER_ORG' AND delete_status = FALSE 
    LIMIT 1;

    IF sensor_id_var IS NULL THEN
        RAISE NOTICE 'No sensors found for org: %', '$USER_ORG';
    ELSE
        -- Critical alert - Above threshold
        INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
        VALUES ('$USER_ORG', sensor_id_var, sensor_name_var, 'temperature', 'threshold_breach', 'Critical', 
                'Test: Sensor value 35.00 °C exceeds maximum threshold', 35, 20, 30, NOW());

        -- Warning alert - Near threshold
        INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
        VALUES ('$USER_ORG', sensor_id_var, sensor_name_var, 'temperature', 'anomaly', 'Warning', 
                'Test: Sensor value 28.50 °C is approaching maximum threshold', 28.5, 20, 30, NOW());

        -- Critical alert - Below threshold
        INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
        VALUES ('$USER_ORG', sensor_id_var, sensor_name_var, 'temperature', 'threshold_breach', 'Critical', 
                'Test: Sensor value 15.00 °C is below minimum threshold', 15, 20, 30, NOW());

        RAISE NOTICE '✅ Created 3 test alerts for org: %', '$USER_ORG';
    END IF;
END \$\$;

-- Show created alerts
SELECT '✅ Test alerts created!' as status;
SELECT id, sensor_name, severity, message, created_at 
FROM alerts 
WHERE org_id = '$USER_ORG' 
ORDER BY created_at DESC 
LIMIT 5;

EOF

echo ""
echo "✅ Done! Now refresh your Alerts page."
echo ""
