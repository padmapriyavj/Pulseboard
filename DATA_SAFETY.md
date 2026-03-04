# PulseBoard – Keeping Your Data Safe

User data (and sensors, alerts, insights) can disappear if the **database volume is empty** when TimescaleDB starts. That usually happens when:

- The volume was recreated (e.g. after Docker reset, or running from a different folder).
- You ran `docker compose down -v` (the `-v` deletes volumes).
- A different Compose project name was used, so Docker created a **different** volume.

Here’s how to avoid that and recover if it happens.

---

## 1. Use a stable volume name

The `docker-compose.yml` uses a **named volume**: `pulseboard_timescaledb_data`.  
That name stays the same no matter which folder you run `docker compose` from, so the same data is reused.

Always start/stop from the **same project root**:

```bash
cd /Users/padmapriyavijayaragavarengaraj/Documents/GitHub/Pulseboard
docker compose up -d
# ...
docker compose down   # no -v
```

---

## 2. Never delete the volume

- Use **`docker compose down`** (no `-v`).  
- Do **not** use `docker compose down -v` unless you intend to wipe all data.  
- Avoid “prune volumes” or “reset Docker” unless you’ve backed up and accept data loss.

---

## 3. Backup before shutdown (recommended)

Before stopping the stack (or before any risky change), run a backup:

```bash
cd /Users/padmapriyavijayaragavarengaraj/Documents/GitHub/Pulseboard
chmod +x scripts/backup-db.sh   # once
./scripts/backup-db.sh
```

This creates a file like `backups/pulseboard_20260221_143022.sql`.  
Keep that file somewhere safe (e.g. outside the repo, or in cloud storage).  
The `backups/` folder is in `.gitignore` so it won’t be committed.

---

## 4. Restore from a backup

If data is gone but you have a backup file:

```bash
# Start the stack so the DB container is running
docker compose up -d
# Wait a few seconds for TimescaleDB to be ready, then:
./scripts/restore-db.sh backups/pulseboard_YYYYMMDD_HHMMSS.sql
```

Replace the filename with your actual backup.  
After that, user data (and sensors, alerts, insights) will be back.

---

## 5. Check that your volume exists

To see which volume is used and that it’s there:

```bash
docker volume ls | grep pulseboard
```

You should see `pulseboard_timescaledb_data`.  
If you don’t, or you see a different name (e.g. `something_else_timescaledb-data`), you may be using a different project name or path; run `docker compose` from the Pulseboard project root so it uses the named volume above.

---

## Summary

| Do | Don’t |
|----|--------|
| Run `docker compose` from the same project root | Run from different folders (different volumes) |
| Use `docker compose down` (no `-v`) | Use `docker compose down -v` |
| Run `./scripts/backup-db.sh` before risky changes | Rely only on the volume without backups |
| Keep backup files somewhere safe | Commit backup files to Git (they’re in .gitignore) |

If you follow this, user data won’t be lost unless the volume is explicitly removed or overwritten; and if something goes wrong, you can restore from a backup.
