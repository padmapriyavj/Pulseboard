#!/bin/bash

echo "🔍 Checking alerts setup..."
echo ""

echo "1. Checking alerts in database:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT COUNT(*) as total_alerts, org_id FROM alerts GROUP BY org_id;"
echo ""

echo "2. Checking recent alerts:"
docker exec timescaledb psql -U postgres -d pulseboard -c "SELECT id, org_id, sensor_name, severity, created_at FROM alerts ORDER BY created_at DESC LIMIT 5;"
echo ""

echo "3. Testing GraphQL query (if API is running):"
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { getAlerts(org_id: \"google\", limit: 5) { id sensor_name severity message } }"}' \
  2>/dev/null | python3 -m json.tool 2>/dev/null || echo "GraphQL API might not be running or there's an error"
echo ""

echo "4. Check your browser console for:"
echo "   - What orgId is being used"
echo "   - Any GraphQL errors"
echo "   - The debug logs from AlertsPage"
echo ""

echo "💡 If alerts exist but don't show:"
echo "   - Make sure you're logged in with org_id = 'google'"
echo "   - Check browser console (F12) for errors"
echo "   - Try restarting GraphQL API: docker-compose restart graphql-api"
echo ""
