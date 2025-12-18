/**
 * Seed Projects
 *
 * Creates demo projects, sprints, and issue statuses in the PM service database.
 * Projects are at various stages to demonstrate AI capabilities.
 *
 * Schema Reference: services/pm/prisma/schema.prisma
 * Tables: project, sprint, issue_status, project_member
 */

import { Pool } from 'pg';
import {
  PROJECT_IDS,
  SPRINT_IDS,
  USER_IDS,
  ORG_IDS,
  DB_CONFIG,
  SPRINT_STATUS,
  STATUS_COLORS,
  daysAgo,
  daysFromNow,
  newId,
} from './seed-constants';

interface Project {
  id: string;
  orgId: string;
  identifier: string;
  name: string;
  description: string;
  projectLead: string;
  defaultAssignee: string | null;
}

interface Sprint {
  id: string;
  projectId: string;
  name: string;
  status: string;
  goal: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface IssueStatus {
  id: string;
  projectId: string;
  name: string;
  description: string;
  color: string;
  order: number;
}

interface ProjectMember {
  projectId: string;
  userId: string;
  role: string;
}

// =============================================================================
// PROJECTS - Various stages of development
// =============================================================================
const PROJECTS: Project[] = [
  // ACME Corp Projects
  {
    id: PROJECT_IDS.ACME_ECOMMERCE,
    orgId: ORG_IDS.ACME,
    identifier: 'ECOM',
    name: 'E-Commerce Platform',
    description: 'Complete e-commerce solution with payment processing, inventory management, and analytics dashboard. Currently in active development with Sprint 3.',
    projectLead: USER_IDS.ACME_PM_1,
    defaultAssignee: USER_IDS.ACME_DEV_1,
  },
  {
    id: PROJECT_IDS.ACME_MOBILE_APP,
    orgId: ORG_IDS.ACME,
    identifier: 'MOB',
    name: 'Mobile Application',
    description: 'React Native mobile app for iOS and Android. Companion app to the e-commerce platform.',
    projectLead: USER_IDS.ACME_PM_2,
    defaultAssignee: USER_IDS.ACME_DEV_2,
  },
  {
    id: PROJECT_IDS.ACME_ADMIN_PORTAL,
    orgId: ORG_IDS.ACME,
    identifier: 'ADM',
    name: 'Admin Portal',
    description: 'Internal admin dashboard for managing products, orders, and customers. Maintenance phase.',
    projectLead: USER_IDS.ACME_PM_1,
    defaultAssignee: USER_IDS.ACME_DEV_3,
  },
  {
    id: PROJECT_IDS.ACME_API_V2,
    orgId: ORG_IDS.ACME,
    identifier: 'API2',
    name: 'API v2.0 Migration',
    description: 'Migrating REST API to GraphQL with improved performance and security. Planning phase.',
    projectLead: USER_IDS.ACME_DEV_1,
    defaultAssignee: null,
  },
  {
    id: PROJECT_IDS.ACME_INFRA,
    orgId: ORG_IDS.ACME,
    identifier: 'INFRA',
    name: 'Infrastructure Modernization',
    description: 'Moving to Kubernetes, implementing GitOps, and setting up monitoring.',
    projectLead: USER_IDS.ACME_ADMIN,
    defaultAssignee: USER_IDS.ACME_DEV_1,
  },

  // Tech Startup Projects
  {
    id: PROJECT_IDS.STARTUP_MVP,
    orgId: ORG_IDS.TECH_STARTUP,
    identifier: 'MVP',
    name: 'Product MVP',
    description: 'Minimum viable product development. Core features for initial launch. Sprint 2 active.',
    projectLead: USER_IDS.STARTUP_CTO,
    defaultAssignee: USER_IDS.STARTUP_DEV_1,
  },
  {
    id: PROJECT_IDS.STARTUP_LANDING,
    orgId: ORG_IDS.TECH_STARTUP,
    identifier: 'WEB',
    name: 'Marketing Website',
    description: 'Landing page and marketing website with blog. Nearly complete.',
    projectLead: USER_IDS.STARTUP_OWNER,
    defaultAssignee: USER_IDS.STARTUP_DEV_2,
  },
  {
    id: PROJECT_IDS.STARTUP_BACKEND,
    orgId: ORG_IDS.TECH_STARTUP,
    identifier: 'BACK',
    name: 'Backend Services',
    description: 'API services, database design, and authentication system.',
    projectLead: USER_IDS.STARTUP_CTO,
    defaultAssignee: USER_IDS.STARTUP_DEV_3,
  },

  // Innovation Labs Projects
  {
    id: PROJECT_IDS.LABS_AI_RESEARCH,
    orgId: ORG_IDS.INNOVATION_LABS,
    identifier: 'AIR',
    name: 'AI Research Initiative',
    description: 'Exploring new AI/ML techniques for document processing and natural language understanding.',
    projectLead: USER_IDS.LABS_LEAD,
    defaultAssignee: USER_IDS.LABS_RESEARCHER_1,
  },
  {
    id: PROJECT_IDS.LABS_POC,
    orgId: ORG_IDS.INNOVATION_LABS,
    identifier: 'POC',
    name: 'Proof of Concept',
    description: 'Building proof of concept for new product ideas. Research and exploration phase.',
    projectLead: USER_IDS.LABS_OWNER,
    defaultAssignee: USER_IDS.LABS_RESEARCHER_2,
  },
];

// =============================================================================
// SPRINTS - Different statuses (FUTURE, ACTIVE, CLOSED)
// =============================================================================
const SPRINTS: Sprint[] = [
  // ACME E-Commerce Sprints
  {
    id: SPRINT_IDS.ECOM_SPRINT_1,
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    name: 'Sprint 1 - Foundation',
    status: SPRINT_STATUS.CLOSED,
    goal: 'Set up project infrastructure, basic product catalog, and user authentication',
    startDate: daysAgo(42),
    endDate: daysAgo(29),
  },
  {
    id: SPRINT_IDS.ECOM_SPRINT_2,
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    name: 'Sprint 2 - Shopping Cart',
    status: SPRINT_STATUS.CLOSED,
    goal: 'Implement shopping cart, checkout flow, and payment integration',
    startDate: daysAgo(28),
    endDate: daysAgo(15),
  },
  {
    id: SPRINT_IDS.ECOM_SPRINT_3,
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    name: 'Sprint 3 - Order Management',
    status: SPRINT_STATUS.ACTIVE,
    goal: 'Order processing, shipping integration, and email notifications',
    startDate: daysAgo(14),
    endDate: daysFromNow(1),
  },
  {
    id: SPRINT_IDS.ECOM_SPRINT_4,
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    name: 'Sprint 4 - Analytics',
    status: SPRINT_STATUS.FUTURE,
    goal: 'Analytics dashboard, reporting, and performance optimization',
    startDate: daysFromNow(2),
    endDate: daysFromNow(16),
  },

  // ACME Mobile Sprints
  {
    id: SPRINT_IDS.MOBILE_SPRINT_1,
    projectId: PROJECT_IDS.ACME_MOBILE_APP,
    name: 'Sprint 1 - App Setup',
    status: SPRINT_STATUS.CLOSED,
    goal: 'React Native setup, navigation, and API integration',
    startDate: daysAgo(21),
    endDate: daysAgo(8),
  },
  {
    id: SPRINT_IDS.MOBILE_SPRINT_2,
    projectId: PROJECT_IDS.ACME_MOBILE_APP,
    name: 'Sprint 2 - Core Features',
    status: SPRINT_STATUS.ACTIVE,
    goal: 'Product browsing, cart functionality, and user profile',
    startDate: daysAgo(7),
    endDate: daysFromNow(7),
  },

  // Tech Startup MVP Sprints
  {
    id: SPRINT_IDS.MVP_SPRINT_1,
    projectId: PROJECT_IDS.STARTUP_MVP,
    name: 'Sprint 1 - Core Setup',
    status: SPRINT_STATUS.CLOSED,
    goal: 'Project setup, authentication, and basic UI',
    startDate: daysAgo(35),
    endDate: daysAgo(22),
  },
  {
    id: SPRINT_IDS.MVP_SPRINT_2,
    projectId: PROJECT_IDS.STARTUP_MVP,
    name: 'Sprint 2 - Main Features',
    status: SPRINT_STATUS.ACTIVE,
    goal: 'Core product features and user workflows',
    startDate: daysAgo(21),
    endDate: daysAgo(1),
  },
  {
    id: SPRINT_IDS.MVP_SPRINT_3,
    projectId: PROJECT_IDS.STARTUP_MVP,
    name: 'Sprint 3 - Polish',
    status: SPRINT_STATUS.FUTURE,
    goal: 'Bug fixes, performance, and launch preparation',
    startDate: daysFromNow(0),
    endDate: daysFromNow(14),
  },
];

// =============================================================================
// ISSUE STATUSES - Default statuses per project
// =============================================================================
function generateIssueStatuses(projectId: string): IssueStatus[] {
  return [
    { id: newId(), projectId, name: 'TO DO', description: 'Not started', color: STATUS_COLORS.TODO, order: 0 },
    { id: newId(), projectId, name: 'IN PROGRESS', description: 'Work in progress', color: STATUS_COLORS.IN_PROGRESS, order: 1 },
    { id: newId(), projectId, name: 'IN REVIEW', description: 'Pending review', color: STATUS_COLORS.IN_REVIEW, order: 2 },
    { id: newId(), projectId, name: 'DONE', description: 'Completed', color: STATUS_COLORS.DONE, order: 3 },
  ];
}

// =============================================================================
// PROJECT MEMBERS
// =============================================================================
const PROJECT_MEMBERS: ProjectMember[] = [
  // ACME E-Commerce Team
  { projectId: PROJECT_IDS.ACME_ECOMMERCE, userId: USER_IDS.ACME_PM_1, role: 'lead' },
  { projectId: PROJECT_IDS.ACME_ECOMMERCE, userId: USER_IDS.ACME_DEV_1, role: 'member' },
  { projectId: PROJECT_IDS.ACME_ECOMMERCE, userId: USER_IDS.ACME_DEV_2, role: 'member' },
  { projectId: PROJECT_IDS.ACME_ECOMMERCE, userId: USER_IDS.ACME_QA_1, role: 'member' },
  { projectId: PROJECT_IDS.ACME_ECOMMERCE, userId: USER_IDS.ACME_DESIGNER, role: 'member' },

  // ACME Mobile Team
  { projectId: PROJECT_IDS.ACME_MOBILE_APP, userId: USER_IDS.ACME_PM_2, role: 'lead' },
  { projectId: PROJECT_IDS.ACME_MOBILE_APP, userId: USER_IDS.ACME_DEV_2, role: 'member' },
  { projectId: PROJECT_IDS.ACME_MOBILE_APP, userId: USER_IDS.ACME_DEV_3, role: 'member' },
  { projectId: PROJECT_IDS.ACME_MOBILE_APP, userId: USER_IDS.ACME_QA_2, role: 'member' },

  // Tech Startup MVP Team
  { projectId: PROJECT_IDS.STARTUP_MVP, userId: USER_IDS.STARTUP_CTO, role: 'lead' },
  { projectId: PROJECT_IDS.STARTUP_MVP, userId: USER_IDS.STARTUP_DEV_1, role: 'member' },
  { projectId: PROJECT_IDS.STARTUP_MVP, userId: USER_IDS.STARTUP_DEV_2, role: 'member' },
  { projectId: PROJECT_IDS.STARTUP_MVP, userId: USER_IDS.STARTUP_DEV_3, role: 'member' },

  // Innovation Labs AI Research Team
  { projectId: PROJECT_IDS.LABS_AI_RESEARCH, userId: USER_IDS.LABS_LEAD, role: 'lead' },
  { projectId: PROJECT_IDS.LABS_AI_RESEARCH, userId: USER_IDS.LABS_RESEARCHER_1, role: 'member' },
  { projectId: PROJECT_IDS.LABS_AI_RESEARCH, userId: USER_IDS.LABS_RESEARCHER_2, role: 'member' },
];

async function seedProjects() {
  const pool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database: DB_CONFIG.POSTGRES.databases.pm,
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Seeding projects...');

    await client.query('BEGIN');

    // Create projects
    for (const project of PROJECTS) {
      const existing = await client.query(
        'SELECT id FROM project WHERE id = $1',
        [project.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Project ${project.identifier} already exists, skipping`);
        continue;
      }

      await client.query(
        `INSERT INTO project (
          id, org_id, identifier, name, description,
          project_lead, default_assignee, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          project.id,
          project.orgId,
          project.identifier,
          project.name,
          project.description,
          project.projectLead,
          project.defaultAssignee,
          daysAgo(60),
          new Date(),
        ]
      );

      console.log(`  ✅ Created project: ${project.name} (${project.identifier})`);

      // Create default statuses for this project
      const statuses = generateIssueStatuses(project.id);
      for (const status of statuses) {
        await client.query(
          `INSERT INTO issue_status (
            id, project_id, name, description, color, "order", created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            status.id,
            status.projectId,
            status.name,
            status.description,
            status.color,
            status.order,
            daysAgo(60),
            new Date(),
          ]
        );
      }
      console.log(`     ✅ Created ${statuses.length} issue statuses`);
    }

    // Create sprints
    console.log('🌱 Seeding sprints...');

    for (const sprint of SPRINTS) {
      const existing = await client.query(
        'SELECT id FROM sprint WHERE id = $1',
        [sprint.id]
      );

      if (existing.rows.length > 0) {
        continue;
      }

      await client.query(
        `INSERT INTO sprint (
          id, project_id, name, status, goal,
          start_date, end_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          sprint.id,
          sprint.projectId,
          sprint.name,
          sprint.status,
          sprint.goal,
          sprint.startDate,
          sprint.endDate,
          daysAgo(45),
          new Date(),
        ]
      );

      console.log(`  ✅ Created sprint: ${sprint.name} (${sprint.status})`);
    }

    // Create project members
    console.log('🌱 Seeding project members...');

    for (const member of PROJECT_MEMBERS) {
      const existing = await client.query(
        'SELECT id FROM project_member WHERE project_id = $1 AND user_id = $2',
        [member.projectId, member.userId]
      );

      if (existing.rows.length > 0) {
        continue;
      }

      await client.query(
        `INSERT INTO project_member (id, project_id, user_id, role, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId(), member.projectId, member.userId, member.role, daysAgo(50)]
      );
    }

    console.log(`  ✅ Created ${PROJECT_MEMBERS.length} project members`);

    await client.query('COMMIT');
    console.log('✅ Seeded projects successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding projects:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedProjects()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedProjects, PROJECTS, SPRINTS };
