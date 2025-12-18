/**
 * Seed Constants
 *
 * This file contains all shared constants used across seed files.
 * When adding new entities, add their IDs here to maintain consistency.
 *
 * IMPORTANT: When schema changes affect IDs or enums, update this file first!
 */

import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

// ============================================================================
// USER IDs - Used across all services
// ============================================================================
export const USER_IDS = {
  // Admin users
  SUPER_ADMIN: 'a0000000-0000-0000-0000-000000000001',

  // ACME Corp users
  ACME_OWNER: 'a1000000-0000-0000-0000-000000000001',
  ACME_ADMIN: 'a1000000-0000-0000-0000-000000000002',
  ACME_DEV_1: 'a1000000-0000-0000-0000-000000000003',
  ACME_DEV_2: 'a1000000-0000-0000-0000-000000000004',
  ACME_DEV_3: 'a1000000-0000-0000-0000-000000000005',
  ACME_PM_1: 'a1000000-0000-0000-0000-000000000006',
  ACME_PM_2: 'a1000000-0000-0000-0000-000000000007',
  ACME_QA_1: 'a1000000-0000-0000-0000-000000000008',
  ACME_QA_2: 'a1000000-0000-0000-0000-000000000009',
  ACME_DESIGNER: 'a1000000-0000-0000-0000-000000000010',

  // Tech Startup users
  STARTUP_OWNER: 'a2000000-0000-0000-0000-000000000001',
  STARTUP_CTO: 'a2000000-0000-0000-0000-000000000002',
  STARTUP_DEV_1: 'a2000000-0000-0000-0000-000000000003',
  STARTUP_DEV_2: 'a2000000-0000-0000-0000-000000000004',
  STARTUP_DEV_3: 'a2000000-0000-0000-0000-000000000005',

  // Innovation Labs users
  LABS_OWNER: 'a3000000-0000-0000-0000-000000000001',
  LABS_LEAD: 'a3000000-0000-0000-0000-000000000002',
  LABS_RESEARCHER_1: 'a3000000-0000-0000-0000-000000000003',
  LABS_RESEARCHER_2: 'a3000000-0000-0000-0000-000000000004',
} as const;

// ============================================================================
// ORGANIZATION IDs
// ============================================================================
export const ORG_IDS = {
  ACME: 'b1000000-0000-0000-0000-000000000001',
  TECH_STARTUP: 'b2000000-0000-0000-0000-000000000001',
  INNOVATION_LABS: 'b3000000-0000-0000-0000-000000000001',
} as const;

// ============================================================================
// PROJECT IDs - For PM service
// ============================================================================
export const PROJECT_IDS = {
  // ACME Projects
  ACME_ECOMMERCE: 'c1000000-0000-0000-0000-000000000001',
  ACME_MOBILE_APP: 'c1000000-0000-0000-0000-000000000002',
  ACME_ADMIN_PORTAL: 'c1000000-0000-0000-0000-000000000003',
  ACME_API_V2: 'c1000000-0000-0000-0000-000000000004',
  ACME_INFRA: 'c1000000-0000-0000-0000-000000000005',

  // Tech Startup Projects
  STARTUP_MVP: 'c2000000-0000-0000-0000-000000000001',
  STARTUP_LANDING: 'c2000000-0000-0000-0000-000000000002',
  STARTUP_BACKEND: 'c2000000-0000-0000-0000-000000000003',

  // Innovation Labs Projects
  LABS_AI_RESEARCH: 'c3000000-0000-0000-0000-000000000001',
  LABS_POC: 'c3000000-0000-0000-0000-000000000002',
} as const;

// ============================================================================
// SPRINT IDs
// ============================================================================
export const SPRINT_IDS = {
  // ACME E-commerce sprints
  ECOM_SPRINT_1: 'd1000000-0000-0000-0000-000000000001',
  ECOM_SPRINT_2: 'd1000000-0000-0000-0000-000000000002',
  ECOM_SPRINT_3: 'd1000000-0000-0000-0000-000000000003',
  ECOM_SPRINT_4: 'd1000000-0000-0000-0000-000000000004',

  // ACME Mobile sprints
  MOBILE_SPRINT_1: 'd1100000-0000-0000-0000-000000000001',
  MOBILE_SPRINT_2: 'd1100000-0000-0000-0000-000000000002',

  // Startup MVP sprints
  MVP_SPRINT_1: 'd2000000-0000-0000-0000-000000000001',
  MVP_SPRINT_2: 'd2000000-0000-0000-0000-000000000002',
  MVP_SPRINT_3: 'd2000000-0000-0000-0000-000000000003',
} as const;

// ============================================================================
// ROOM IDs - For Chat service
// ============================================================================
export const ROOM_IDS = {
  // ACME Rooms
  ACME_GENERAL: 'e1000000-0000-0000-0000-000000000001',
  ACME_ENGINEERING: 'e1000000-0000-0000-0000-000000000002',
  ACME_PRODUCT: 'e1000000-0000-0000-0000-000000000003',
  ACME_DESIGN: 'e1000000-0000-0000-0000-000000000004',
  ACME_QA: 'e1000000-0000-0000-0000-000000000005',
  ACME_LEADERSHIP: 'e1000000-0000-0000-0000-000000000006',
  ACME_ECOM_PROJECT: 'e1000000-0000-0000-0000-000000000007',
  ACME_MOBILE_PROJECT: 'e1000000-0000-0000-0000-000000000008',
  ACME_RANDOM: 'e1000000-0000-0000-0000-000000000009',
  ACME_STANDUP: 'e1000000-0000-0000-0000-000000000010',

  // Tech Startup Rooms
  STARTUP_GENERAL: 'e2000000-0000-0000-0000-000000000001',
  STARTUP_DEV: 'e2000000-0000-0000-0000-000000000002',
  STARTUP_MVP: 'e2000000-0000-0000-0000-000000000003',

  // Innovation Labs Rooms
  LABS_GENERAL: 'e3000000-0000-0000-0000-000000000001',
  LABS_RESEARCH: 'e3000000-0000-0000-0000-000000000002',
} as const;

// ============================================================================
// MEETING IDs
// ============================================================================
export const MEETING_IDS = {
  ACME_STANDUP_1: 'f1000000-0000-0000-0000-000000000001',
  ACME_RETRO_1: 'f1000000-0000-0000-0000-000000000002',
  ACME_PLANNING: 'f1000000-0000-0000-0000-000000000003',
  STARTUP_DAILY: 'f2000000-0000-0000-0000-000000000001',
} as const;

// ============================================================================
// FILE IDs - For File-storage service
// ============================================================================
export const FILE_IDS = {
  MEETING_VIDEO_1: 'g1000000-0000-0000-0000-000000000001',
  DESIGN_MOCKUP_1: 'g1000000-0000-0000-0000-000000000002',
  SPEC_DOC_1: 'g1000000-0000-0000-0000-000000000003',
  REPORT_PDF_1: 'g1000000-0000-0000-0000-000000000004',
} as const;

// ============================================================================
// FOLDER IDs
// ============================================================================
export const FOLDER_IDS = {
  ACME_DESIGNS: 'h1000000-0000-0000-0000-000000000001',
  ACME_DOCS: 'h1000000-0000-0000-0000-000000000002',
  ACME_MEETINGS: 'h1000000-0000-0000-0000-000000000003',
} as const;

// ============================================================================
// DOCUMENT IDs - For RAG embeddings (using 'aa' prefix for hex compliance)
// ============================================================================
export const DOCUMENT_IDS = {
  // ACME Documents
  ACME_API_DOC: 'aa100000-0000-0000-0000-000000000001',
  ACME_ROADMAP: 'aa100000-0000-0000-0000-000000000002',
  ACME_SPRINT3_REPORT: 'aa100000-0000-0000-0000-000000000003',
  ACME_ARCHITECTURE: 'aa100000-0000-0000-0000-000000000004',

  // Tech Startup Documents
  STARTUP_MVP_REQUIREMENTS: 'aa200000-0000-0000-0000-000000000001',
  STARTUP_PITCH_DECK: 'aa200000-0000-0000-0000-000000000002',

  // Innovation Labs Documents
  LABS_LLM_COMPARISON: 'aa300000-0000-0000-0000-000000000001',
  LABS_RAG_ARCHITECTURE: 'aa300000-0000-0000-0000-000000000002',
} as const;

// ============================================================================
// MESSAGE IDs - For RAG short text embeddings (using 'ab' prefix for hex compliance)
// ============================================================================
export const RAG_MESSAGE_IDS = {
  ACME_ENG_MSG_1: 'ab100000-0000-0000-0000-000000000001',
  ACME_ENG_MSG_2: 'ab100000-0000-0000-0000-000000000002',
  ACME_ENG_MSG_3: 'ab100000-0000-0000-0000-000000000003',
  ACME_PROD_MSG_1: 'ab100000-0000-0000-0000-000000000004',
  ACME_PROD_MSG_2: 'ab100000-0000-0000-0000-000000000005',
} as const;

// ============================================================================
// ENUMS - Must match schema definitions
// ============================================================================

export const SPRINT_STATUS = {
  FUTURE: 'FUTURE',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const;

export const ISSUE_PRIORITY = {
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none',
} as const;

export const ISSUE_TYPE = {
  TASK: 'task',
  BUG: 'bug',
  STORY: 'story',
  EPIC: 'epic',
  SUBTASK: 'subtask',
} as const;

export const ROOM_TYPE = {
  CHANNEL: 'channel',
  DM: 'dm',
} as const;

export const ROOM_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  DELETED: 'DELETED',
} as const;

export const MESSAGE_TYPE = {
  TEXT: 'text',
  FILE: 'file',
  SYSTEM: 'system',
  HUDDLE_STARTED: 'huddle_started',
  HUDDLE_ENDED: 'huddle_ended',
} as const;

export const MEETING_STATUS = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  TERMINATED: 'TERMINATED',
} as const;

export const NOTIFICATION_TYPE = {
  ORG_INVITATION: 'ORG_INVITATION',
  ORG_MEMBER_JOINED: 'ORG_MEMBER_JOINED',
  ORG_MEMBER_REMOVED: 'ORG_MEMBER_REMOVED',
  ORG_ROLE_CHANGED: 'ORG_ROLE_CHANGED',
  CHAT_MENTION: 'CHAT_MENTION',
  REPORT_COMPLETED: 'REPORT_COMPLETED',
  REPORT_FAILED: 'REPORT_FAILED',
  SYSTEM_ANNOUNCEMENT: 'SYSTEM_ANNOUNCEMENT',
} as const;

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const MEMBER_TYPE = {
  STAFF: 'STAFF',
  PARTNER: 'PARTNER',
} as const;

export const MEMBER_ROLE = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const;

// ============================================================================
// DEFAULT STATUS COLORS - For issue statuses
// ============================================================================
export const STATUS_COLORS = {
  TODO: '#6B7280',
  IN_PROGRESS: '#3B82F6',
  IN_REVIEW: '#F59E0B',
  DONE: '#10B981',
  BLOCKED: '#EF4444',
} as const;

// ============================================================================
// DATE HELPERS
// ============================================================================
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

export function minutesAgo(minutes: number): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date;
}

// ============================================================================
// PASSWORD HELPER
// ============================================================================
export const DEFAULT_PASSWORD = 'Demo@123';
export const PWD_PEPPER = process.env.PWD_PEPPER || 'dev-pepper-or-empty'; // Must match identity service

export async function hashPassword(password: string = DEFAULT_PASSWORD): Promise<string> {
  return bcrypt.hash(password + PWD_PEPPER, 10);
}

// ============================================================================
// DATABASE CONNECTIONS
// ============================================================================
export const DB_CONFIG = {
  POSTGRES: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '41000'),
    user: process.env.POSTGRES_USER || 'uts',
    password: process.env.POSTGRES_PASSWORD || 'uts_dev_pw',
    databases: {
      identity: 'identity',
      pm: 'pm_db',
      chat: 'chat_db',
      meeting: 'meeting_db',
      notification: 'notification_db',
      rag: 'rag_db',
    },
  },
  MONGODB: {
    uri: process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017',
    databases: {
      fileStorage: 'file_storage',
      tenantBff: 'tenant_bff',
    },
  },
} as const;

// ============================================================================
// SAMPLE DATA TEMPLATES
// ============================================================================
export const SAMPLE_USERS = [
  // ACME Corp Team
  { id: USER_IDS.ACME_OWNER, email: 'owner@acme.com', name: 'Nguyễn Văn An', phone: '0901234001' },
  { id: USER_IDS.ACME_ADMIN, email: 'admin@acme.com', name: 'Trần Thị Bình', phone: '0901234002' },
  { id: USER_IDS.ACME_DEV_1, email: 'dev1@acme.com', name: 'Lê Văn Cường', phone: '0901234003' },
  { id: USER_IDS.ACME_DEV_2, email: 'dev2@acme.com', name: 'Phạm Thị Dung', phone: '0901234004' },
  { id: USER_IDS.ACME_DEV_3, email: 'dev3@acme.com', name: 'Hoàng Văn Em', phone: '0901234005' },
  { id: USER_IDS.ACME_PM_1, email: 'pm1@acme.com', name: 'Vũ Thị Phương', phone: '0901234006' },
  { id: USER_IDS.ACME_PM_2, email: 'pm2@acme.com', name: 'Đặng Văn Giang', phone: '0901234007' },
  { id: USER_IDS.ACME_QA_1, email: 'qa1@acme.com', name: 'Bùi Thị Hoa', phone: '0901234008' },
  { id: USER_IDS.ACME_QA_2, email: 'qa2@acme.com', name: 'Ngô Văn Inh', phone: '0901234009' },
  { id: USER_IDS.ACME_DESIGNER, email: 'designer@acme.com', name: 'Lý Thị Kim', phone: '0901234010' },

  // Tech Startup Team
  { id: USER_IDS.STARTUP_OWNER, email: 'founder@startup.io', name: 'Trương Văn Long', phone: '0902234001' },
  { id: USER_IDS.STARTUP_CTO, email: 'cto@startup.io', name: 'Đinh Thị Mai', phone: '0902234002' },
  { id: USER_IDS.STARTUP_DEV_1, email: 'dev1@startup.io', name: 'Cao Văn Nam', phone: '0902234003' },
  { id: USER_IDS.STARTUP_DEV_2, email: 'dev2@startup.io', name: 'Dương Thị Oanh', phone: '0902234004' },
  { id: USER_IDS.STARTUP_DEV_3, email: 'dev3@startup.io', name: 'Hồ Văn Phúc', phone: '0902234005' },

  // Innovation Labs Team
  { id: USER_IDS.LABS_OWNER, email: 'director@labs.ai', name: 'Tạ Văn Quân', phone: '0903234001' },
  { id: USER_IDS.LABS_LEAD, email: 'lead@labs.ai', name: 'Lưu Thị Rồng', phone: '0903234002' },
  { id: USER_IDS.LABS_RESEARCHER_1, email: 'researcher1@labs.ai', name: 'Mạc Văn Sơn', phone: '0903234003' },
  { id: USER_IDS.LABS_RESEARCHER_2, email: 'researcher2@labs.ai', name: 'Châu Thị Tâm', phone: '0903234004' },
] as const;

export const SAMPLE_ORGANIZATIONS = [
  {
    id: ORG_IDS.ACME,
    slug: 'acme-corp',
    displayName: 'ACME Corporation',
    description: 'Leading enterprise software solutions provider',
    llmProvider: 'OPENAI',
  },
  {
    id: ORG_IDS.TECH_STARTUP,
    slug: 'tech-startup',
    displayName: 'Tech Startup Inc',
    description: 'Innovative SaaS platform for small businesses',
    llmProvider: 'ANTHROPIC',
  },
  {
    id: ORG_IDS.INNOVATION_LABS,
    slug: 'innovation-labs',
    displayName: 'Innovation Labs',
    description: 'AI Research and Development',
    llmProvider: 'GOOGLE',
  },
] as const;

// ============================================================================
// VIDEO ASSET PATH
// ============================================================================
export const ASSETS_PATH = '/Users/toan/Workspaces/toantran292/datn/assets';
export const MEETING_VIDEO_PATH = `${ASSETS_PATH}/meeting-example.mp4`;

// ============================================================================
// Generate new UUID helper
// ============================================================================
export function newId(): string {
  return uuidv4();
}

console.log('Seed constants loaded successfully');
