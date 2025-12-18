/**
 * Seed Files
 *
 * Creates demo file metadata and folders in the File-Storage service.
 *
 * Schema Reference:
 * - services/file-storage/src/metadata/schemas/file-metadata.schema.ts
 * - services/file-storage/src/metadata/schemas/folder.schema.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import {
  USER_IDS,
  ORG_IDS,
  DB_CONFIG,
  UPLOAD_STATUS,
  MEETING_VIDEO_PATH,
  daysAgo,
} from './seed-constants';
import * as fs from 'fs';

// Generate consistent ObjectIds for folders (24 hex chars)
const FOLDER_OID = {
  ACME_DESIGNS: new ObjectId('aaaaaa000000000000000001'),
  ACME_DOCS: new ObjectId('aaaaaa000000000000000002'),
  ACME_MEETINGS: new ObjectId('aaaaaa000000000000000003'),
};

interface Folder {
  _id: ObjectId;
  name: string;
  parentId: ObjectId | null;
  orgId: string;
  workspaceId: string;
  createdBy: string;
  path: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface FileMetadata {
  _id: ObjectId;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  url?: string;
  service: string;
  modelType: string;
  subjectId: string;
  uploadedBy: string;
  orgId: string;
  workspaceId?: string;
  folderId?: ObjectId | null;
  tags: string[];
  metadata: Record<string, any>;
  uploadStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// FOLDERS
// =============================================================================
const FOLDERS: Folder[] = [
  // ACME Workspace Folders
  {
    _id: FOLDER_OID.ACME_DESIGNS,
    name: 'Designs',
    parentId: null,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    createdBy: USER_IDS.ACME_DESIGNER,
    path: [],
    createdAt: daysAgo(30),
    updatedAt: new Date(),
  },
  {
    _id: FOLDER_OID.ACME_DOCS,
    name: 'Documents',
    parentId: null,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    createdBy: USER_IDS.ACME_PM_1,
    path: [],
    createdAt: daysAgo(30),
    updatedAt: new Date(),
  },
  {
    _id: FOLDER_OID.ACME_MEETINGS,
    name: 'Meeting Recordings',
    parentId: null,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    createdBy: USER_IDS.ACME_PM_1,
    path: [],
    createdAt: daysAgo(30),
    updatedAt: new Date(),
  },
];

// =============================================================================
// FILE METADATA
// =============================================================================
function getVideoFileSize(): number {
  try {
    const stats = fs.statSync(MEETING_VIDEO_PATH);
    return stats.size;
  } catch {
    return 52428800; // 50MB default
  }
}

const FILES: FileMetadata[] = [
  // Meeting recordings
  {
    _id: new ObjectId(),
    originalName: 'sprint-4-planning.mp4',
    mimeType: 'video/mp4',
    size: getVideoFileSize(),
    bucket: 'meeting-recordings',
    objectKey: 'recordings/acme/sprint-4-planning.mp4',
    url: 'http://localhost:9000/meeting-recordings/recordings/acme/sprint-4-planning.mp4',
    service: 'meeting',
    modelType: 'recording',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_PM_1,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_MEETINGS,
    tags: ['meeting', 'sprint-4', 'planning'],
    metadata: { duration: 5400, participants: 6 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    _id: new ObjectId(),
    originalName: 'retro-sprint-3.mp4',
    mimeType: 'video/mp4',
    size: getVideoFileSize(),
    bucket: 'meeting-recordings',
    objectKey: 'recordings/acme/retro-sprint-3.mp4',
    url: 'http://localhost:9000/meeting-recordings/recordings/acme/retro-sprint-3.mp4',
    service: 'meeting',
    modelType: 'recording',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_DEV_1,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_MEETINGS,
    tags: ['meeting', 'sprint-3', 'retrospective'],
    metadata: { duration: 3600, participants: 5 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    _id: new ObjectId(),
    originalName: 'daily-standup-2024-12-17.mp4',
    mimeType: 'video/mp4',
    size: getVideoFileSize(),
    bucket: 'meeting-recordings',
    objectKey: 'recordings/acme/daily-standup-2024-12-17.mp4',
    url: 'http://localhost:9000/meeting-recordings/recordings/acme/daily-standup-2024-12-17.mp4',
    service: 'meeting',
    modelType: 'recording',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_PM_1,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_MEETINGS,
    tags: ['meeting', 'standup', 'daily'],
    metadata: { duration: 1800, participants: 4 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },

  // Design files
  {
    _id: new ObjectId(),
    originalName: 'checkout-flow-v2.fig',
    mimeType: 'application/octet-stream',
    size: 2456789,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/designs/checkout-flow-v2.fig`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_DESIGNER,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_DESIGNS,
    tags: ['design', 'figma', 'checkout'],
    metadata: { version: '2.0', pages: 12 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(5),
  },
  {
    _id: new ObjectId(),
    originalName: 'mobile-app-mockups.png',
    mimeType: 'image/png',
    size: 1234567,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/designs/mobile-app-mockups.png`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_DESIGNER,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_DESIGNS,
    tags: ['design', 'mockup', 'mobile'],
    metadata: { width: 1920, height: 1080 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(8),
  },
  {
    _id: new ObjectId(),
    originalName: 'email-templates.zip',
    mimeType: 'application/zip',
    size: 567890,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/designs/email-templates.zip`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_DESIGNER,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_DESIGNS,
    tags: ['design', 'email', 'templates'],
    metadata: { fileCount: 5 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },

  // Documents
  {
    _id: new ObjectId(),
    originalName: 'API-Documentation-v2.pdf',
    mimeType: 'application/pdf',
    size: 3456789,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/docs/API-Documentation-v2.pdf`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_DEV_1,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_DOCS,
    tags: ['documentation', 'api', 'technical'],
    metadata: { pages: 45, version: '2.1' },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(2),
  },
  {
    _id: new ObjectId(),
    originalName: 'Sprint-3-Report.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 234567,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/docs/Sprint-3-Report.docx`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_PM_1,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_DOCS,
    tags: ['report', 'sprint', 'summary'],
    metadata: { pages: 8 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    _id: new ObjectId(),
    originalName: 'Product-Roadmap-Q1-2025.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 456789,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/docs/Product-Roadmap-Q1-2025.xlsx`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_PM_1,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_DOCS,
    tags: ['roadmap', 'planning', 'q1-2025'],
    metadata: { sheets: 4 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(3),
  },
  {
    _id: new ObjectId(),
    originalName: 'Architecture-Diagram.png',
    mimeType: 'image/png',
    size: 789012,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/docs/Architecture-Diagram.png`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_DEV_1,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: FOLDER_OID.ACME_DOCS,
    tags: ['architecture', 'diagram', 'technical'],
    metadata: { width: 2560, height: 1440 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(10),
  },

  // Root level files (no folder)
  {
    _id: new ObjectId(),
    originalName: 'Company-Logo.svg',
    mimeType: 'image/svg+xml',
    size: 12345,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.ACME}/Company-Logo.svg`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.ACME,
    uploadedBy: USER_IDS.ACME_OWNER,
    orgId: ORG_IDS.ACME,
    workspaceId: ORG_IDS.ACME,
    folderId: null,
    tags: ['logo', 'branding'],
    metadata: {},
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },

  // Tech Startup files
  {
    _id: new ObjectId(),
    originalName: 'MVP-Requirements.pdf',
    mimeType: 'application/pdf',
    size: 1234567,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.TECH_STARTUP}/MVP-Requirements.pdf`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.TECH_STARTUP,
    uploadedBy: USER_IDS.STARTUP_OWNER,
    orgId: ORG_IDS.TECH_STARTUP,
    workspaceId: ORG_IDS.TECH_STARTUP,
    folderId: null,
    tags: ['requirements', 'mvp', 'product'],
    metadata: { pages: 15 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(20),
  },
  {
    _id: new ObjectId(),
    originalName: 'Pitch-Deck-v3.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 5678901,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.TECH_STARTUP}/Pitch-Deck-v3.pptx`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.TECH_STARTUP,
    uploadedBy: USER_IDS.STARTUP_OWNER,
    orgId: ORG_IDS.TECH_STARTUP,
    workspaceId: ORG_IDS.TECH_STARTUP,
    folderId: null,
    tags: ['pitch', 'presentation', 'investors'],
    metadata: { slides: 20 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },

  // Innovation Labs files
  {
    _id: new ObjectId(),
    originalName: 'LLM-Comparison-Report.pdf',
    mimeType: 'application/pdf',
    size: 2345678,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.INNOVATION_LABS}/LLM-Comparison-Report.pdf`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.INNOVATION_LABS,
    uploadedBy: USER_IDS.LABS_LEAD,
    orgId: ORG_IDS.INNOVATION_LABS,
    workspaceId: ORG_IDS.INNOVATION_LABS,
    folderId: null,
    tags: ['research', 'llm', 'ai', 'comparison'],
    metadata: { pages: 32 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(7),
  },
  {
    _id: new ObjectId(),
    originalName: 'RAG-Pipeline-Architecture.png',
    mimeType: 'image/png',
    size: 567890,
    bucket: 'workspace-files',
    objectKey: `files/${ORG_IDS.INNOVATION_LABS}/RAG-Pipeline-Architecture.png`,
    service: 'workspace',
    modelType: 'file',
    subjectId: ORG_IDS.INNOVATION_LABS,
    uploadedBy: USER_IDS.LABS_RESEARCHER_2,
    orgId: ORG_IDS.INNOVATION_LABS,
    workspaceId: ORG_IDS.INNOVATION_LABS,
    folderId: null,
    tags: ['rag', 'architecture', 'diagram', 'ai'],
    metadata: { width: 1920, height: 1080 },
    uploadStatus: UPLOAD_STATUS.COMPLETED,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
];

async function seedFiles() {
  const client = new MongoClient(DB_CONFIG.MONGODB.uri);

  try {
    console.log('🌱 Seeding file metadata...');

    await client.connect();
    const db = client.db(DB_CONFIG.MONGODB.databases.fileStorage);

    // Seed folders
    const foldersCollection = db.collection('folders');

    for (const folder of FOLDERS) {
      const existing = await foldersCollection.findOne({ _id: folder._id });
      if (existing) {
        console.log(`  ⏭️  Folder ${folder.name} already exists, skipping`);
        continue;
      }

      await foldersCollection.insertOne(folder);
      console.log(`  ✅ Created folder: ${folder.name}`);
    }

    // Seed file metadata
    const filesCollection = db.collection('file_metadata');

    for (const file of FILES) {
      // Check if file with same objectKey exists
      const existing = await filesCollection.findOne({ objectKey: file.objectKey });
      if (existing) {
        console.log(`  ⏭️  File ${file.originalName} already exists, skipping`);
        continue;
      }

      await filesCollection.insertOne(file);
      console.log(`  ✅ Created file: ${file.originalName}`);
    }

    // Create indexes
    await filesCollection.createIndex({ orgId: 1, createdAt: -1 });
    await filesCollection.createIndex({ workspaceId: 1, folderId: 1, createdAt: -1 });
    await filesCollection.createIndex({ uploadedBy: 1, createdAt: -1 });
    await filesCollection.createIndex({ tags: 1 });
    await foldersCollection.createIndex({ orgId: 1, workspaceId: 1, parentId: 1 });

    console.log('✅ Seeded file metadata successfully');
  } catch (error) {
    console.error('❌ Error seeding files:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run if executed directly
if (require.main === module) {
  seedFiles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedFiles };
