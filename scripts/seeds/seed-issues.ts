/**
 * Seed Issues
 *
 * Creates demo issues, comments, and activities in the PM service database.
 * Issues span multiple sprints with various priorities, types, and statuses.
 *
 * Schema Reference: services/pm/prisma/schema.prisma
 * Tables: issue, issue_comment, issue_activity
 */

import { Pool } from 'pg';
import {
  PROJECT_IDS,
  SPRINT_IDS,
  USER_IDS,
  DB_CONFIG,
  ISSUE_PRIORITY,
  ISSUE_TYPE,
  daysAgo,
  hoursAgo,
  newId,
} from './seed-constants';

interface Issue {
  id: string;
  projectId: string;
  sprintId: string | null;
  statusName: string; // Will be resolved to statusId
  parentId: string | null;
  name: string;
  description: string;
  priority: string;
  type: string;
  point: number | null;
  assignees: string[];
  createdBy: string;
  createdAt: Date;
}

interface Comment {
  issueId: string;
  projectId: string;
  comment: string;
  createdBy: string;
  createdAt: Date;
}

// =============================================================================
// ACME E-COMMERCE ISSUES - Sprint 3 (Active)
// =============================================================================
const ECOMMERCE_ISSUES: Omit<Issue, 'id'>[] = [
  // Epic
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'IN PROGRESS',
    parentId: null,
    name: 'Order Management System',
    description: `## Overview
Implement complete order management system including:
- Order processing workflow
- Shipping integration (multiple carriers)
- Email notifications
- Order tracking

## Acceptance Criteria
- [ ] Orders can be placed and processed
- [ ] Shipping labels can be generated
- [ ] Customers receive email notifications
- [ ] Order status can be tracked in real-time`,
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.EPIC,
    point: null,
    assignees: [USER_IDS.ACME_PM_1],
    createdBy: USER_IDS.ACME_PM_1,
    createdAt: daysAgo(14),
  },
  // Stories
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'DONE',
    parentId: null,
    name: 'Design order confirmation email template',
    description: 'Create responsive HTML email template for order confirmations. Include order details, shipping address, and tracking link.',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.STORY,
    point: 3,
    assignees: [USER_IDS.ACME_DESIGNER],
    createdBy: USER_IDS.ACME_PM_1,
    createdAt: daysAgo(13),
  },
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'DONE',
    parentId: null,
    name: 'Implement order creation API endpoint',
    description: `Create POST /api/orders endpoint with:
- Cart validation
- Inventory check
- Payment processing
- Order record creation
- Event publishing for notifications`,
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.STORY,
    point: 8,
    assignees: [USER_IDS.ACME_DEV_1],
    createdBy: USER_IDS.ACME_PM_1,
    createdAt: daysAgo(13),
  },
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'IN REVIEW',
    parentId: null,
    name: 'Integrate shipping carrier APIs',
    description: `Integrate with shipping carriers:
- FedEx API for rate calculation and label generation
- UPS API as backup carrier
- Support for international shipping`,
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.STORY,
    point: 13,
    assignees: [USER_IDS.ACME_DEV_2],
    createdBy: USER_IDS.ACME_PM_1,
    createdAt: daysAgo(12),
  },
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'IN PROGRESS',
    parentId: null,
    name: 'Build order tracking page',
    description: 'Customer-facing order tracking page with real-time status updates, shipping carrier tracking integration, and estimated delivery date.',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.STORY,
    point: 5,
    assignees: [USER_IDS.ACME_DEV_1, USER_IDS.ACME_DESIGNER],
    createdBy: USER_IDS.ACME_PM_1,
    createdAt: daysAgo(10),
  },
  // Bugs
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'IN PROGRESS',
    parentId: null,
    name: 'Race condition in checkout causing duplicate orders',
    description: `## Bug Report

**Environment:** Production
**Severity:** Critical

**Steps to Reproduce:**
1. Add items to cart
2. Click "Place Order" button rapidly
3. Multiple orders are created

**Expected Behavior:**
Only one order should be created

**Actual Behavior:**
2-3 duplicate orders created with same payment charged multiple times

**Root Cause Analysis:**
Need to implement idempotency key or mutex lock on order creation`,
    priority: ISSUE_PRIORITY.URGENT,
    type: ISSUE_TYPE.BUG,
    point: 5,
    assignees: [USER_IDS.ACME_DEV_1, USER_IDS.ACME_DEV_2],
    createdBy: USER_IDS.ACME_QA_1,
    createdAt: daysAgo(3),
  },
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'TO DO',
    parentId: null,
    name: 'Shipping cost not updating for international addresses',
    description: 'When user enters international shipping address, the shipping cost remains as domestic rate until page refresh.',
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.BUG,
    point: 3,
    assignees: [USER_IDS.ACME_DEV_2],
    createdBy: USER_IDS.ACME_QA_1,
    createdAt: daysAgo(2),
  },
  // Tasks
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'DONE',
    parentId: null,
    name: 'Set up SendGrid for transactional emails',
    description: 'Configure SendGrid account, API keys, and email templates for order notifications.',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.TASK,
    point: 2,
    assignees: [USER_IDS.ACME_DEV_1],
    createdBy: USER_IDS.ACME_DEV_1,
    createdAt: daysAgo(11),
  },
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'TO DO',
    parentId: null,
    name: 'Write unit tests for order service',
    description: 'Add comprehensive unit tests for OrderService including edge cases for inventory, payment failures, and concurrent orders.',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.TASK,
    point: 5,
    assignees: [USER_IDS.ACME_DEV_1],
    createdBy: USER_IDS.ACME_PM_1,
    createdAt: daysAgo(5),
  },
  {
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    sprintId: SPRINT_IDS.ECOM_SPRINT_3,
    statusName: 'TO DO',
    parentId: null,
    name: 'Performance testing for order API',
    description: 'Run load tests on order creation API to ensure it can handle 1000 concurrent orders.',
    priority: ISSUE_PRIORITY.LOW,
    type: ISSUE_TYPE.TASK,
    point: 3,
    assignees: [USER_IDS.ACME_QA_1],
    createdBy: USER_IDS.ACME_PM_1,
    createdAt: daysAgo(4),
  },
];

// =============================================================================
// TECH STARTUP MVP ISSUES - Sprint 2 (Active)
// =============================================================================
const STARTUP_MVP_ISSUES: Omit<Issue, 'id'>[] = [
  {
    projectId: PROJECT_IDS.STARTUP_MVP,
    sprintId: SPRINT_IDS.MVP_SPRINT_2,
    statusName: 'DONE',
    parentId: null,
    name: 'User dashboard implementation',
    description: 'Build main user dashboard with key metrics, recent activity, and quick actions.',
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.STORY,
    point: 8,
    assignees: [USER_IDS.STARTUP_DEV_1],
    createdBy: USER_IDS.STARTUP_CTO,
    createdAt: daysAgo(20),
  },
  {
    projectId: PROJECT_IDS.STARTUP_MVP,
    sprintId: SPRINT_IDS.MVP_SPRINT_2,
    statusName: 'IN PROGRESS',
    parentId: null,
    name: 'Implement subscription billing',
    description: 'Integrate Stripe for subscription management including plan selection, upgrades, and cancellation.',
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.STORY,
    point: 13,
    assignees: [USER_IDS.STARTUP_DEV_2, USER_IDS.STARTUP_DEV_3],
    createdBy: USER_IDS.STARTUP_CTO,
    createdAt: daysAgo(18),
  },
  {
    projectId: PROJECT_IDS.STARTUP_MVP,
    sprintId: SPRINT_IDS.MVP_SPRINT_2,
    statusName: 'IN REVIEW',
    parentId: null,
    name: 'Email verification flow',
    description: 'Implement email verification with magic link and resend functionality.',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.STORY,
    point: 5,
    assignees: [USER_IDS.STARTUP_DEV_1],
    createdBy: USER_IDS.STARTUP_CTO,
    createdAt: daysAgo(15),
  },
  {
    projectId: PROJECT_IDS.STARTUP_MVP,
    sprintId: SPRINT_IDS.MVP_SPRINT_2,
    statusName: 'TO DO',
    parentId: null,
    name: 'Mobile responsive design fixes',
    description: 'Fix layout issues on mobile devices, especially on dashboard and settings pages.',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.BUG,
    point: 3,
    assignees: [USER_IDS.STARTUP_DEV_3],
    createdBy: USER_IDS.STARTUP_DEV_1,
    createdAt: daysAgo(5),
  },
  {
    projectId: PROJECT_IDS.STARTUP_MVP,
    sprintId: SPRINT_IDS.MVP_SPRINT_3,
    statusName: 'TO DO',
    parentId: null,
    name: 'Implement data export feature',
    description: 'Allow users to export their data in CSV and JSON formats for GDPR compliance.',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.STORY,
    point: 5,
    assignees: [],
    createdBy: USER_IDS.STARTUP_OWNER,
    createdAt: daysAgo(3),
  },
];

// =============================================================================
// INNOVATION LABS ISSUES
// =============================================================================
const LABS_ISSUES: Omit<Issue, 'id'>[] = [
  {
    projectId: PROJECT_IDS.LABS_AI_RESEARCH,
    sprintId: null,
    statusName: 'IN PROGRESS',
    parentId: null,
    name: 'Evaluate LLM providers for document summarization',
    description: `Compare different LLM providers:
- OpenAI GPT-4
- Anthropic Claude
- Google PaLM

Criteria:
- Accuracy of summaries
- Cost per token
- API response time
- Context window size`,
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.STORY,
    point: null,
    assignees: [USER_IDS.LABS_RESEARCHER_1],
    createdBy: USER_IDS.LABS_LEAD,
    createdAt: daysAgo(30),
  },
  {
    projectId: PROJECT_IDS.LABS_AI_RESEARCH,
    sprintId: null,
    statusName: 'IN PROGRESS',
    parentId: null,
    name: 'Build RAG pipeline prototype',
    description: 'Create proof-of-concept for Retrieval Augmented Generation using vector embeddings and semantic search.',
    priority: ISSUE_PRIORITY.HIGH,
    type: ISSUE_TYPE.STORY,
    point: null,
    assignees: [USER_IDS.LABS_RESEARCHER_2],
    createdBy: USER_IDS.LABS_LEAD,
    createdAt: daysAgo(25),
  },
  {
    projectId: PROJECT_IDS.LABS_AI_RESEARCH,
    sprintId: null,
    statusName: 'TO DO',
    parentId: null,
    name: 'Research multi-modal AI capabilities',
    description: 'Investigate using vision models for document understanding (charts, tables, handwriting).',
    priority: ISSUE_PRIORITY.MEDIUM,
    type: ISSUE_TYPE.STORY,
    point: null,
    assignees: [USER_IDS.LABS_RESEARCHER_1, USER_IDS.LABS_RESEARCHER_2],
    createdBy: USER_IDS.LABS_OWNER,
    createdAt: daysAgo(10),
  },
];

// =============================================================================
// COMMENTS
// =============================================================================
const ISSUE_COMMENTS: Omit<Comment, 'issueId'>[] = [
  // These will be assigned to issues after creation
];

async function seedIssues() {
  const pool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database: DB_CONFIG.POSTGRES.databases.pm,
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Seeding issues...');

    await client.query('BEGIN');

    // Get status mappings for each project
    const statusMaps = new Map<string, Map<string, string>>();

    for (const projectId of [
      PROJECT_IDS.ACME_ECOMMERCE,
      PROJECT_IDS.STARTUP_MVP,
      PROJECT_IDS.LABS_AI_RESEARCH,
    ]) {
      const statuses = await client.query(
        'SELECT id, name FROM issue_status WHERE project_id = $1',
        [projectId]
      );

      const map = new Map<string, string>();
      for (const row of statuses.rows) {
        map.set(row.name, row.id);
      }
      statusMaps.set(projectId, map);
    }

    // Get current max sequence numbers from database
    const sequenceNumbers = new Map<string, number>();

    for (const projectId of [
      PROJECT_IDS.ACME_ECOMMERCE,
      PROJECT_IDS.STARTUP_MVP,
      PROJECT_IDS.LABS_AI_RESEARCH,
    ]) {
      const result = await client.query(
        'SELECT COALESCE(MAX(sequence_id), 0) as max_seq FROM issue WHERE project_id = $1',
        [projectId]
      );
      sequenceNumbers.set(projectId, parseInt(result.rows[0].max_seq, 10));
    }

    // Combine all issues
    const allIssues = [
      ...ECOMMERCE_ISSUES,
      ...STARTUP_MVP_ISSUES,
      ...LABS_ISSUES,
    ];

    let createdCount = 0;

    for (const issue of allIssues) {
      const statusMap = statusMaps.get(issue.projectId);
      if (!statusMap) {
        console.log(`  ⚠️  No status map for project ${issue.projectId}`);
        continue;
      }

      const statusId = statusMap.get(issue.statusName);
      if (!statusId) {
        console.log(`  ⚠️  Status ${issue.statusName} not found for project`);
        continue;
      }

      // Get next sequence number
      let seqNum = sequenceNumbers.get(issue.projectId) || 0;
      seqNum++;
      sequenceNumbers.set(issue.projectId, seqNum);

      const issueId = newId();

      await client.query(
        `INSERT INTO issue (
          id, project_id, sprint_id, status_id, parent_id,
          name, description, priority, type, point,
          sequence_id, sort_order, assignees_json, created_by,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          issueId,
          issue.projectId,
          issue.sprintId,
          statusId,
          issue.parentId,
          issue.name,
          issue.description,
          issue.priority,
          issue.type,
          issue.point,
          seqNum,
          seqNum * 1000, // sortOrder
          JSON.stringify(issue.assignees.map(id => ({ id }))),
          issue.createdBy,
          issue.createdAt,
          new Date(),
        ]
      );

      createdCount++;

      // Add some comments to issues
      if (issue.name.includes('Race condition')) {
        // Add discussion comments for the critical bug
        const comments = [
          { userId: USER_IDS.ACME_DEV_1, comment: 'Looking into this now. Seems like we need to implement idempotency keys.', createdAt: hoursAgo(48) },
          { userId: USER_IDS.ACME_DEV_2, comment: 'I can help with this. We should also add a database-level constraint.', createdAt: hoursAgo(46) },
          { userId: USER_IDS.ACME_QA_1, comment: 'This is causing customer complaints. Can we prioritize?', createdAt: hoursAgo(44) },
          { userId: USER_IDS.ACME_PM_1, comment: 'Agreed, this is critical. @dev1 @dev2 please sync today.', createdAt: hoursAgo(42) },
          { userId: USER_IDS.ACME_DEV_1, comment: 'PR up for review: Added idempotency key check before order creation. Also added Redis lock as backup.', createdAt: hoursAgo(24) },
        ];

        for (const c of comments) {
          await client.query(
            `INSERT INTO issue_comment (
              id, issue_id, project_id, comment, comment_html,
              created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              newId(),
              issueId,
              issue.projectId,
              c.comment,
              `<p>${c.comment}</p>`,
              c.userId,
              c.createdAt,
              c.createdAt,
            ]
          );
        }
      }

      // Add activity for status changes
      if (issue.statusName === 'DONE') {
        await client.query(
          `INSERT INTO issue_activity (
            id, issue_id, project_id, field, old_value, new_value,
            actor_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            newId(),
            issueId,
            issue.projectId,
            'status',
            'IN PROGRESS',
            'DONE',
            issue.assignees[0] || issue.createdBy,
            hoursAgo(Math.floor(Math.random() * 72)),
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`✅ Seeded ${createdCount} issues successfully`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding issues:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedIssues()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedIssues };
