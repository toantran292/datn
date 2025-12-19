/**
 * Seed All
 *
 * Master script to run all seed files in the correct order.
 * Handles dependencies between seeds and provides clear progress output.
 *
 * Usage:
 *   npx tsx scripts/seeds/seed-all.ts
 *   npm run seed
 */

import { seedUsers } from './seed-users';
import { seedOrganizations } from './seed-organizations';
import { seedProjects } from './seed-projects';
import { seedIssues } from './seed-issues';
import { seedChat } from './seed-chat';
import { seedChatWithVideo } from './seed-chat-with-video';
import { seedFiles } from './seed-files';
import { seedRag } from './seed-rag';

interface SeedStep {
  name: string;
  fn: () => Promise<void>;
  dependsOn?: string[];
}

const SEED_STEPS: SeedStep[] = [
  {
    name: 'Users',
    fn: seedUsers,
  },
  {
    name: 'Organizations',
    fn: seedOrganizations,
    dependsOn: ['Users'],
  },
  {
    name: 'Projects',
    fn: seedProjects,
    dependsOn: ['Organizations'],
  },
  {
    name: 'Issues',
    fn: seedIssues,
    dependsOn: ['Projects'],
  },
  {
    name: 'Chat',
    fn: seedChat,
    dependsOn: ['Organizations'],
  },
  {
    name: 'Chat with Video',
    fn: seedChatWithVideo,
    dependsOn: ['Chat'],
  },
  {
    name: 'Files',
    fn: seedFiles,
    dependsOn: ['Organizations'],
  },
  {
    name: 'RAG Embeddings',
    fn: seedRag,
    dependsOn: ['Organizations', 'Chat'],
  },
];

async function runAllSeeds() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║               DATN SEED DATA INITIALIZATION                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();
  const completed: string[] = [];
  const failed: string[] = [];

  for (const step of SEED_STEPS) {
    console.log('');
    console.log(`┌──────────────────────────────────────────────────────────────┐`);
    console.log(`│  ${step.name.padEnd(58)} │`);
    console.log(`└──────────────────────────────────────────────────────────────┘`);

    try {
      const stepStart = Date.now();
      await step.fn();
      const duration = ((Date.now() - stepStart) / 1000).toFixed(2);
      console.log(`✅ ${step.name} completed in ${duration}s`);
      completed.push(step.name);
    } catch (error) {
      console.error(`❌ ${step.name} failed:`, error);
      failed.push(step.name);

      // Continue with other seeds that don't depend on this one
      // For now, we'll stop on failure
      break;
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Completed: ${completed.length}/${SEED_STEPS.length}`);

  if (completed.length > 0) {
    console.log(`   - ${completed.join(', ')}`);
  }

  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`   - ${failed.join(', ')}`);
  }

  console.log('');
  console.log(`⏱️  Total time: ${totalDuration}s`);
  console.log('');

  if (failed.length > 0) {
    process.exit(1);
  }
}

// Parse command line arguments for selective seeding
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
DATN Seed Script

Usage:
  npx tsx scripts/seeds/seed-all.ts [options]

Options:
  --help, -h     Show this help message
  --only <name>  Run only specific seed (users, orgs, projects, issues, chat, video, files, rag)
  --skip <name>  Skip specific seed

Examples:
  npx tsx scripts/seeds/seed-all.ts                    # Run all seeds
  npx tsx scripts/seeds/seed-all.ts --only users       # Run only users seed
  npx tsx scripts/seeds/seed-all.ts --skip video       # Skip video seed
  npx tsx scripts/seeds/seed-all.ts --only rag         # Run only RAG embeddings

Available Seeds:
  - users        User accounts
  - orgs         Organizations and memberships
  - projects     Projects, sprints, and statuses
  - issues       Issues, comments, and activities
  - chat         Chat rooms and messages
  - video        Meeting recordings and video messages
  - files        File metadata and folders
  - rag          RAG embeddings for AI search (requires RAG service running)
`);
  process.exit(0);
}

// Handle --only flag
const onlyIndex = args.indexOf('--only');
if (onlyIndex !== -1 && args[onlyIndex + 1]) {
  const seedName = args[onlyIndex + 1].toLowerCase();
  const seedMap: Record<string, () => Promise<void>> = {
    users: seedUsers,
    orgs: seedOrganizations,
    organizations: seedOrganizations,
    projects: seedProjects,
    issues: seedIssues,
    chat: seedChat,
    video: seedChatWithVideo,
    files: seedFiles,
    rag: seedRag,
    embeddings: seedRag,
  };

  if (seedMap[seedName]) {
    console.log(`Running only: ${seedName}`);
    seedMap[seedName]()
      .then(() => {
        console.log(`✅ ${seedName} seed completed`);
        process.exit(0);
      })
      .catch((error) => {
        console.error(`❌ ${seedName} seed failed:`, error);
        process.exit(1);
      });
  } else {
    console.error(`Unknown seed: ${seedName}`);
    console.log('Available: users, orgs, projects, issues, chat, video, files, rag');
    process.exit(1);
  }
} else {
  // Run all seeds
  runAllSeeds()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
