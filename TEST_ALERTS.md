# Testing Alerts Page - Real-Time Alert Detection

## Prerequisites

Make sure these services are running:
1. **Docker containers**: `docker-compose up` (Kafka, TimescaleDB, GraphQL API)
2. **Kafka-processor**: `cd apps/kafka-processor && npm start`
3. **Sensor-simulator**: `cd apps/sensor-simulator && npm start`
4. **Frontend**: Running on `localhost:3000`

## Method 1: Using the Test Script (Recommended)

1. **Install dependencies** (if not already installed):
   ```bash
   cd /Users/padmapriyavijayaragavarengaraj/Documents/GitHub/Pulseboard
   npm install kafkajs
   ```

2. **Run the test script**:
   ```bash
   node test_alerts.js
   ```

3. **Check the Alerts page**:
   - Open `http://localhost:3000/dashboard/alerts`
   - You should see alerts appearing within 5-10 seconds
   - Test cases:
     - **Critical alerts**: Values 35 and 15 (outside 20-30 threshold)
     - **Warning alerts**: Values 28.5 and 21 (near thresholds)
     - **No alert**: Value 25 (normal range)

## Method 2: Manual Testing via Database

1. **Create test alerts directly in database**:
   ```bash
   docker exec -it timescaledb psql -U postgres -d pulseboard
   ```

2. **Insert test alerts**:
   ```sql
   -- Critical alert
   INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
   VALUES ('google', 6, 'Temp-3', 'temperature', 'threshold_breach', 'Critical', 'Sensor value 35.00 °C exceeds maximum threshold of 30 °C', 35, 20, 30, NOW());

   -- Warning alert
   INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
   VALUES ('google', 6, 'Temp-3', 'temperature', 'anomaly', 'Warning', 'Warning: Sensor value 28.50 °C is approaching maximum threshold of 30 °C', 28.5, 20, 30, NOW());
   ```

3. **Refresh the Alerts page** - alerts should appear immediately

## Method 3: Real-Time Testing with Sensor Simulator

1. **Ensure sensor-simulator is running** and generating data

2. **Modify sensor thresholds** to trigger alerts:
   - Go to Sensors page
   - Edit a sensor (e.g., Temp-3)
   - Set narrow thresholds (e.g., min: 25, max: 27)
   - The simulator will generate values outside this range

3. **Watch the Alerts page** - alerts should appear automatically as data is generated

## Method 4: Monitor Kafka Processor Logs

1. **Watch kafka-processor console** for alert creation messages:
   ```bash
   cd apps/kafka-processor
   npm start
   ```

2. **Look for these log messages**:
   - `⚠️  Alert created: [id] for sensor [sensor_id]` - Alert was created
   - `✅ Stored data from topic: [topic]` - Data processed successfully
   - `Error creating alert:` - If there's an issue

## Verification Checklist

- [ ] Alerts appear in the Alerts page within 10 seconds of data being sent
- [ ] Critical alerts show red severity indicator
- [ ] Warning alerts show yellow severity indicator
- [ ] Filter by "Critical" shows only Critical alerts
- [ ] Filter by "Warning" shows only Warning alerts
- [ ] Search by sensor name works
- [ ] Acknowledge button (✓) marks alert as acknowledged
- [ ] Delete button (🗑️) removes alert
- [ ] Alerts are sorted by timestamp (newest first)
- [ ] Page auto-refreshes every 10 seconds (pollInterval)

## Troubleshooting

**If alerts don't appear:**

1. **Check if kafka-processor is running**:
   ```bash
   ps aux | grep kafka-processor
   ```

2. **Check if alerts are being created in database**:
   ```bash
   docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT COUNT(*) FROM alerts WHERE org_id = 'google';"
   ```

3. **Check GraphQL API logs**:
   ```bash
   docker-compose logs graphql-api
   ```

4. **Verify your org_id matches**:
   - Check what org you're logged in as
   - Ensure test data uses the same org_id

5. **Restart services**:
   ```bash
   docker-compose restart graphql-api
   # Restart kafka-processor manually
   ```

## Expected Behavior

- **Real-time updates**: Alerts should appear within 5-10 seconds of threshold breach
- **Auto-refresh**: Page polls every 10 seconds for new alerts
- **Immediate display**: New alerts appear at the top of the list
- **Status indicators**: Color-coded severity (red/yellow/blue)
