# Real-Time Alerts Testing Guide

## Quick Test Methods

### Method 1: Direct Database Insert (Fastest - 30 seconds)

**Run this command:**
```bash
./quick_test_alerts.sh
```

This will:
- Create 3-4 test alerts directly in the database
- Show you the alerts that were created
- You can immediately see them in the Alerts page

**Then:**
1. Open `http://localhost:3000/dashboard/alerts`
2. Refresh the page
3. You should see the test alerts immediately

---

### Method 2: Using Test Script via Kafka (Most Realistic - 2 minutes)

**Prerequisites:**
```bash
# Install kafkajs if not already installed
npm install kafkajs
```

**Steps:**
1. **Make sure kafka-processor is running**:
   ```bash
   cd apps/kafka-processor
   npm start
   ```

2. **Run the test script**:
   ```bash
   node test_alerts.js
   ```

3. **Watch the Alerts page** - alerts should appear within 5-10 seconds

**What the script does:**
- Sends 5 test messages to Kafka
- Each message has different values to test different alert types
- kafka-processor processes them and creates alerts
- Alerts appear in real-time on the page

---

### Method 3: Real-Time Testing with Live Data (Best for Continuous Testing)

**Steps:**

1. **Modify a sensor's thresholds** to be very narrow:
   - Go to Sensors page
   - Edit Temp-3 (or any sensor)
   - Change thresholds to: min: 25, max: 27
   - Save

2. **Ensure sensor-simulator is running**:
   ```bash
   cd apps/sensor-simulator
   npm start
   ```

3. **Watch the Alerts page**:
   - Open `http://localhost:3000/dashboard/alerts`
   - The page auto-refreshes every 10 seconds
   - Alerts will appear automatically as values breach thresholds

4. **What to expect:**
   - Values < 25 → Critical alert (below min)
   - Values > 27 → Critical alert (above max)
   - Values 25-25.5 or 26.5-27 → Warning alert (near thresholds)
   - Values 25.5-26.5 → No alert (normal range)

---

### Method 4: Manual SQL Testing (For Debugging)

**Connect to database:**
```bash
docker exec -it timescaledb psql -U postgres -d pulseboard
```

**Create test alerts:**
```sql
-- Critical alert
INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
VALUES ('google', 6, 'Temp-3', 'temperature', 'threshold_breach', 'Critical', 'Test: Sensor value 35.00 °C exceeds maximum threshold of 30 °C', 35, 20, 30, NOW());

-- Warning alert  
INSERT INTO alerts (org_id, sensor_id, sensor_name, sensor_type, alert_type, severity, message, value, threshold_min, threshold_max, created_at)
VALUES ('google', 6, 'Temp-3', 'temperature', 'anomaly', 'Warning', 'Test: Sensor value 28.50 °C is approaching maximum threshold of 30 °C', 28.5, 20, 30, NOW());
```

**Check alerts:**
```sql
SELECT id, sensor_name, severity, message, created_at 
FROM alerts 
WHERE org_id = 'google' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Verification Checklist

After running any test method, verify:

- [ ] **Alerts appear in the table** within 10 seconds
- [ ] **Critical alerts** show red severity dot
- [ ] **Warning alerts** show yellow severity dot  
- [ ] **Filter by "Critical"** shows only Critical alerts
- [ ] **Filter by "Warning"** shows only Warning alerts
- [ ] **Search by sensor name** (e.g., "Temp-3") works
- [ ] **Acknowledge button (✓)** marks alert as acknowledged (alert becomes dimmed)
- [ ] **Delete button (🗑️)** removes alert from list
- [ ] **New alerts appear at top** (sorted by newest first)
- [ ] **Page auto-refreshes** every 10 seconds (check browser console for polling)

---

## Real-Time Monitoring

**To monitor alerts being created in real-time:**

1. **Open two terminal windows:**

   **Terminal 1 - Watch kafka-processor:**
   ```bash
   cd apps/kafka-processor
   npm start
   ```
   Look for: `⚠️  Alert created: [id] for sensor [sensor_id]`

   **Terminal 2 - Watch database:**
   ```bash
   watch -n 2 'docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT COUNT(*) as total, severity, COUNT(*) FILTER (WHERE acknowledged = false) as unacknowledged FROM alerts WHERE org_id = '\''google'\'' GROUP BY severity;"'
   ```

2. **Open Alerts page** in browser
3. **Run test script** or wait for simulator to generate data
4. **Watch all three** update in real-time!

---

## Troubleshooting

**If alerts don't appear:**

1. **Check kafka-processor is running:**
   ```bash
   ps aux | grep "kafka-processor"
   ```

2. **Check alerts in database:**
   ```bash
   docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT COUNT(*) FROM alerts WHERE org_id = 'google';"
   ```

3. **Check GraphQL API is running:**
   ```bash
   docker-compose ps graphql-api
   ```

4. **Verify org_id matches:**
   - Check what org you're logged in as (should be "google" for test data)
   - Ensure test alerts use the same org_id

5. **Restart services if needed:**
   ```bash
   docker-compose restart graphql-api
   # Then restart kafka-processor manually
   ```

---

## Expected Timeline

- **0-2 seconds**: Data sent to Kafka
- **2-5 seconds**: kafka-processor processes data
- **5-10 seconds**: Alert appears in database
- **10 seconds**: Alerts page auto-refreshes and shows new alert

**Total time: ~10-15 seconds from data generation to display**
