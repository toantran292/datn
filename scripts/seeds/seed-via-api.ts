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
  name: string;
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
interface ApiResponse<T> {
  data: T;
  cookies?: Record<string, string>;
}

async function apiCall<T>(
  method: string,
  path: string,
  body?: any,
  token?: string,
  headers?: Record<string, string>
): Promise<T> {
  const result = await apiCallWithCookies<T>(method, path, body, token, headers);
  return result.data;
}

async function apiCallWithCookies<T>(
  method: string,
  path: string,
  body?: any,
  token?: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
    reqHeaders['Cookie'] = `uts_at=${token}`;
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

  // Parse Set-Cookie headers
  const cookies: Record<string, string> = {};
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const cookieMatches = setCookie.match(/([^=]+)=([^;]+)/g);
    if (cookieMatches) {
      for (const match of cookieMatches) {
        const [name, value] = match.split('=');
        if (name && value) {
          cookies[name.trim()] = value.trim();
        }
      }
    }
  }

  const text = await response.text();
  return {
    data: text ? JSON.parse(text) : {},
    cookies,
  };
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
    name: 'Setup project structure',
    description: 'Initialize the project with NestJS, configure TypeORM, and setup Docker environment',
    type: 'TASK',
    priority: 'HIGH',
  },
  {
    name: 'User authentication system',
    description: 'Implement JWT-based authentication with refresh tokens, OAuth2 support for Google and GitHub',
    type: 'STORY',
    priority: 'HIGH',
  },
  {
    name: 'Product catalog API',
    description: 'Create CRUD endpoints for products with pagination, filtering, and search capabilities',
    type: 'STORY',
    priority: 'MEDIUM',
  },
  {
    name: 'Shopping cart functionality',
    description: 'Implement shopping cart with add/remove items, quantity updates, and price calculation',
    type: 'STORY',
    priority: 'MEDIUM',
  },
  {
    name: 'Payment gateway integration',
    description: 'Integrate Stripe for payment processing with support for multiple currencies',
    type: 'STORY',
    priority: 'HIGH',
  },
  {
    name: 'Order management system',
    description: 'Build order tracking, status updates, and email notifications',
    type: 'STORY',
    priority: 'MEDIUM',
  },
  {
    name: 'Fix checkout total calculation bug',
    description: 'When discount codes are applied, the total is not recalculated correctly. Need to fix the price calculation logic.',
    type: 'BUG',
    priority: 'CRITICAL',
  },
  {
    name: 'Performance optimization',
    description: 'Optimize database queries and add caching layer for product listings',
    type: 'TASK',
    priority: 'LOW',
  },
];

const SEED_ROOMS = [
  { name: 'general', isPrivate: false, type: 'channel' as const },
  { name: 'engineering', isPrivate: false, type: 'channel' as const },
  { name: 'product', isPrivate: false, type: 'channel' as const },
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
      // Endpoint is /auth/token, token is returned via Set-Cookie header
      const result = await apiCallWithCookies<any>('POST', '/auth/token', {
        email: userData.email,
        password: userData.password,
      });

      // Extract token from cookie (uts_at)
      const token = result.cookies?.uts_at;
      const userId = result.data.user_id;

      if (!token) {
        console.log(`  ⚠️  No token returned for ${userData.email}`);
        continue;
      }

      state.users.set(userData.email, {
        id: userId,
        email: userData.email,
        token: token,
      });

      console.log(`  ✅ Logged in: ${userData.email} (id: ${userId})`);

    } catch (error: any) {
      console.log(`  ⚠️  Failed to login ${userData.email}: ${error.message}`);
    }
  }
}

