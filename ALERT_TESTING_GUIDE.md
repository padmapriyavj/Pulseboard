# Alert Testing Guide - Sensor Configurations

## Temperature Sensor Testing Configurations

The sensor simulator generates values between **10-40°C** by default. Use these configurations to test alerts:

### 🎯 Recommended: Narrow Range (Best for Testing)
- **Name**: `Temp-Alert-Test`
- **Type**: `temperature`
- **Min Value**: `20`
- **Max Value**: `25`
- **Unit**: `°C` (auto-filled)
- **Status**: `active`

**Why this works:**
- Simulator generates 10-40°C, so values frequently breach 20-25 range
- You'll see both Critical (outside range) and Warning (near boundaries) alerts
- Good balance - not too many, not too few alerts

**Expected Results:**
- ✅ Critical alerts when value < 20 or > 25
- ✅ Warning alerts when value is 20-21 or 24-25 (near thresholds)
- ✅ No alerts when value is 21-24 (normal range)

---

### ⚡ High Frequency: Very Narrow Range
- **Name**: `Temp-Alert-Frequent`
- **Type**: `temperature`
- **Min Value**: `22`
- **Max Value**: `23`
- **Unit**: `°C`
- **Status**: `active`

**Why this works:**
- Very narrow range triggers alerts frequently
- Good for testing alert handling and UI performance

**Expected Results:**
- ✅ Many Critical alerts (most values outside 22-23)
- ✅ Many Warning alerts (values near boundaries)

---

### 🔥 Edge Case Testing: Below Normal Range
- **Name**: `Temp-Alert-Edge`
- **Type**: `temperature`
- **Min Value**: `15`
- **Max Value**: `18`
- **Unit**: `°C`
- **Status**: `active`

**Why this works:**
- Range is below normal simulator output (10-40)
- Catches edge cases and spikes
- Good for testing anomaly detection

**Expected Results:**
- ✅ Critical alerts when value > 18 (most values)
- ✅ Critical alerts when value < 15 (rare, but possible with edge cases)

---

### ⚖️ Balanced: Moderate Range
- **Name**: `Temp-Alert-Balanced`
- **Type**: `temperature`
- **Min Value**: `18`
- **Max Value**: `28`
- **Unit**: `°C`
- **Status**: `active`

**Why this works:**
- Covers most normal values
- Occasional breaches for realistic testing
- Good for production-like scenarios

**Expected Results:**
- ✅ Occasional Critical alerts (values < 18 or > 28)
- ✅ Occasional Warning alerts (values near 18 or 28)

---

## Testing Steps

1. **Create the sensor** with one of the configurations above
2. **Start the sensor simulator** (if not already running):
   ```bash
   cd apps/sensor-simulator
   npm start
   ```

3. **Start the kafka-processor** (if not already running):
   ```bash
   cd apps/kafka-processor
   npm start
   ```

4. **Open the Alerts page** in your browser:
   - Navigate to `/dashboard/alerts`
   - Page auto-refreshes every 10 seconds

5. **Watch for alerts**:
   - Alerts appear within 5-10 seconds of threshold breach
   - Critical alerts show red dot
   - Warning alerts show orange dot

---

## Understanding Alert Types

### Critical Alerts
- **Threshold Breach**: Value is outside min/max range
- **Example**: Value 35°C when max is 25°C → Critical threshold breach

### Warning Alerts
- **Approaching Threshold**: Value is within 10% of min/max boundaries
- **Example**: Value 24°C when max is 25°C → Warning (approaching max)


---

## Quick Test Values

If you want to manually test, use these values:

| Value | Min | Max | Expected Alert |
|-------|-----|-----|----------------|
| 15 | 20 | 25 | Critical (below min) |
| 19 | 20 | 25 | Warning (near min) |
| 22 | 20 | 25 | No alert (normal) |
| 24 | 20 | 25 | Warning (near max) |
| 30 | 20 | 25 | Critical (above max) |

---

## Troubleshooting

**No alerts appearing?**
1. Check kafka-processor is running and processing messages
2. Check sensor simulator is generating data
3. Verify sensor thresholds are set correctly
4. Check browser console for GraphQL errors
5. Verify you're logged in with the correct org_id

**Too many alerts?**
- Widen the threshold range (e.g., 15-30 instead of 20-25)

**Not enough alerts?**
- Narrow the threshold range (e.g., 22-23 instead of 20-25)
- Or use edge case configuration (15-18)

---

## Other Sensor Types

### Humidity
- Default range: 30-90%
- Test config: Min: 40, Max: 60

### Gas
- Default range: 200-1000 ppm
- Test config: Min: 400, Max: 600

### Pressure
- Default range: 900-1100 hPa
- Test config: Min: 950, Max: 1050
