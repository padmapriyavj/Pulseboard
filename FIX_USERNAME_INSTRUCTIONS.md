# Fix User Name Display Issue

## Steps to Fix:

### 1. Rebuild the auth-service container (required!)
The auth-service container needs to be **rebuilt** (not just restarted) to pick up code changes:

```bash
docker-compose build auth-service
docker-compose up -d auth-service
```

Or rebuild everything:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### 2. Clear browser localStorage and log out
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Application/Storage tab → Local Storage
3. Clear all items OR manually delete:
   - `token`
   - `org_id`
   - `user_name`
4. Close and reopen the browser

### 3. Check your user in the database
Your existing user account might not have a `name` field. To check and fix:

```bash
# Connect to the database
docker exec -it timescaledb psql -U postgres -d pulseboard

# Check your user
SELECT id, name, email, org_id FROM users WHERE email = 'your-email@example.com';

# If name is NULL, update it:
UPDATE users SET name = 'Your Name' WHERE email = 'your-email@example.com';

# Exit
\q
```

### 4. Log in again
After rebuilding and clearing localStorage, log in again. The name should now be displayed.

### 5. Check console logs
After logging in, check:
- Browser console (F12) - should show "Login response:" and "Setting userName:"
- Auth-service logs - should show "User login - name from DB:" and "computed userName:"

```bash
docker-compose logs auth-service
```

