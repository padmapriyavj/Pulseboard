# How to Safely Stop and Restart Docker

## 🛑 Stopping Everything (End of Day)

### Step 1: Stop Node.js Services (if running)

**In separate terminal windows, stop these services:**
- **sensor-simulator**: Press `Ctrl+C` in its terminal
- **kafka-processor**: Press `Ctrl+C` in its terminal
- **Frontend**: Press `Ctrl+C` in its terminal (if running `npm start`)

### Step 2: Stop Docker Containers

**Option A: Stop all containers (Recommended)**
```bash
cd /Users/padmapriyavijayaragavarengaraj/Documents/GitHub/Pulseboard
docker-compose down
```

**Option B: Stop containers gracefully (keeps them for quick restart)**
```bash
docker-compose stop
```

**Option C: Stop and remove containers (clean slate)**
```bash
docker-compose down --remove-orphans
```

### What Gets Saved?

✅ **Database data persists** - The `timescaledb-data` volume stores all your data:
- Users
- Sensors
- Sensor metrics
- Alerts
- All configurations

❌ **Kafka messages are lost** - Kafka topics are in-memory, so any unprocessed messages will be lost (this is normal)

---

## 🚀 Restarting Everything (Next Day)

### Step 1: Start Docker Containers

```bash
cd /Users/padmapriyavijayaragavarengaraj/Documents/GitHub/Pulseboard
docker-compose up -d
```

The `-d` flag runs containers in the background (detached mode).

### Step 2: Verify Containers Are Running

```bash
docker-compose ps
```

You should see:
- `timescaledb` - Running
- `kafka` - Running
- `zookeeper` - Running
- `auth-service` - Running
- `graphql-api` - Running

### Step 3: Start Node.js Services

**Terminal 1 - Sensor Simulator:**
```bash
cd apps/sensor-simulator
npm start
```

**Terminal 2 - Kafka Processor:**
```bash
cd apps/kafka-processor
npm start
```

**Terminal 3 - Frontend (if not already running):**
```bash
cd apps/frontend/pulseboard-dashboard
npm start
```

### Step 4: Verify Everything Works

1. **Check database:**
   ```bash
   docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT COUNT(*) FROM sensors;"
   ```

2. **Check frontend:** Open `http://localhost:3000`

3. **Check GraphQL API:** Should be accessible at `http://localhost:4000/graphql`

---

## 📋 Quick Reference Commands

### Stop Everything
```bash
# Stop Docker
docker-compose down

# Or if you want to keep containers but stop them
docker-compose stop
```

### Start Everything
```bash
# Start Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs (if needed)
docker-compose logs -f
```

### Check What's Running
```bash
# Docker containers
docker-compose ps

# All Docker containers
docker ps

# Node.js processes
ps aux | grep node
```

---

## 💾 Data Persistence

### What Persists:
- ✅ **Database data** (TimescaleDB volume)
- ✅ **User accounts**
- ✅ **Sensors and configurations**
- ✅ **Historical sensor metrics**
- ✅ **Alerts**

### What Doesn't Persist:
- ❌ **Kafka messages** (in-memory, lost on restart)
- ❌ **Unprocessed sensor data** in Kafka queues

**Note:** This is normal - Kafka is designed for real-time streaming, not long-term storage. New data will start flowing once you restart the services.

---

## 🔧 Troubleshooting

### If containers won't start:
```bash
# Check for port conflicts
docker-compose ps

# View logs
docker-compose logs

# Restart specific service
docker-compose restart graphql-api
```

### If database seems empty:
```bash
# Check if volume exists
docker volume ls | grep timescaledb

# Check database directly
docker exec -it timescaledb psql -U postgres -d pulseboard
```

### Clean restart (if needed):
```bash
# Stop everything
docker-compose down

# Remove volumes (⚠️ WARNING: This deletes all data!)
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## ⚡ Quick Start Script

You can create a simple script to start everything:

**Create `start_all.sh`:**
```bash
#!/bin/bash
echo "🚀 Starting PulseBoard services..."

# Start Docker
docker-compose up -d

# Wait for services to be ready
sleep 5

echo "✅ Docker services started"
echo "📋 Next steps:"
echo "   1. Start sensor-simulator: cd apps/sensor-simulator && npm start"
echo "   2. Start kafka-processor: cd apps/kafka-processor && npm start"
echo "   3. Open http://localhost:3000"
```

**Create `stop_all.sh`:**
```bash
#!/bin/bash
echo "🛑 Stopping PulseBoard services..."
docker-compose down
echo "✅ All services stopped"
```

---

## 📝 Best Practices

1. **Always use `docker-compose down`** - This gracefully stops containers
2. **Don't force kill** - Avoid `docker kill` unless necessary
3. **Check logs before stopping** - `docker-compose logs` to see what's happening
4. **Backup important data** - Use the backup scripts if needed
5. **Wait a few seconds** - After starting, give services time to initialize

---

## 🎯 Summary

**To Stop:**
1. Stop Node.js services (Ctrl+C)
2. Run `docker-compose down`

**To Restart:**
1. Run `docker-compose up -d`
2. Start Node.js services
3. Everything should work as before!

**Your data is safe** - All database data is stored in Docker volumes and persists between restarts.
