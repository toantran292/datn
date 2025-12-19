/**
 * Clear All Seed Data
 *
 * Clears all demo/seed data from all services.
 * Use this before running seed to ensure clean state.
 *
 * Usage:
 *   npx tsx scripts/seeds/clear-all.ts
 *   npm run clear
 */

import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { DB_CONFIG } from './seed-constants';

async function clearDatabase(
  database: string,
  tables: string[],
  serviceName: string
): Promise<void> {
  console.log(`\n🧹 Clearing ${serviceName}...`);

  const pool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database,
  });

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const table of tables) {
        try {
          await client.query(`DELETE FROM ${table}`);
          console.log(`  ✅ Cleared ${table}`);
        } catch (e: any) {
          if (e.code === '42P01') {
            // relation does not exist
            console.log(`  ⏭️  Table ${table} does not exist, skipping`);
          } else {
            throw e;
          }
        }
      }

      await client.query('COMMIT');
      console.log(`✅ ${serviceName} cleared!`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === '3D000') {
      // database does not exist
      console.log(`  ⚠️  Database ${database} does not exist, skipping`);
    } else {
      console.error(`  ❌ Error clearing ${serviceName}:`, error.message);
    }
  } finally {
    await pool.end();
  }
}

async function clearIdentity(): Promise<void> {
  const tables = [
    'audit_logs',
    'role_bindings',
    'memberships',
    'invitations',
    'external_identities',
    'organizations',
    'users',
  ];

  await clearDatabase(DB_CONFIG.POSTGRES.databases.identity, tables, 'Identity Service');
}

async function clearPM(): Promise<void> {
  const tables = [
    'issue_activity',
    'issue_comment',
    'issue',
    'sprint',
    'issue_status',
    'project_member',
    'project',
  ];

  await clearDatabase(DB_CONFIG.POSTGRES.databases.pm, tables, 'PM Service');
}

async function clearChat(): Promise<void> {
  const tables = [
    'document_summaries',
    'document_embeddings',
    'channel_ai_configs',
    'channel_notification_settings',
    'pinned_messages',
    'message_reactions',
    'message_attachments',
    'messages',
    'room_members',
    'rooms',
  ];

  await clearDatabase(DB_CONFIG.POSTGRES.databases.chat, tables, 'Chat Service');
}

async function clearMeeting(): Promise<void> {
  // Meeting uses Prisma with PascalCase table names
  const tables = [
    '"Transcript"',
    '"MeetingEvent"',
    '"Recording"',
    '"Participant"',
    '"Meeting"',
  ];

  await clearDatabase(DB_CONFIG.POSTGRES.databases.meeting, tables, 'Meeting Service');
}

async function clearNotification(): Promise<void> {
  const tables = ['notifications'];

  await clearDatabase(
    DB_CONFIG.POSTGRES.databases.notification,
    tables,
    'Notification Service'
  );
}

async function clearMongoDB(): Promise<void> {
  console.log('\n🧹 Clearing MongoDB (File Storage)...');

  const client = new MongoClient(DB_CONFIG.MONGODB.uri);

  try {
    await client.connect();

    const db = client.db(DB_CONFIG.MONGODB.databases.fileStorage);

    const collections = ['folders', 'file_metadata'];

    for (const collection of collections) {
      try {
        await db.collection(collection).deleteMany({});
        console.log(`  ✅ Cleared ${collection}`);
      } catch (e: any) {
        console.log(`  ⚠️  Collection ${collection} error: ${e.message}`);
      }
    }

    console.log('✅ MongoDB cleared!');
  } catch (error: any) {
    console.error('  ❌ Error clearing MongoDB:', error.message);
  } finally {
    await client.close();
  }
}

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              CLEAR ALL SEED DATA                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  WARNING: This will delete ALL data from the databases!');
  console.log('');

  const startTime = Date.now();

  // Clear in reverse dependency order
  await clearMongoDB();
  await clearMeeting();
  await clearNotification();
  await clearChat();
  await clearPM();
  await clearIdentity();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              ALL DATA CLEARED                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`⏱️  Total time: ${duration}s`);
  console.log('');
  console.log('You can now run: npm run seed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
