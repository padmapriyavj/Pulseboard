#!/bin/bash

echo "🛑 Stopping PulseBoard services..."
echo ""

echo "⚠️  If sensor-simulator or kafka-processor are running in other terminals,"
echo "   stop them first with Ctrl+C so they exit cleanly."
echo ""

# Stop Docker containers (no -v: keeps database volume)
echo "Stopping Docker containers (data is kept)..."
docker-compose down

echo ""
echo "✅ All Docker services stopped"
echo ""
echo "💡 Your database data is in the Docker volume and will be there when you"
echo "   run ./start_all.sh again. Never use 'docker-compose down -v' unless"
echo "   you intend to delete all data."
echo ""
