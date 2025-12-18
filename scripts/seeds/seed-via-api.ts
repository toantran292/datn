/**
 * Full Flow Seed via HTTP API
 *
 * This script seeds the entire system through the API Gateway (localhost:8080)
 * following the real user flow:
 *
 * 1. Register/Login users
 * 2. Create workspaces (organizations)
 * 3. Create projects
 * 4. Create sprints & issues
 * 5. Create chat rooms & messages
 * 6. Index everything to RAG
 *
 * Usage:
 *   npx tsx scripts/seeds/seed-via-api.ts
 *
 * Prerequisites:
 *   - All services must be running (docker compose up)
 *   - API Gateway at localhost:8080
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';
const RAG_API = process.env.RAG_SERVICE_URL || 'http://localhost:41600';
const DEFAULT_PASSWORD = 'Demo@123';

// ============================================================================
// Types
// ============================================================================
interface User {
  id: string;
  email: string;
  token: string;
}

interface Workspace {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  identifier: string;
}

interface Sprint {
  id: string;
  name: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
}

interface Room {
  id: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
}

// ============================================================================
// HTTP Client Helper
// ============================================================================
async function apiCall<T>(
  method: string,
  path: string,
  body?: any,
  token?: string,
  headers?: Record<string, string>
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// ============================================================================
// Seed Data Configuration - Uses existing seeded users from DB seed
// ============================================================================
const SEED_USERS = [
  { email: 'owner@acme.com', password: DEFAULT_PASSWORD, name: 'Nguyễn Văn An' },
  { email: 'dev1@acme.com', password: DEFAULT_PASSWORD, name: 'Lê Văn Cường' },
  { email: 'dev2@acme.com', password: DEFAULT_PASSWORD, name: 'Phạm Thị Dung' },
  { email: 'pm1@acme.com', password: DEFAULT_PASSWORD, name: 'Vũ Thị Phương' },
];

const SEED_WORKSPACES = [
  { name: 'ACME Corporation', description: 'Main workspace for ACME Corp' },
];

const SEED_PROJECTS = [
  {
    name: 'E-commerce Platform',
    identifier: 'ECOM',
    description: 'Main e-commerce platform development',
  },
  {
    name: 'Mobile App',
    identifier: 'MOBILE',
    description: 'iOS and Android mobile application',
  },
];

const SEED_SPRINTS = [
  { name: 'Sprint 1 - Foundation', startDate: '2025-01-01', endDate: '2025-01-14' },
  { name: 'Sprint 2 - Core Features', startDate: '2025-01-15', endDate: '2025-01-28' },
  { name: 'Sprint 3 - Payment Integration', startDate: '2025-01-29', endDate: '2025-02-11' },
];

const SEED_ISSUES = [
  {
    title: 'Setup project structure',
    description: 'Initialize the project with NestJS, configure TypeORM, and setup Docker environment',
    type: 'task',
    priority: 'high',
  },
  {
    title: 'User authentication system',
    description: 'Implement JWT-based authentication with refresh tokens, OAuth2 support for Google and GitHub',
    type: 'story',
    priority: 'high',
  },
  {
    title: 'Product catalog API',
    description: 'Create CRUD endpoints for products with pagination, filtering, and search capabilities',
    type: 'story',
    priority: 'medium',
  },
  {
    title: 'Shopping cart functionality',
    description: 'Implement shopping cart with add/remove items, quantity updates, and price calculation',
    type: 'story',
    priority: 'medium',
  },
  {
    title: 'Payment gateway integration',
    description: 'Integrate Stripe for payment processing with support for multiple currencies',
    type: 'story',
    priority: 'high',
  },
  {
    title: 'Order management system',
    description: 'Build order tracking, status updates, and email notifications',
    type: 'story',
    priority: 'medium',
  },
  {
    title: 'Fix checkout total calculation bug',
    description: 'When discount codes are applied, the total is not recalculated correctly. Need to fix the price calculation logic.',
    type: 'bug',
    priority: 'urgent',
  },
  {
    title: 'Performance optimization',
    description: 'Optimize database queries and add caching layer for product listings',
    type: 'task',
    priority: 'low',
  },
];

const SEED_ROOMS = [
  { name: 'general', description: 'General discussion channel' },
  { name: 'engineering', description: 'Engineering team discussions' },
  { name: 'product', description: 'Product planning and roadmap' },
];

const SEED_MESSAGES = [
  { room: 'engineering', content: 'The payment gateway integration is almost complete. We need to test with sandbox credentials before going live.' },
  { room: 'engineering', content: 'Found a critical bug in the checkout flow. When users apply discount codes, the total is not recalculated correctly.' },
  { room: 'engineering', content: 'Performance optimization is done. API response times reduced from 150ms to 120ms average.' },
  { room: 'engineering', content: 'Code review for the authentication PR is ready. Please take a look when you have time.' },
  { room: 'product', content: 'Sprint 3 planning meeting scheduled for Monday 9am. Please prepare your estimates.' },
  { room: 'product', content: 'Customer feedback: They want better filtering options in the product catalog. Adding to backlog.' },
  { room: 'product', content: 'The roadmap for Q1 2025 is finalized. Key focus: payment integration and mobile app launch.' },
  { room: 'general', content: 'Welcome to the team! Feel free to introduce yourselves here.' },
  { room: 'general', content: 'Reminder: Team lunch on Friday at 12pm!' },
];

// ============================================================================
// Seed Functions
// ============================================================================
const state = {
  users: new Map<string, User>(),
  workspaces: new Map<string, Workspace>(),
  projects: new Map<string, Project>(),
  sprints: new Map<string, Sprint>(),
  issues: new Map<string, Issue>(),
  rooms: new Map<string, Room>(),
  messages: [] as Message[],
};

async function seedUsers() {
  console.log('\n📝 Logging in Users (must be seeded via DB first)...');

  for (const userData of SEED_USERS) {
    try {
      // Login to get token - users should already exist from DB seed
      const loginRes = await apiCall<any>('POST', '/auth/login', {
        email: userData.email,
        password: userData.password,
      });

      // Extract token from Set-Cookie header or response body
      const token = loginRes.access_token || loginRes.accessToken || loginRes.token;
      const userId = loginRes.user?.id || loginRes.userId || loginRes.user_id;

      if (!token) {
        console.log(`  ⚠️  No token returned for ${userData.email}`);
        continue;
      }

      state.users.set(userData.email, {
        id: userId,
        email: userData.email,
        token: token,
      });

      console.log(`  ✅ Logged in: ${userData.email}`);

    } catch (error: any) {
      console.log(`  ⚠️  Failed to login ${userData.email}: ${error.message}`);
    }
  }
}

async function seedWorkspaces() {
  console.log('\n🏢 Fetching Workspaces (from existing orgs)...');

  const owner = state.users.get('owner@acme.com');
  if (!owner) {
    console.log('  ⚠️  No owner user found, skipping workspaces');
    return;
  }

  try {
    // Get user's orgs via /me endpoint
    const meRes = await apiCall<any>('GET', '/auth/me', undefined, owner.token);
    const orgId = meRes.org_id || meRes.orgId;

    if (orgId) {
      state.workspaces.set('ACME Corporation', {
        id: orgId,
        name: 'ACME Corporation',
      });
      console.log(`  ✅ Using org: ${orgId}`);
    } else {
      // Try to get orgs list
      const orgsRes = await apiCall<any>('GET', '/orgs', undefined, owner.token);
      if (orgsRes.length > 0) {
        const org = orgsRes[0];
        state.workspaces.set(org.name || 'Default Org', {
          id: org.id,
          name: org.name || 'Default Org',
        });
        console.log(`  ✅ Found org: ${org.name}`);
      }
    }
  } catch (error: any) {
    console.log(`  ⚠️  Failed to get orgs: ${error.message}`);
  }
}

async function seedProjects() {
  console.log('\n📁 Seeding Projects...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');

  if (!owner || !workspace) {
    console.log('  ⚠️  Missing owner or workspace, skipping projects');
    return;
  }

  for (const projData of SEED_PROJECTS) {
    try {
      const res = await apiCall<any>('POST', '/api/tenant/projects', {
        name: projData.name,
        identifier: projData.identifier,
        description: projData.description,
        workspaceId: workspace.id,
      }, owner.token, {
        'x-org-id': workspace.id,
      });

      state.projects.set(projData.identifier, {
        id: res.id || res.data?.id,
        name: projData.name,
        identifier: projData.identifier,
      });

      console.log(`  ✅ Created: ${projData.name} (${projData.identifier})`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed: ${projData.name} - ${error.message}`);
    }
  }
}

async function seedSprints() {
  console.log('\n🏃 Seeding Sprints...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');
  const project = state.projects.get('ECOM');

  if (!owner || !workspace || !project) {
    console.log('  ⚠️  Missing dependencies, skipping sprints');
    return;
  }

  for (const sprintData of SEED_SPRINTS) {
    try {
      const res = await apiCall<any>('POST', `/api/tenant/projects/${project.id}/sprints`, {
        name: sprintData.name,
        startDate: sprintData.startDate,
        endDate: sprintData.endDate,
      }, owner.token, {
        'x-org-id': workspace.id,
      });

      state.sprints.set(sprintData.name, {
        id: res.id || res.data?.id,
        name: sprintData.name,
      });

      console.log(`  ✅ Created: ${sprintData.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed: ${sprintData.name} - ${error.message}`);
    }
  }
}

async function seedIssues() {
  console.log('\n🎫 Seeding Issues...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');
  const project = state.projects.get('ECOM');
  const sprint = state.sprints.values().next().value;

  if (!owner || !workspace || !project) {
    console.log('  ⚠️  Missing dependencies, skipping issues');
    return;
  }

  for (const issueData of SEED_ISSUES) {
    try {
      const res = await apiCall<any>('POST', `/api/tenant/projects/${project.id}/issues`, {
        title: issueData.title,
        description: issueData.description,
        type: issueData.type,
        priority: issueData.priority,
        sprintId: sprint?.id,
      }, owner.token, {
        'x-org-id': workspace.id,
      });

      const issue = {
        id: res.id || res.data?.id,
        title: issueData.title,
        description: issueData.description,
      };

      state.issues.set(issueData.title, issue);
      console.log(`  ✅ Created: ${issueData.title}`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed: ${issueData.title} - ${error.message}`);
    }
  }
}

async function seedChatRooms() {
  console.log('\n💬 Seeding Chat Rooms...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');

  if (!owner || !workspace) {
    console.log('  ⚠️  Missing dependencies, skipping chat rooms');
    return;
  }

  for (const roomData of SEED_ROOMS) {
    try {
      const res = await apiCall<any>('POST', '/api/chat/rooms', {
        name: roomData.name,
        description: roomData.description,
        type: 'channel',
      }, owner.token, {
        'x-org-id': workspace.id,
        'x-user-id': owner.id,
      });

      state.rooms.set(roomData.name, {
        id: res.id || res.data?.id,
        name: roomData.name,
      });

      console.log(`  ✅ Created: #${roomData.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed: #${roomData.name} - ${error.message}`);
    }
  }
}

async function seedMessages() {
  console.log('\n✉️  Seeding Messages...');

  const users = Array.from(state.users.values());
  const workspace = state.workspaces.get('ACME Corporation');

  if (users.length === 0 || !workspace) {
    console.log('  ⚠️  Missing dependencies, skipping messages');
    return;
  }

  for (let i = 0; i < SEED_MESSAGES.length; i++) {
    const msgData = SEED_MESSAGES[i];
    const room = state.rooms.get(msgData.room);
    const user = users[i % users.length]; // Rotate through users

    if (!room) {
      console.log(`  ⚠️  Room not found: ${msgData.room}`);
      continue;
    }

    try {
      const res = await apiCall<any>('POST', `/api/chat/rooms/${room.id}/messages`, {
        content: msgData.content,
        type: 'text',
      }, user.token, {
        'x-org-id': workspace.id,
        'x-user-id': user.id,
      });

      state.messages.push({
        id: res.id || res.data?.id,
        content: msgData.content,
      });

      console.log(`  ✅ Message in #${msgData.room}: "${msgData.content.substring(0, 40)}..."`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed message in #${msgData.room}: ${error.message}`);
    }
  }
}

async function indexToRag() {
  console.log('\n🔍 Indexing to RAG...');

  const workspace = state.workspaces.get('ACME Corporation');
  if (!workspace) {
    console.log('  ⚠️  No workspace found, skipping RAG indexing');
    return;
  }

  // Check RAG service
  try {
    await fetch(`${RAG_API}/health`);
  } catch {
    console.log('  ⚠️  RAG service not available, skipping');
    return;
  }

  let indexed = 0;
  let failed = 0;

  // Index issues
  for (const [title, issue] of state.issues) {
    try {
      const project = state.projects.get('ECOM');
      await fetch(`${RAG_API}/embeddings/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespaceId: project?.id || workspace.id,
          namespaceType: 'project',
          orgId: workspace.id,
          sourceType: 'document',
          sourceId: issue.id,
          content: `# ${issue.title}\n\n${issue.description}`,
          metadata: { type: 'issue', title: issue.title },
          chunkSize: 1000,
          chunkOverlap: 200,
        }),
      });
      indexed++;
      console.log(`  ✅ Indexed issue: ${title}`);
    } catch (error: any) {
      failed++;
      console.log(`  ❌ Failed to index issue: ${title}`);
    }
  }

  // Index messages
  for (const msg of state.messages) {
    try {
      const room = Array.from(state.rooms.values())[0];
      await fetch(`${RAG_API}/embeddings/index-short`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespaceId: room?.id || workspace.id,
          namespaceType: 'room',
          orgId: workspace.id,
          sourceType: 'message',
          sourceId: msg.id,
          content: msg.content,
          metadata: { type: 'chat_message' },
        }),
      });
      indexed++;
      console.log(`  ✅ Indexed message: "${msg.content.substring(0, 30)}..."`);
    } catch (error: any) {
      failed++;
      console.log(`  ❌ Failed to index message`);
    }
  }

  console.log(`\n  📊 RAG Indexing: ${indexed} succeeded, ${failed} failed`);
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           FULL FLOW SEED VIA HTTP API                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nAPI Base: ${API_BASE}`);
  console.log(`RAG API: ${RAG_API}`);

  try {
    await seedUsers();
    await seedWorkspaces();
    await seedProjects();
    await seedSprints();
    await seedIssues();
    await seedChatRooms();
    await seedMessages();
    await indexToRag();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      SUMMARY                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`  Users:      ${state.users.size}`);
    console.log(`  Workspaces: ${state.workspaces.size}`);
    console.log(`  Projects:   ${state.projects.size}`);
    console.log(`  Sprints:    ${state.sprints.size}`);
    console.log(`  Issues:     ${state.issues.size}`);
    console.log(`  Rooms:      ${state.rooms.size}`);
    console.log(`  Messages:   ${state.messages.length}`);
    console.log('\n✅ Seed completed!');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

main();