async function switchOrg(user: User, orgId: string): Promise<boolean> {
  try {
    const result = await apiCallWithCookies<any>('POST', '/auth/switch-org', {
      org_id: orgId,
    }, user.token);

    // Update token from new cookie
    const newToken = result.cookies?.uts_at;
    if (newToken) {
      user.token = newToken;
      return true;
    }
    return false;
  } catch (error: any) {
    console.log(`  ⚠️  Failed to switch org: ${error.message}`);
    return false;
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
    // Get user's organizations via /me/tenants endpoint
    const tenantsRes = await apiCall<any>('GET', '/me/tenants', undefined, owner.token);
    const joinedOrgs = tenantsRes.joined || [];

    if (joinedOrgs.length > 0) {
      for (const org of joinedOrgs) {
        state.workspaces.set(org.name || org.display_name, {
          id: org.id,
          name: org.name || org.display_name,
        });
        console.log(`  ✅ Found org: ${org.name || org.display_name} (${org.id})`);
      }

      // Switch all users to first org to get tokens with org context
      const firstOrg = joinedOrgs[0];
      console.log(`\n  🔄 Switching users to org: ${firstOrg.name || firstOrg.display_name}...`);
      for (const [email, user] of state.users) {
        const success = await switchOrg(user, firstOrg.id);
        if (success) {
          console.log(`    ✅ ${email} switched to org`);
        }
      }
    } else {
      console.log('  ⚠️  No organizations found for user');
    }
  } catch (error: any) {
    console.log(`  ⚠️  Failed to get orgs: ${error.message}`);
  }
}

async function seedProjects() {
  console.log('\n📁 Fetching/Creating Projects...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');

  if (!owner || !workspace) {
    console.log('  ⚠️  Missing owner or workspace, skipping projects');
    return;
  }

  // Fetch existing projects via PM API (token has org context after switch-org)
  try {
    const projects = await apiCall<any[]>('GET', '/pm/api/projects', undefined, owner.token);

    if (Array.isArray(projects) && projects.length > 0) {
      for (const proj of projects) {
        state.projects.set(proj.identifier, {
          id: proj.id,
          name: proj.name,
          identifier: proj.identifier,
        });
        console.log(`  ✅ Found existing: ${proj.name} (${proj.identifier})`);
      }
      return;
    }
  } catch (error: any) {
    console.log(`  ℹ️  Could not fetch projects: ${error.message}`);
  }

  // Create new projects via PM API
  for (const projData of SEED_PROJECTS) {
    try {
      const project = await apiCall<any>('POST', '/pm/api/projects', {
        name: projData.name,
        identifier: projData.identifier,
        description: projData.description,
      }, owner.token);

      state.projects.set(projData.identifier, {
        id: project.id,
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
  console.log('\n🏃 Fetching/Creating Sprints...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');
  const project = state.projects.get('ECOM') || state.projects.values().next().value;

  if (!owner || !workspace || !project) {
    console.log('  ⚠️  Missing dependencies, skipping sprints');
    return;
  }

  // Fetch existing sprints via PM API
  try {
    const sprints = await apiCall<any[]>('GET', `/pm/api/projects/${project.id}/sprints`, undefined, owner.token);

    if (Array.isArray(sprints) && sprints.length > 0) {
      for (const sprint of sprints) {
        state.sprints.set(sprint.name, {
          id: sprint.id,
          name: sprint.name,
        });
        console.log(`  ✅ Found existing: ${sprint.name}`);
      }
      return;
    }
  } catch (error: any) {
    console.log(`  ℹ️  Could not fetch sprints: ${error.message}`);
  }

  // Create new sprints via PM API
  for (const sprintData of SEED_SPRINTS) {
    try {
      const sprint = await apiCall<any>('POST', `/pm/api/projects/${project.id}/sprints`, {
        name: sprintData.name,
        startDate: sprintData.startDate,
        endDate: sprintData.endDate,
      }, owner.token);

      state.sprints.set(sprintData.name, {
        id: sprint.id,
        name: sprintData.name,
      });

      console.log(`  ✅ Created: ${sprintData.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed: ${sprintData.name} - ${error.message}`);
    }
  }
}

async function seedIssues() {
  console.log('\n🎫 Fetching/Creating Issues...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');
  const project = state.projects.get('ECOM') || state.projects.values().next().value;
  const sprint = state.sprints.values().next().value;

  if (!owner || !workspace || !project) {
    console.log('  ⚠️  Missing dependencies, skipping issues');
    return;
  }

  // Fetch existing issues via PM API - endpoint is /api/projects/:projectId/issues
  try {
    const issues = await apiCall<any[]>('GET', `/pm/api/projects/${project.id}/issues`, undefined, owner.token);

    if (Array.isArray(issues) && issues.length > 0) {
      for (const issue of issues.slice(0, 10)) { // Only take first 10
        state.issues.set(issue.name, {
          id: issue.id,
          name: issue.name,
          description: issue.description || '',
        });
        console.log(`  ✅ Found existing: ${issue.name}`);
      }
      console.log(`  ℹ️  Found ${issues.length} total issues`);
      return;
    }
  } catch (error: any) {
    console.log(`  ℹ️  Could not fetch issues: ${error.message}`);
  }

  // Create new issues via PM API
  console.log(`  ℹ️  Using project: ${project.id}, sprint: ${sprint?.id}`);
  for (const issueData of SEED_ISSUES) {
    try {
      const payload = {
        projectId: project.id,
        name: issueData.name,
        description: issueData.description,
        type: issueData.type,
        priority: issueData.priority,
        ...(sprint?.id ? { sprintId: sprint.id } : {}),
      };
      const issue = await apiCall<any>('POST', '/pm/api/issues', payload, owner.token);

      state.issues.set(issueData.name, {
        id: issue.id,
        name: issueData.name,
        description: issueData.description,
      });

      console.log(`  ✅ Created: ${issueData.name}`);
    } catch (error: any) {
      console.log(`  ⚠️  Failed: ${issueData.name} - ${error.message}`);
    }
  }
}

async function seedChatRooms() {
  console.log('\n💬 Fetching/Creating Chat Rooms...');

  const owner = state.users.get('owner@acme.com');
  const workspace = state.workspaces.get('ACME Corporation');

  if (!owner || !workspace) {
    console.log('  ⚠️  Missing dependencies, skipping chat rooms');
    return;
  }

  // Fetch existing rooms via Chat API (token has org context after switch-org)
  // Edge gateway adds X-User-ID and X-Org-ID from the token
  try {
    const roomsRes = await apiCall<any>('GET', '/chat/rooms', undefined, owner.token);

    const rooms = roomsRes.data || roomsRes;
    if (Array.isArray(rooms) && rooms.length > 0) {
      for (const room of rooms) {
        state.rooms.set(room.name, {
          id: room.id,
          name: room.name,
        });
        console.log(`  ✅ Found existing: #${room.name}`);
      }
      return;
    }
  } catch (error: any) {
    console.log(`  ℹ️  Could not fetch rooms: ${error.message}`);
  }

  // Create new rooms via Chat API
  for (const roomData of SEED_ROOMS) {
    try {
      const room = await apiCall<any>('POST', '/chat/rooms', {
        name: roomData.name,
        isPrivate: roomData.isPrivate,
        type: roomData.type,
      }, owner.token);

      state.rooms.set(roomData.name, {
        id: room.id,
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
  // Messages are sent via WebSocket in chat service, not REST API
  // Skip HTTP message seeding - use DB seed (seed-chat.ts) instead
  console.log('  ℹ️  Messages require WebSocket - use DB seed (npm run seed:chat) instead');
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
  for (const [name, issue] of state.issues) {
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
          content: `# ${issue.name}\n\n${issue.description}`,
          metadata: { type: 'issue', name: issue.name },
          chunkSize: 1000,
          chunkOverlap: 200,
        }),
      });
      indexed++;
      console.log(`  ✅ Indexed issue: ${name}`);
    } catch (error: any) {
      failed++;
      console.log(`  ❌ Failed to index issue: ${name}`);
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
