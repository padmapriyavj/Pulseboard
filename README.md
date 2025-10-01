
# 📊 PulseBoard: Real-Time Sensor Monitoring & Anomaly Detection

PulseBoard is a full-stack, modular, and cloud-native IoT data monitoring platform designed to ingest, store, analyze, and visualize real-time sensor data for multiple organizations. It includes support for AI/ML-based anomaly detection, user and organization mapping, and live dashboards built using modern technologies.

---

## 🚀 Features

### ✅ Core Functionality

- **Sensor Simulation**: Generates simulated sensor data (temperature, humidity, pressure, etc.) with realistic edge cases and noise.
- **Kafka + Kafka Topics**: Real-time data streaming per organization and sensor type.
- **Kafka Streams**: Filtering, transformation, enrichment of messages.
- **TimescaleDB**: Time-series storage of sensor telemetry data.
- **Redis**: Caching of latest sensor readings for quick access.
- **GraphQL API**: A single flexible endpoint to fetch live and historical data.
- **React + Tailwind Frontend**: Real-time charts and visualizations.
- **Authentication & Organization Management**: User registration with org selection and access control.

### 🧠 AI/ML Agent

- Forecasting with **ARIMA** / **Prophet** models.
- Threshold-based anomaly scoring based on user-defined limits.
- Adaptable to different sensor types and edge cases.

### 📈 Monitoring & Observability

- **Prometheus**: Metrics collection from services.
- **Grafana**: Visual dashboard for backend service health and metrics.
- Custom dashboards for users to monitor sensor data.

---

**Main Components:**

- Sensor Simulator → Kafka Broker → Kafka Topics → Kafka Streams → TimescaleDB
- Kafka Streams also forwards to Redis (latest cache) and AI/ML Agent (forecasting)
- Prometheus scrapes TimescaleDB for Grafana metrics
- GraphQL API fetches from Redis + TimescaleDB → React Dashboard (with filtering, live view, history)
- Auth & Org Service handles user-org relationships

---

## 🧪 Edge Case Handling

- Missing values (nulls)
- Sensor spikes/dips
- Overlapping timestamps
- Sensor-specific anomalies (e.g., negative pressure)
- Thresholds set by users per sensor

---

## 🔐 Auth & User Flow

- Users register with their email and select from predefined organizations.
- Sensors are mapped to organizations and can be subscribed to by users.
- Each user has access to only their org’s Kafka topics and dashboards.
- Sensor settings are user-specific: enable/disable, thresholds, preferences.

---

## 🛠️ Tech Stack

| Layer            | Tools / Services                          |
|------------------|-------------------------------------------|
| Frontend         | React, Tailwind CSS, Chart.js/Recharts    |
| API              | Node.js, Apollo Server (GraphQL)          |
| Streaming        | Apache Kafka, Kafka Streams                |
| DB               | TimescaleDB (PostgreSQL)                  |
| Cache            | Redis                                     |
| Auth             | Node.js + JWT                             |
| AI/ML            | Python, ARIMA, Prophet                    |
| Monitoring       | Prometheus + Grafana                      |
| Deployment       | Docker, Kubernetes                        |

---

## 🧭 User Experience Flow

1. **Register/Login** with selected organization.
2. **Sensor Dashboard**: Enable/disable sensors, set thresholds.
3. **Live Data**: Realtime stream charts for selected sensors.
4. **Historical Data**: Time-based filtering and visualization.
5. **Anomalies**: Color-coded alerts from AI/ML agent.
6. **Settings**: Org/sensor preferences.
7. **Monitoring**: Admin access to Grafana.

---

## 🧪 Simulated Sensors (Examples)

1. Temperature Sensor
2. Humidity Sensor
3. Pressure Sensor
4. Air Quality (CO₂)
5. Motion/Infrared Sensor
6. pH Sensor (chemical)
7. Sound Level Meter
8. Light Sensor (LDR)
9. Vibration Sensor
10. Voltage Sensor

Each sensor has unique edge cases and forecasting patterns.

---

## 📄 License

MIT License. Open for academic and commercial contributions.
