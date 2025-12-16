/**
 * Clear Demo Data Script
 *
 * Clears all demo data from services (be careful in production!)
 *
 * Usage:
 *   npx ts-node scripts/clear-demo-data.ts
 */

import { Client } from 'pg';

const config = {
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '41000', 10),
    user: process.env.POSTGRES_USER || 'uts',
    password: process.env.POSTGRES_PASSWORD || 'uts_dev_pw',
  },
  databases: {
    identity: process.env.IDENTITY_DB || 'identity',
    chat: process.env.CHAT_DB || 'chat_db',
    notification: process.env.NOTIFICATION_DB || 'notification_db',
  },
};

async function createClient(database: string): Promise<Client> {
  const client = new Client({
    host: config.postgres.host,
    port: config.postgres.port,
    user: config.postgres.user,
    password: config.postgres.password,
    database,
  });
  await client.connect();
  return client;
}

async function clearIdentityService() {
  console.log('\n🧹 Clearing Identity Service...');
  let client;
  try {
    client = await createClient(config.databases.identity);
  } catch (error: any) {
    console.error('  ⚠️ Could not connect to Identity database:', error.message);
    return;
  }

  try {
    // Delete in order of dependencies
    await client.query(`DELETE FROM role_bindings WHERE scope = 'ORG'`);
    await client.query(`DELETE FROM memberships`);
    await client.query(`DELETE FROM invitations`);
    await client.query(`DELETE FROM external_identities`);
    await client.query(`DELETE FROM organizations`);
    await client.query(`DELETE FROM users WHERE email LIKE '%@demo.com'`);

    console.log('  ✅ Identity Service cleared!');
  } catch (error) {
    console.error('  ❌ Error:', error);
  } finally {
    await client.end();
  }
}

async function clearChatService() {
  console.log('\n🧹 Clearing Chat Service...');
  let client;
  try {
    client = await createClient(config.databases.chat);
  } catch (error: any) {
    console.error('  ⚠️ Could not connect to Chat database:', error.message);
    return;
  }

  try {
    // Delete in order of dependencies (ignore if tables don't exist)
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
    for (const table of tables) {
      try {
        await client.query(`DELETE FROM ${table}`);
      } catch (e: any) {
        if (e.code !== '42P01') throw e; // 42P01 = relation does not exist
      }
    }

    console.log('  ✅ Chat Service cleared!');
  } catch (error) {
    console.error('  ❌ Error:', error);
  } finally {
    await client.end();
  }
}

async function clearNotificationService() {
  console.log('\n🧹 Clearing Notification Service...');
  let client;
  try {
    client = await createClient(config.databases.notification);
  } catch (error: any) {
    console.error('  ⚠️ Could not connect to Notification database:', error.message);
    return;
  }

  try {
    await client.query(`DELETE FROM notifications`);

    console.log('  ✅ Notification Service cleared!');
  } catch (error) {
    console.error('  ❌ Error:', error);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🧹 Clearing all demo data...');
  console.log('⚠️  WARNING: This will delete all data from the databases!');
  console.log('');

  await clearNotificationService();
  await clearChatService();
  await clearIdentityService();

  console.log('\n✅ All demo data cleared!');
}

main();
