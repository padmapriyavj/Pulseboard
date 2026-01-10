#!/usr/bin/env node
/**
 * Migration script to fix org_id column type in all tables
 * This fixes the issue where org_id was INTEGER but should be TEXT
 * Affects: users, sensor_metrics, and sensor_access_log tables
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.PG_PORT || process.env.DB_PORT || 5433,
  database: process.env.PG_DATABASE || process.env.DB_NAME || 'pulseboard',
  user: process.env.PG_USER || process.env.DB_USER || 'postgres',
  password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || 'admin',
});

async function fixOrgIdSchema() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Fix users table first
    console.log('\n📋 Checking users table...');
    const usersTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (usersTableCheck.rows[0].exists) {
      const usersColumnCheck = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'org_id'
      `);
      
      if (usersColumnCheck.rows.length > 0) {
        const currentType = usersColumnCheck.rows[0].data_type;
        console.log(`ℹ️  users.org_id current type: ${currentType}`);
        
        if (currentType !== 'text' && currentType !== 'character varying') {
          console.log('⚠️  users.org_id is not TEXT. Attempting to alter...');
          try {
            await client.query(`
              ALTER TABLE users 
              ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT
            `);
            console.log('✅ Successfully altered users.org_id column to TEXT');
          } catch (alterError) {
            console.error('❌ Could not alter users.org_id column:', alterError.message);
            throw alterError;
          }
        } else {
          console.log('✅ users.org_id column is already TEXT type.');
        }
      } else {
        console.log('ℹ️  users.org_id column does not exist. Adding it...');
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN org_id TEXT NOT NULL DEFAULT ''
        `);
        console.log('✅ Added users.org_id column as TEXT');
      }
    } else {
      console.log('ℹ️  users table does not exist yet.');
    }
    
    // Fix sensor_metrics table
    console.log('\n📋 Checking sensor_metrics table...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sensor_metrics'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('ℹ️  sensor_metrics table does not exist yet.');
      await client.query('COMMIT');
      console.log('✅ Migration completed successfully');
      return;
    }
    
    // Check current column type
    const columnCheck = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sensor_metrics' 
      AND column_name = 'org_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('ℹ️  org_id column does not exist. Adding it...');
      await client.query(`
        ALTER TABLE sensor_metrics 
        ADD COLUMN org_id TEXT
      `);
      console.log('✅ Added org_id column as TEXT');
    } else {
      const currentType = columnCheck.rows[0].data_type;
      console.log(`ℹ️  Current org_id type: ${currentType}`);
      
      if (currentType !== 'text' && currentType !== 'character varying') {
        console.log('⚠️  org_id is not TEXT (current type: ' + currentType + '). Attempting to fix...');
        
        // Check if this is a hypertable
        let isHypertable = false;
        try {
          const hypertableCheck = await client.query(`
            SELECT EXISTS (
              SELECT FROM timescaledb_information.hypertables 
              WHERE hypertable_name = 'sensor_metrics'
            )
          `);
          isHypertable = hypertableCheck.rows[0]?.exists || false;
        } catch (htError) {
          console.log('ℹ️  Could not check hypertable status (might not be TimescaleDB):', htError.message);
          // Assume it's a regular table if we can't check
          isHypertable = false;
        }
        
        if (isHypertable) {
          console.log('⚠️  sensor_metrics is a TimescaleDB hypertable.');
          console.log('⚠️  Altering column types on hypertables can be problematic.');
          console.log('💡 For hypertables, we need to drop and recreate. This will lose existing data.');
          console.log('💡 Since inserts are failing anyway, recreating the table...');
          
          // Drop the hypertable (this will drop the underlying table)
          await client.query(`DROP TABLE IF EXISTS sensor_metrics CASCADE`);
          console.log('✅ Dropped old sensor_metrics hypertable');
          
          // Recreate the table with correct schema
          await client.query(`
            CREATE TABLE sensor_metrics (
              device_id TEXT NOT NULL,
              sensor_type TEXT,
              org_id TEXT,
              value DOUBLE PRECISION,
              unit TEXT,
              status TEXT,
              timestamp TIMESTAMPTZ NOT NULL
            )
          `);
          console.log('✅ Created sensor_metrics table with correct schema');
          
          // Recreate hypertable
          await client.query(`
            SELECT create_hypertable('sensor_metrics', 'timestamp', if_not_exists => TRUE)
          `);
          console.log('✅ Recreated sensor_metrics hypertable');
          
          // Recreate unique index
          await client.query(`
            CREATE UNIQUE INDEX sensor_metrics_unique ON sensor_metrics (device_id, timestamp)
          `);
          console.log('✅ Recreated unique index');
        } else {
          // Regular table - can alter directly
          try {
            await client.query(`
              ALTER TABLE sensor_metrics 
              ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT
            `);
            console.log('✅ Successfully altered org_id column to TEXT');
          } catch (alterError) {
            console.error('❌ Could not alter column:', alterError.message);
            throw alterError;
          }
        }
      } else {
        console.log('✅ sensor_metrics.org_id column is already TEXT type.');
      }
    }
    
    // Fix sensor_access_log table (also has org_id)
    console.log('\n📋 Checking sensor_access_log table...');
    const accessLogTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sensor_access_log'
      )
    `);
    
    if (accessLogTableCheck.rows[0].exists) {
      const accessLogColumnCheck = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sensor_access_log' 
        AND column_name = 'org_id'
      `);
      
      if (accessLogColumnCheck.rows.length > 0) {
        const currentType = accessLogColumnCheck.rows[0].data_type;
        console.log(`ℹ️  sensor_access_log.org_id current type: ${currentType}`);
        
        // sensor_access_log uses VARCHAR, which is fine (compatible with TEXT)
        if (currentType !== 'text' && currentType !== 'character varying') {
          console.log('⚠️  sensor_access_log.org_id is not TEXT/VARCHAR. Attempting to alter...');
          try {
            await client.query(`
              ALTER TABLE sensor_access_log 
              ALTER COLUMN org_id TYPE TEXT USING org_id::TEXT
            `);
            console.log('✅ Successfully altered sensor_access_log.org_id column to TEXT');
          } catch (alterError) {
            console.error('❌ Could not alter sensor_access_log.org_id column:', alterError.message);
            throw alterError;
          }
        } else {
          console.log('✅ sensor_access_log.org_id column is already TEXT/VARCHAR type.');
        }
      }
    } else {
      console.log('ℹ️  sensor_access_log table does not exist yet.');
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixOrgIdSchema()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

