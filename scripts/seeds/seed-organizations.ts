/**
 * Seed Organizations
 *
 * Creates demo organizations and memberships in the Identity service database.
 *
 * Schema Reference: services/identity/src/main/resources/db/migration/V1__init.sql
 * Tables: organizations, memberships, role_bindings
 */

import { Pool } from 'pg';
import {
  SAMPLE_ORGANIZATIONS,
  USER_IDS,
  ORG_IDS,
  DB_CONFIG,
  MEMBER_TYPE,
  MEMBER_ROLE,
  daysAgo,
} from './seed-constants';

interface Membership {
  userId: string;
  orgId: string;
  roles: string[];
  memberType: string;
}

const MEMBERSHIPS: Membership[] = [
  // ACME Corp memberships
  { userId: USER_IDS.ACME_OWNER, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.OWNER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_ADMIN, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.ADMIN], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_DEV_1, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_DEV_2, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_DEV_3, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_PM_1, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.ADMIN], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_PM_2, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_QA_1, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_QA_2, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.ACME_DESIGNER, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },

  // Tech Startup memberships
  { userId: USER_IDS.STARTUP_OWNER, orgId: ORG_IDS.TECH_STARTUP, roles: [MEMBER_ROLE.OWNER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.STARTUP_CTO, orgId: ORG_IDS.TECH_STARTUP, roles: [MEMBER_ROLE.ADMIN], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.STARTUP_DEV_1, orgId: ORG_IDS.TECH_STARTUP, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.STARTUP_DEV_2, orgId: ORG_IDS.TECH_STARTUP, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.STARTUP_DEV_3, orgId: ORG_IDS.TECH_STARTUP, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },

  // Innovation Labs memberships
  { userId: USER_IDS.LABS_OWNER, orgId: ORG_IDS.INNOVATION_LABS, roles: [MEMBER_ROLE.OWNER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.LABS_LEAD, orgId: ORG_IDS.INNOVATION_LABS, roles: [MEMBER_ROLE.ADMIN], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.LABS_RESEARCHER_1, orgId: ORG_IDS.INNOVATION_LABS, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },
  { userId: USER_IDS.LABS_RESEARCHER_2, orgId: ORG_IDS.INNOVATION_LABS, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.STAFF },

  // Cross-org partnerships (partner members)
  { userId: USER_IDS.LABS_LEAD, orgId: ORG_IDS.ACME, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.PARTNER },
  { userId: USER_IDS.STARTUP_CTO, orgId: ORG_IDS.INNOVATION_LABS, roles: [MEMBER_ROLE.MEMBER], memberType: MEMBER_TYPE.PARTNER },
];

async function seedOrganizations() {
  const pool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database: DB_CONFIG.POSTGRES.databases.identity,
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Seeding organizations...');

    await client.query('BEGIN');

    // Create organizations
    for (const org of SAMPLE_ORGANIZATIONS) {
      const existing = await client.query(
        'SELECT id FROM organizations WHERE id = $1 OR slug = $2',
        [org.id, org.slug]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Organization ${org.slug} already exists, skipping`);
        continue;
      }

      await client.query(
        `INSERT INTO organizations (
          id, slug, display_name, description, llm_provider,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          org.id,
          org.slug,
          org.displayName,
          org.description,
          org.llmProvider,
          'ACTIVE',
          daysAgo(90),
          new Date(),
        ]
      );

      console.log(`  ✅ Created organization: ${org.displayName}`);
    }

    // Create memberships
    console.log('🌱 Seeding memberships...');

    for (const membership of MEMBERSHIPS) {
      const existing = await client.query(
        'SELECT user_id FROM memberships WHERE user_id = $1 AND org_id = $2',
        [membership.userId, membership.orgId]
      );

      if (existing.rows.length > 0) {
        continue; // Skip existing membership
      }

      await client.query(
        `INSERT INTO memberships (user_id, org_id, roles, member_type, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          membership.userId,
          membership.orgId,
          membership.roles,
          membership.memberType,
          daysAgo(Math.floor(Math.random() * 60) + 30), // Random join date
        ]
      );
    }

    console.log(`  ✅ Created ${MEMBERSHIPS.length} memberships`);

    await client.query('COMMIT');
    console.log('✅ Seeded organizations and memberships successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding organizations:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedOrganizations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedOrganizations };
