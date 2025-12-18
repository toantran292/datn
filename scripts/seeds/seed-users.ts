/**
 * Seed Users
 *
 * Creates demo users in the Identity service database.
 *
 * Schema Reference: services/identity/src/main/resources/db/migration/V1__init.sql
 * Tables: users
 */

import { Pool } from 'pg';
import {
  SAMPLE_USERS,
  DB_CONFIG,
  hashPassword,
  daysAgo,
} from './seed-constants';

async function seedUsers() {
  const pool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database: DB_CONFIG.POSTGRES.databases.identity,
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Seeding users...');

    await client.query('BEGIN');

    const passwordHash = await hashPassword();

    for (const user of SAMPLE_USERS) {
      // Check if user exists
      const existing = await client.query(
        'SELECT id FROM users WHERE id = $1 OR email = $2',
        [user.id, user.email]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  User ${user.email} already exists, skipping`);
        continue;
      }

      await client.query(
        `INSERT INTO users (
          id, email, password_hash, display_name, phone,
          email_verified_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          user.email,
          passwordHash,
          user.name,
          user.phone,
          daysAgo(30), // email verified 30 days ago
          daysAgo(60), // account created 60 days ago
          new Date(),
        ]
      );

      console.log(`  ✅ Created user: ${user.email} (${user.name})`);
    }

    await client.query('COMMIT');
    console.log(`✅ Seeded ${SAMPLE_USERS.length} users successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedUsers };
