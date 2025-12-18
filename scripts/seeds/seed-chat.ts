/**
 * Seed Chat
 *
 * Creates demo chat rooms, messages, reactions, and AI configs.
 * Includes realistic conversations for AI demo purposes.
 *
 * Schema Reference: services/chat/src/database/entities/*.ts
 * Tables: rooms, messages, room_members, message_reactions, channel_ai_configs
 */

import { Pool } from 'pg';
import {
  ROOM_IDS,
  PROJECT_IDS,
  USER_IDS,
  ORG_IDS,
  DB_CONFIG,
  ROOM_TYPE,
  ROOM_STATUS,
  MESSAGE_TYPE,
  daysAgo,
  hoursAgo,
  minutesAgo,
  newId,
} from './seed-constants';

interface Room {
  id: string;
  orgId: string;
  projectId: string | null;
  name: string;
  description: string;
  type: string;
  isPrivate: boolean;
  createdBy: string;
}

interface Message {
  roomId: string;
  userId: string;
  orgId: string;
  threadId: string | null;
  content: string;
  type: string;
  createdAt: Date;
}

interface RoomMember {
  roomId: string;
  userId: string;
  orgId: string;
  role: string;
}

// =============================================================================
// ROOMS
// =============================================================================
const ROOMS: Room[] = [
  // ACME Corp Rooms
  {
    id: ROOM_IDS.ACME_GENERAL,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'general',
    description: 'Company-wide announcements and discussions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_OWNER,
  },
  {
    id: ROOM_IDS.ACME_ENGINEERING,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'engineering',
    description: 'Engineering team discussions, code reviews, and technical decisions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_DEV_1,
  },
  {
    id: ROOM_IDS.ACME_PRODUCT,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'product',
    description: 'Product discussions, feature requests, and roadmap planning',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_PM_1,
  },
  {
    id: ROOM_IDS.ACME_DESIGN,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'design',
    description: 'Design discussions, mockups, and feedback',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_DESIGNER,
  },
  {
    id: ROOM_IDS.ACME_QA,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'qa-testing',
    description: 'QA and testing discussions, bug reports',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_QA_1,
  },
  {
    id: ROOM_IDS.ACME_LEADERSHIP,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'leadership',
    description: 'Leadership team discussions (private)',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: true,
    createdBy: USER_IDS.ACME_OWNER,
  },
  {
    id: ROOM_IDS.ACME_ECOM_PROJECT,
    orgId: ORG_IDS.ACME,
    projectId: PROJECT_IDS.ACME_ECOMMERCE,
    name: 'ecommerce-project',
    description: 'E-Commerce project discussions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_PM_1,
  },
  {
    id: ROOM_IDS.ACME_MOBILE_PROJECT,
    orgId: ORG_IDS.ACME,
    projectId: PROJECT_IDS.ACME_MOBILE_APP,
    name: 'mobile-app-project',
    description: 'Mobile app development discussions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_PM_2,
  },
  {
    id: ROOM_IDS.ACME_RANDOM,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'random',
    description: 'Non-work banter and water cooler chat',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_DEV_3,
  },
  {
    id: ROOM_IDS.ACME_STANDUP,
    orgId: ORG_IDS.ACME,
    projectId: null,
    name: 'daily-standup',
    description: 'Daily standup updates and blockers',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.ACME_PM_1,
  },

  // Tech Startup Rooms
  {
    id: ROOM_IDS.STARTUP_GENERAL,
    orgId: ORG_IDS.TECH_STARTUP,
    projectId: null,
    name: 'general',
    description: 'Team-wide discussions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.STARTUP_OWNER,
  },
  {
    id: ROOM_IDS.STARTUP_DEV,
    orgId: ORG_IDS.TECH_STARTUP,
    projectId: null,
    name: 'dev',
    description: 'Development discussions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.STARTUP_CTO,
  },
  {
    id: ROOM_IDS.STARTUP_MVP,
    orgId: ORG_IDS.TECH_STARTUP,
    projectId: PROJECT_IDS.STARTUP_MVP,
    name: 'mvp-project',
    description: 'MVP development channel',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.STARTUP_CTO,
  },

  // Innovation Labs Rooms
  {
    id: ROOM_IDS.LABS_GENERAL,
    orgId: ORG_IDS.INNOVATION_LABS,
    projectId: null,
    name: 'general',
    description: 'General discussions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.LABS_OWNER,
  },
  {
    id: ROOM_IDS.LABS_RESEARCH,
    orgId: ORG_IDS.INNOVATION_LABS,
    projectId: PROJECT_IDS.LABS_AI_RESEARCH,
    name: 'ai-research',
    description: 'AI/ML research discussions',
    type: ROOM_TYPE.CHANNEL,
    isPrivate: false,
    createdBy: USER_IDS.LABS_LEAD,
  },
];

// =============================================================================
// ROOM MEMBERS
// =============================================================================
const ROOM_MEMBERS: RoomMember[] = [
  // ACME General - all members
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_OWNER, orgId: ORG_IDS.ACME, role: 'ADMIN' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_ADMIN, orgId: ORG_IDS.ACME, role: 'ADMIN' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_DEV_1, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_DEV_2, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_DEV_3, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_PM_1, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_PM_2, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_QA_1, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_QA_2, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_GENERAL, userId: USER_IDS.ACME_DESIGNER, orgId: ORG_IDS.ACME, role: 'MEMBER' },

  // ACME Engineering
  { roomId: ROOM_IDS.ACME_ENGINEERING, userId: USER_IDS.ACME_DEV_1, orgId: ORG_IDS.ACME, role: 'ADMIN' },
  { roomId: ROOM_IDS.ACME_ENGINEERING, userId: USER_IDS.ACME_DEV_2, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_ENGINEERING, userId: USER_IDS.ACME_DEV_3, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_ENGINEERING, userId: USER_IDS.ACME_PM_1, orgId: ORG_IDS.ACME, role: 'MEMBER' },

  // ACME E-commerce Project
  { roomId: ROOM_IDS.ACME_ECOM_PROJECT, userId: USER_IDS.ACME_PM_1, orgId: ORG_IDS.ACME, role: 'ADMIN' },
  { roomId: ROOM_IDS.ACME_ECOM_PROJECT, userId: USER_IDS.ACME_DEV_1, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_ECOM_PROJECT, userId: USER_IDS.ACME_DEV_2, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_ECOM_PROJECT, userId: USER_IDS.ACME_QA_1, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_ECOM_PROJECT, userId: USER_IDS.ACME_DESIGNER, orgId: ORG_IDS.ACME, role: 'MEMBER' },

  // Leadership - private
  { roomId: ROOM_IDS.ACME_LEADERSHIP, userId: USER_IDS.ACME_OWNER, orgId: ORG_IDS.ACME, role: 'ADMIN' },
  { roomId: ROOM_IDS.ACME_LEADERSHIP, userId: USER_IDS.ACME_ADMIN, orgId: ORG_IDS.ACME, role: 'MEMBER' },
  { roomId: ROOM_IDS.ACME_LEADERSHIP, userId: USER_IDS.ACME_PM_1, orgId: ORG_IDS.ACME, role: 'MEMBER' },

  // Tech Startup
  { roomId: ROOM_IDS.STARTUP_GENERAL, userId: USER_IDS.STARTUP_OWNER, orgId: ORG_IDS.TECH_STARTUP, role: 'ADMIN' },
  { roomId: ROOM_IDS.STARTUP_GENERAL, userId: USER_IDS.STARTUP_CTO, orgId: ORG_IDS.TECH_STARTUP, role: 'ADMIN' },
  { roomId: ROOM_IDS.STARTUP_GENERAL, userId: USER_IDS.STARTUP_DEV_1, orgId: ORG_IDS.TECH_STARTUP, role: 'MEMBER' },
  { roomId: ROOM_IDS.STARTUP_GENERAL, userId: USER_IDS.STARTUP_DEV_2, orgId: ORG_IDS.TECH_STARTUP, role: 'MEMBER' },
  { roomId: ROOM_IDS.STARTUP_GENERAL, userId: USER_IDS.STARTUP_DEV_3, orgId: ORG_IDS.TECH_STARTUP, role: 'MEMBER' },

  // Innovation Labs
  { roomId: ROOM_IDS.LABS_GENERAL, userId: USER_IDS.LABS_OWNER, orgId: ORG_IDS.INNOVATION_LABS, role: 'ADMIN' },
  { roomId: ROOM_IDS.LABS_GENERAL, userId: USER_IDS.LABS_LEAD, orgId: ORG_IDS.INNOVATION_LABS, role: 'ADMIN' },
  { roomId: ROOM_IDS.LABS_GENERAL, userId: USER_IDS.LABS_RESEARCHER_1, orgId: ORG_IDS.INNOVATION_LABS, role: 'MEMBER' },
  { roomId: ROOM_IDS.LABS_GENERAL, userId: USER_IDS.LABS_RESEARCHER_2, orgId: ORG_IDS.INNOVATION_LABS, role: 'MEMBER' },
];

// =============================================================================
// MESSAGES - Realistic conversations for AI demo
// =============================================================================
function generateMessages(): Message[] {
  const messages: Message[] = [];

  // E-Commerce Project Discussion (detailed for AI summarization demo)
  const ecomMessages = [
    { userId: USER_IDS.ACME_PM_1, content: 'Good morning team! Let\'s discuss the Sprint 3 progress. How are we looking on the order management system?', time: hoursAgo(72) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Morning! The order creation API is complete and deployed to staging. All tests passing. Ready for QA review.', time: hoursAgo(71) },
    { userId: USER_IDS.ACME_DEV_2, content: 'Shipping integration is about 80% done. FedEx is working, still working on UPS integration. Should be done by tomorrow.', time: hoursAgo(70) },
    { userId: USER_IDS.ACME_QA_1, content: 'I\'ll start testing the order API today. @dev1 can you share the API docs?', time: hoursAgo(69) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Sure, here\'s the Swagger link: https://staging.acme.com/api-docs. Let me know if you have questions.', time: hoursAgo(68) },
    { userId: USER_IDS.ACME_DESIGNER, content: 'Email templates are ready for review. I\'ve uploaded them to Figma. Need feedback on the mobile layout.', time: hoursAgo(67) },
    { userId: USER_IDS.ACME_PM_1, content: 'Great progress everyone! @designer I\'ll review the templates this afternoon.', time: hoursAgo(66) },

    // Critical bug discussion
    { userId: USER_IDS.ACME_QA_1, content: '🚨 URGENT: Found a critical bug in checkout. Users can create duplicate orders by clicking the button multiple times.', time: hoursAgo(48) },
    { userId: USER_IDS.ACME_PM_1, content: 'That\'s serious. @dev1 @dev2 can you look into this immediately?', time: hoursAgo(47) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Looking into it now. Seems like we need idempotency keys on the order creation endpoint.', time: hoursAgo(46) },
    { userId: USER_IDS.ACME_DEV_2, content: 'I can help. We should also disable the button after first click as a frontend safeguard.', time: hoursAgo(45) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Good idea. I\'ll handle the backend, you handle the frontend. Let\'s sync in 30 mins.', time: hoursAgo(44) },
    { userId: USER_IDS.ACME_QA_1, content: 'This bug has caused 3 customer complaints already. Finance is asking about the duplicate charges.', time: hoursAgo(43) },
    { userId: USER_IDS.ACME_PM_1, content: 'I\'ll coordinate with customer support. @dev1 what\'s the ETA on the fix?', time: hoursAgo(42) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Backend fix ready in 2 hours. We\'ll need to test thoroughly before deploying.', time: hoursAgo(41) },
    { userId: USER_IDS.ACME_DEV_2, content: 'Frontend changes done. Added button disable, loading state, and confirmation modal as extra safety.', time: hoursAgo(36) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Backend PR is up: Added idempotency key validation and Redis-based distributed lock. Also added database unique constraint as final safeguard.', time: hoursAgo(30) },
    { userId: USER_IDS.ACME_QA_1, content: 'Testing the fix now. Initial results look good - unable to reproduce the duplicate order issue.', time: hoursAgo(24) },
    { userId: USER_IDS.ACME_QA_1, content: '✅ Fix verified. Tested 50 rapid clicks, 10 concurrent browser tabs - all handled correctly with single order created.', time: hoursAgo(20) },
    { userId: USER_IDS.ACME_PM_1, content: 'Excellent work team! Let\'s deploy to production during the maintenance window tonight.', time: hoursAgo(18) },

    // Sprint planning discussion
    { userId: USER_IDS.ACME_PM_1, content: 'Team, let\'s talk about Sprint 4 planning. We need to focus on analytics dashboard and performance optimization.', time: hoursAgo(8) },
    { userId: USER_IDS.ACME_DEV_1, content: 'I\'d like to prioritize the database query optimization. Some of our product listing queries are getting slow with 10k+ products.', time: hoursAgo(7) },
    { userId: USER_IDS.ACME_DEV_2, content: 'Agreed. We should also look at implementing caching for the product catalog. Redis or Elasticsearch?', time: hoursAgo(6) },
    { userId: USER_IDS.ACME_DEV_1, content: 'I\'d recommend Elasticsearch for product search and Redis for session/cart data. Different use cases.', time: hoursAgo(5) },
    { userId: USER_IDS.ACME_PM_1, content: 'Good points. Let\'s add both to the backlog. @qa1 any technical debt items you want to address?', time: hoursAgo(4) },
    { userId: USER_IDS.ACME_QA_1, content: 'We need more automated tests. Currently at 60% coverage, targeting 80%.', time: hoursAgo(3) },
    { userId: USER_IDS.ACME_DESIGNER, content: 'From design side, we need to revisit the mobile checkout flow. Conversion rate is lower on mobile.', time: hoursAgo(2) },
    { userId: USER_IDS.ACME_PM_1, content: 'All noted. I\'ll create the Sprint 4 issues and we\'ll prioritize in tomorrow\'s planning meeting.', time: hoursAgo(1) },
  ];

  for (const msg of ecomMessages) {
    messages.push({
      roomId: ROOM_IDS.ACME_ECOM_PROJECT,
      userId: msg.userId,
      orgId: ORG_IDS.ACME,
      threadId: null,
      content: msg.content,
      type: MESSAGE_TYPE.TEXT,
      createdAt: msg.time,
    });
  }

  // Engineering channel discussions
  const engMessages = [
    { userId: USER_IDS.ACME_DEV_1, content: 'Has anyone used Prisma with PostgreSQL connection pooling? Running into some connection limit issues.', time: daysAgo(5) },
    { userId: USER_IDS.ACME_DEV_2, content: 'Yeah, you need to configure `connection_limit` in the datasource. Also look into PgBouncer for production.', time: daysAgo(5) },
    { userId: USER_IDS.ACME_DEV_3, content: 'We use PgBouncer in production. Works great. Here\'s our config if you need a reference.', time: daysAgo(5) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Thanks! That\'s exactly what I needed.', time: daysAgo(5) },

    { userId: USER_IDS.ACME_DEV_2, content: 'FYI: Node.js 20 LTS is now available. Should we plan an upgrade?', time: daysAgo(3) },
    { userId: USER_IDS.ACME_DEV_1, content: 'Good timing. Let\'s add it to Sprint 4 backlog. Any breaking changes we should know about?', time: daysAgo(3) },
    { userId: USER_IDS.ACME_DEV_2, content: 'Nothing major for our stack. The new test runner is nice though.', time: daysAgo(3) },

    { userId: USER_IDS.ACME_DEV_3, content: 'Code review request: PR #234 - Refactored the payment service for better error handling.', time: daysAgo(1) },
    { userId: USER_IDS.ACME_DEV_1, content: 'I\'ll take a look. @dev2 can you also review? It touches the Stripe integration.', time: daysAgo(1) },
    { userId: USER_IDS.ACME_DEV_2, content: 'On it. Will review today.', time: daysAgo(1) },
  ];

  for (const msg of engMessages) {
    messages.push({
      roomId: ROOM_IDS.ACME_ENGINEERING,
      userId: msg.userId,
      orgId: ORG_IDS.ACME,
      threadId: null,
      content: msg.content,
      type: MESSAGE_TYPE.TEXT,
      createdAt: msg.time,
    });
  }

  // Tech Startup MVP discussions
  const startupMessages = [
    { userId: USER_IDS.STARTUP_CTO, content: 'Team, we\'re on track for the MVP launch next week. Let\'s do a final feature freeze review.', time: daysAgo(2) },
    { userId: USER_IDS.STARTUP_DEV_1, content: 'Dashboard is complete. All metrics rendering correctly.', time: daysAgo(2) },
    { userId: USER_IDS.STARTUP_DEV_2, content: 'Billing integration is 90% done. Just need to handle edge cases for failed payments.', time: daysAgo(2) },
    { userId: USER_IDS.STARTUP_DEV_3, content: 'Email verification is working. Magic links expire after 24 hours as specified.', time: daysAgo(2) },
    { userId: USER_IDS.STARTUP_OWNER, content: 'Great work everyone! Marketing is ready to push once we launch. Excited for this milestone! 🚀', time: daysAgo(2) },
    { userId: USER_IDS.STARTUP_CTO, content: 'One thing - we need to set up proper monitoring before launch. @dev1 can you set up Datadog alerts?', time: daysAgo(1) },
    { userId: USER_IDS.STARTUP_DEV_1, content: 'Already on it. Basic alerts for API errors and response times are configured.', time: daysAgo(1) },
  ];

  for (const msg of startupMessages) {
    messages.push({
      roomId: ROOM_IDS.STARTUP_MVP,
      userId: msg.userId,
      orgId: ORG_IDS.TECH_STARTUP,
      threadId: null,
      content: msg.content,
      type: MESSAGE_TYPE.TEXT,
      createdAt: msg.time,
    });
  }

  // Innovation Labs AI Research
  const labsMessages = [
    { userId: USER_IDS.LABS_LEAD, content: 'Interesting findings from the LLM comparison. Claude performs better on long document summarization, but GPT-4 is faster.', time: daysAgo(7) },
    { userId: USER_IDS.LABS_RESEARCHER_1, content: 'The cost difference is significant too. Claude is about 30% cheaper for our use case.', time: daysAgo(7) },
    { userId: USER_IDS.LABS_RESEARCHER_2, content: 'What about accuracy? Did you test on our benchmark dataset?', time: daysAgo(7) },
    { userId: USER_IDS.LABS_LEAD, content: 'Yes, Claude scored 94% accuracy vs GPT-4\'s 91% on document extraction tasks.', time: daysAgo(7) },
    { userId: USER_IDS.LABS_OWNER, content: 'Great analysis. Let\'s compile this into a report for the stakeholders.', time: daysAgo(6) },

    { userId: USER_IDS.LABS_RESEARCHER_2, content: 'RAG pipeline prototype is working! Tested with 1000 documents, retrieval accuracy is 87%.', time: daysAgo(3) },
    { userId: USER_IDS.LABS_LEAD, content: 'Excellent! What embedding model are you using?', time: daysAgo(3) },
    { userId: USER_IDS.LABS_RESEARCHER_2, content: 'text-embedding-3-small from OpenAI. Good balance of cost and quality.', time: daysAgo(3) },
    { userId: USER_IDS.LABS_RESEARCHER_1, content: 'Have you tried the new ada-002 model? It might perform better on technical documents.', time: daysAgo(3) },
    { userId: USER_IDS.LABS_RESEARCHER_2, content: 'Not yet, will add it to the comparison. Thanks for the suggestion!', time: daysAgo(3) },
  ];

  for (const msg of labsMessages) {
    messages.push({
      roomId: ROOM_IDS.LABS_RESEARCH,
      userId: msg.userId,
      orgId: ORG_IDS.INNOVATION_LABS,
      threadId: null,
      content: msg.content,
      type: MESSAGE_TYPE.TEXT,
      createdAt: msg.time,
    });
  }

  // Daily standup messages
  const standupMessages = [
    { userId: USER_IDS.ACME_DEV_1, content: '**Yesterday:** Completed order API, fixed checkout bug\n**Today:** Code review, start analytics dashboard\n**Blockers:** None', time: hoursAgo(4) },
    { userId: USER_IDS.ACME_DEV_2, content: '**Yesterday:** Finished UPS integration\n**Today:** Testing shipping calculations\n**Blockers:** Waiting for UPS sandbox credentials', time: hoursAgo(4) },
    { userId: USER_IDS.ACME_QA_1, content: '**Yesterday:** Tested order flow, reported 2 bugs\n**Today:** Regression testing\n**Blockers:** None', time: hoursAgo(3) },
    { userId: USER_IDS.ACME_DESIGNER, content: '**Yesterday:** Finalized email templates\n**Today:** Working on mobile checkout redesign\n**Blockers:** Need product feedback on 2 design options', time: hoursAgo(3) },
  ];

  for (const msg of standupMessages) {
    messages.push({
      roomId: ROOM_IDS.ACME_STANDUP,
      userId: msg.userId,
      orgId: ORG_IDS.ACME,
      threadId: null,
      content: msg.content,
      type: MESSAGE_TYPE.TEXT,
      createdAt: msg.time,
    });
  }

  return messages;
}

async function seedChat() {
  const pool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database: DB_CONFIG.POSTGRES.databases.chat,
  });

  const client = await pool.connect();

  try {
    console.log('🌱 Seeding chat rooms...');

    await client.query('BEGIN');

    // Create rooms
    for (const room of ROOMS) {
      const existing = await client.query(
        'SELECT id FROM rooms WHERE id = $1',
        [room.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Room ${room.name} already exists, skipping`);
        continue;
      }

      await client.query(
        `INSERT INTO rooms (
          id, org_id, project_id, name, description, type,
          is_private, status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          room.id,
          room.orgId,
          room.projectId,
          room.name,
          room.description,
          room.type,
          room.isPrivate,
          ROOM_STATUS.ACTIVE,
          room.createdBy,
          daysAgo(60),
          new Date(),
        ]
      );

      console.log(`  ✅ Created room: ${room.name}`);
    }

    // Create room members
    console.log('🌱 Seeding room members...');

    for (const member of ROOM_MEMBERS) {
      const existing = await client.query(
        'SELECT id FROM room_members WHERE room_id = $1 AND user_id = $2',
        [member.roomId, member.userId]
      );

      if (existing.rows.length > 0) {
        continue;
      }

      await client.query(
        `INSERT INTO room_members (
          id, room_id, user_id, org_id, role, joined_at
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newId(),
          member.roomId,
          member.userId,
          member.orgId,
          member.role,
          daysAgo(Math.floor(Math.random() * 30) + 30),
        ]
      );
    }

    console.log(`  ✅ Created ${ROOM_MEMBERS.length} room memberships`);

    // Create messages
    console.log('🌱 Seeding messages...');

    const messages = generateMessages();
    let messageCount = 0;

    for (const msg of messages) {
      await client.query(
        `INSERT INTO messages (
          id, room_id, user_id, org_id, thread_id, content,
          type, format, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newId(),
          msg.roomId,
          msg.userId,
          msg.orgId,
          msg.threadId,
          msg.content,
          msg.type,
          'markdown',
          msg.createdAt,
        ]
      );
      messageCount++;
    }

    console.log(`  ✅ Created ${messageCount} messages`);

    // Enable AI for some rooms
    console.log('🌱 Enabling AI for project channels...');

    const aiRooms = [
      ROOM_IDS.ACME_ECOM_PROJECT,
      ROOM_IDS.ACME_ENGINEERING,
      ROOM_IDS.STARTUP_MVP,
      ROOM_IDS.LABS_RESEARCH,
    ];

    for (const roomId of aiRooms) {
      const existing = await client.query(
        'SELECT id FROM channel_ai_configs WHERE room_id = $1',
        [roomId]
      );

      if (existing.rows.length > 0) {
        continue;
      }

      await client.query(
        `INSERT INTO channel_ai_configs (
          id, room_id, ai_enabled, enabled_features,
          model_provider, model_name, temperature, max_tokens,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newId(),
          roomId,
          true,
          'summary,action_items,qa',
          'openai',
          'gpt-4o-mini',
          0.7,
          2000,
          daysAgo(30),
          new Date(),
        ]
      );
    }

    console.log(`  ✅ Enabled AI for ${aiRooms.length} channels`);

    await client.query('COMMIT');
    console.log('✅ Seeded chat data successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding chat:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedChat()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedChat, ROOMS };
