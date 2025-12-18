/**
 * Seed Chat with Video
 *
 * Adds video meeting messages to chat rooms.
 * Uses the meeting-example.mp4 asset for demo purposes.
 *
 * Schema Reference:
 * - services/chat/src/database/entities/message.entity.ts
 * - services/chat/src/database/entities/message-attachment.entity.ts
 * - services/meeting/signaling/prisma/schema.prisma
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import {
  ROOM_IDS,
  MEETING_IDS,
  USER_IDS,
  ORG_IDS,
  FILE_IDS,
  DB_CONFIG,
  MESSAGE_TYPE,
  MEETING_STATUS,
  MEETING_VIDEO_PATH,
  hoursAgo,
  daysAgo,
  newId,
} from './seed-constants';

interface MeetingRecord {
  id: string;
  roomId: string;
  subjectType: string;
  subjectId: string;
  hostUserId: string;
  orgId: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
  duration: number; // seconds
}

interface Recording {
  id: string;
  meetingId: string;
  status: string;
  startedBy: string;
  startedAt: Date;
  stoppedAt: Date;
  duration: number;
  fileSize: number;
  s3Key: string;
  s3Url: string;
}

// =============================================================================
// MEETINGS
// =============================================================================
const MEETINGS: MeetingRecord[] = [
  {
    id: MEETING_IDS.ACME_STANDUP_1,
    roomId: `meeting-${ROOM_IDS.ACME_ECOM_PROJECT}`,
    subjectType: 'chat',
    subjectId: ROOM_IDS.ACME_ECOM_PROJECT,
    hostUserId: USER_IDS.ACME_PM_1,
    orgId: ORG_IDS.ACME,
    status: MEETING_STATUS.ENDED,
    startedAt: daysAgo(1),
    endedAt: hoursAgo(23),
    duration: 1800, // 30 minutes
  },
  {
    id: MEETING_IDS.ACME_RETRO_1,
    roomId: `meeting-${ROOM_IDS.ACME_ENGINEERING}`,
    subjectType: 'chat',
    subjectId: ROOM_IDS.ACME_ENGINEERING,
    hostUserId: USER_IDS.ACME_DEV_1,
    orgId: ORG_IDS.ACME,
    status: MEETING_STATUS.ENDED,
    startedAt: daysAgo(3),
    endedAt: daysAgo(3),
    duration: 3600, // 60 minutes
  },
  {
    id: MEETING_IDS.ACME_PLANNING,
    roomId: `meeting-${ROOM_IDS.ACME_ECOM_PROJECT}`,
    subjectType: 'chat',
    subjectId: ROOM_IDS.ACME_ECOM_PROJECT,
    hostUserId: USER_IDS.ACME_PM_1,
    orgId: ORG_IDS.ACME,
    status: MEETING_STATUS.ENDED,
    startedAt: daysAgo(7),
    endedAt: daysAgo(7),
    duration: 5400, // 90 minutes
  },
  {
    id: MEETING_IDS.STARTUP_DAILY,
    roomId: `meeting-${ROOM_IDS.STARTUP_MVP}`,
    subjectType: 'chat',
    subjectId: ROOM_IDS.STARTUP_MVP,
    hostUserId: USER_IDS.STARTUP_CTO,
    orgId: ORG_IDS.TECH_STARTUP,
    status: MEETING_STATUS.ENDED,
    startedAt: daysAgo(1),
    endedAt: hoursAgo(22),
    duration: 900, // 15 minutes
  },
];

// =============================================================================
// RECORDINGS - Using the meeting-example.mp4 asset
// =============================================================================
function getVideoFileSize(): number {
  try {
    const stats = fs.statSync(MEETING_VIDEO_PATH);
    return stats.size;
  } catch {
    // Default size if file not found
    return 50 * 1024 * 1024; // 50MB
  }
}

const RECORDINGS: Recording[] = [
  {
    id: newId(),
    meetingId: MEETING_IDS.ACME_STANDUP_1,
    status: 'COMPLETED',
    startedBy: USER_IDS.ACME_PM_1,
    startedAt: daysAgo(1),
    stoppedAt: hoursAgo(23),
    duration: 1800,
    fileSize: getVideoFileSize(),
    s3Key: 'recordings/acme/standup-2024-12-17.mp4',
    s3Url: 'http://localhost:9000/meeting-recordings/recordings/acme/standup-2024-12-17.mp4',
  },
  {
    id: newId(),
    meetingId: MEETING_IDS.ACME_RETRO_1,
    status: 'COMPLETED',
    startedBy: USER_IDS.ACME_DEV_1,
    startedAt: daysAgo(3),
    stoppedAt: daysAgo(3),
    duration: 3600,
    fileSize: getVideoFileSize(),
    s3Key: 'recordings/acme/retro-sprint-3.mp4',
    s3Url: 'http://localhost:9000/meeting-recordings/recordings/acme/retro-sprint-3.mp4',
  },
  {
    id: newId(),
    meetingId: MEETING_IDS.ACME_PLANNING,
    status: 'COMPLETED',
    startedBy: USER_IDS.ACME_PM_1,
    startedAt: daysAgo(7),
    stoppedAt: daysAgo(7),
    duration: 5400,
    fileSize: getVideoFileSize(),
    s3Key: 'recordings/acme/sprint-4-planning.mp4',
    s3Url: 'http://localhost:9000/meeting-recordings/recordings/acme/sprint-4-planning.mp4',
  },
];

async function seedChatWithVideo() {
  // Connect to chat database
  const chatPool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database: DB_CONFIG.POSTGRES.databases.chat,
  });

  // Connect to meeting database
  const meetingPool = new Pool({
    host: DB_CONFIG.POSTGRES.host,
    port: DB_CONFIG.POSTGRES.port,
    user: DB_CONFIG.POSTGRES.user,
    password: DB_CONFIG.POSTGRES.password,
    database: DB_CONFIG.POSTGRES.databases.meeting,
  });

  const chatClient = await chatPool.connect();
  const meetingClient = await meetingPool.connect();

  try {
    console.log('🌱 Seeding meetings and video messages...');

    // =========================================================================
    // MEETING DATABASE
    // =========================================================================
    // Check if Meeting table exists
    const tableCheck = await meetingClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'Meeting'
      ) as exists
    `);

    const meetingTableExists = tableCheck.rows[0].exists;

    if (!meetingTableExists) {
      console.log('  ⚠️  Meeting table does not exist. Run prisma migrate for meeting service first.');
      console.log('  ⏭️  Skipping meeting seed, will only seed chat messages...');
    } else {
      await meetingClient.query('BEGIN');

      for (const meeting of MEETINGS) {
        const existing = await meetingClient.query(
          'SELECT id FROM "Meeting" WHERE id = $1',
          [meeting.id]
        );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Meeting ${meeting.id} already exists, skipping`);
        continue;
      }

      await meetingClient.query(
        `INSERT INTO "Meeting" (
          id, "roomId", "subjectType", "subjectId", "hostUserId", "orgId",
          status, locked, "startedAt", "endedAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          meeting.id,
          meeting.roomId,
          meeting.subjectType,
          meeting.subjectId,
          meeting.hostUserId,
          meeting.orgId,
          meeting.status,
          false,
          meeting.startedAt,
          meeting.endedAt,
          meeting.startedAt,
          meeting.endedAt || new Date(),
        ]
      );

      console.log(`  ✅ Created meeting: ${meeting.roomId}`);

      // Add participants
      const participants = [
        { odI: meeting.hostUserId, role: 'HOST' },
        ...(meeting.orgId === ORG_IDS.ACME
          ? [
              { odI: USER_IDS.ACME_DEV_1, role: 'GUEST' },
              { odI: USER_IDS.ACME_DEV_2, role: 'GUEST' },
              { odI: USER_IDS.ACME_QA_1, role: 'GUEST' },
            ]
          : [
              { odI: USER_IDS.STARTUP_DEV_1, role: 'GUEST' },
              { odI: USER_IDS.STARTUP_DEV_2, role: 'GUEST' },
            ]),
      ];

      for (const p of participants) {
        await meetingClient.query(
          `INSERT INTO "Participant" (
            id, "meetingId", "userId", role, status, "joinedAt", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            newId(),
            meeting.id,
            p.odI,
            p.role,
            'LEFT',
            meeting.startedAt,
            meeting.startedAt,
            meeting.endedAt || new Date(),
          ]
        );
      }
      }

      // Add recordings
      for (const recording of RECORDINGS) {
        const existing = await meetingClient.query(
          'SELECT id FROM "Recording" WHERE "meetingId" = $1',
          [recording.meetingId]
        );

        if (existing.rows.length > 0) {
          continue;
        }

        await meetingClient.query(
          `INSERT INTO "Recording" (
            id, "meetingId", "sessionId", status, "startedBy", "startedAt",
            "stoppedBy", "stoppedAt", duration, "fileSize", "s3Key", "s3Url",
            "uploadedAt", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            recording.id,
            recording.meetingId,
            `session-${recording.id}`,
            recording.status,
            recording.startedBy,
            recording.startedAt,
            recording.startedBy,
            recording.stoppedAt,
            recording.duration,
            recording.fileSize,
            recording.s3Key,
            recording.s3Url,
            recording.stoppedAt,
            recording.startedAt,
            recording.stoppedAt,
          ]
        );

        console.log(`  ✅ Created recording for meeting ${recording.meetingId}`);
      }

      await meetingClient.query('COMMIT');
    }

    // =========================================================================
    // CHAT DATABASE - Add huddle messages
    // =========================================================================
    await chatClient.query('BEGIN');

    // Add huddle started/ended messages for each meeting
    const huddleMessages = [
      // ACME E-commerce project standup
      {
        roomId: ROOM_IDS.ACME_ECOM_PROJECT,
        userId: USER_IDS.ACME_PM_1,
        orgId: ORG_IDS.ACME,
        type: MESSAGE_TYPE.HUDDLE_STARTED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.ACME_STANDUP_1,
          hostName: 'Vũ Thị Phương',
          title: 'Daily Standup',
        }),
        createdAt: daysAgo(1),
      },
      {
        roomId: ROOM_IDS.ACME_ECOM_PROJECT,
        userId: USER_IDS.ACME_PM_1,
        orgId: ORG_IDS.ACME,
        type: MESSAGE_TYPE.HUDDLE_ENDED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.ACME_STANDUP_1,
          duration: 1800,
          recordingUrl: 'http://localhost:9000/meeting-recordings/recordings/acme/standup-2024-12-17.mp4',
          participants: 4,
        }),
        createdAt: hoursAgo(23),
      },

      // Engineering retro
      {
        roomId: ROOM_IDS.ACME_ENGINEERING,
        userId: USER_IDS.ACME_DEV_1,
        orgId: ORG_IDS.ACME,
        type: MESSAGE_TYPE.HUDDLE_STARTED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.ACME_RETRO_1,
          hostName: 'Lê Văn Cường',
          title: 'Sprint 3 Retrospective',
        }),
        createdAt: daysAgo(3),
      },
      {
        roomId: ROOM_IDS.ACME_ENGINEERING,
        userId: USER_IDS.ACME_DEV_1,
        orgId: ORG_IDS.ACME,
        type: MESSAGE_TYPE.HUDDLE_ENDED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.ACME_RETRO_1,
          duration: 3600,
          recordingUrl: 'http://localhost:9000/meeting-recordings/recordings/acme/retro-sprint-3.mp4',
          participants: 5,
        }),
        createdAt: daysAgo(3),
      },

      // Sprint 4 Planning
      {
        roomId: ROOM_IDS.ACME_ECOM_PROJECT,
        userId: USER_IDS.ACME_PM_1,
        orgId: ORG_IDS.ACME,
        type: MESSAGE_TYPE.HUDDLE_STARTED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.ACME_PLANNING,
          hostName: 'Vũ Thị Phương',
          title: 'Sprint 4 Planning',
        }),
        createdAt: daysAgo(7),
      },
      {
        roomId: ROOM_IDS.ACME_ECOM_PROJECT,
        userId: USER_IDS.ACME_PM_1,
        orgId: ORG_IDS.ACME,
        type: MESSAGE_TYPE.HUDDLE_ENDED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.ACME_PLANNING,
          duration: 5400,
          recordingUrl: 'http://localhost:9000/meeting-recordings/recordings/acme/sprint-4-planning.mp4',
          participants: 6,
        }),
        createdAt: daysAgo(7),
      },

      // Tech Startup daily
      {
        roomId: ROOM_IDS.STARTUP_MVP,
        userId: USER_IDS.STARTUP_CTO,
        orgId: ORG_IDS.TECH_STARTUP,
        type: MESSAGE_TYPE.HUDDLE_STARTED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.STARTUP_DAILY,
          hostName: 'Đinh Thị Mai',
          title: 'Daily Sync',
        }),
        createdAt: daysAgo(1),
      },
      {
        roomId: ROOM_IDS.STARTUP_MVP,
        userId: USER_IDS.STARTUP_CTO,
        orgId: ORG_IDS.TECH_STARTUP,
        type: MESSAGE_TYPE.HUDDLE_ENDED,
        content: '',
        metadata: JSON.stringify({
          meetingId: MEETING_IDS.STARTUP_DAILY,
          duration: 900,
          participants: 4,
        }),
        createdAt: hoursAgo(22),
      },
    ];

    for (const msg of huddleMessages) {
      await chatClient.query(
        `INSERT INTO messages (
          id, room_id, user_id, org_id, content, type, metadata, format, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          newId(),
          msg.roomId,
          msg.userId,
          msg.orgId,
          msg.content,
          msg.type,
          msg.metadata,
          'plain',
          msg.createdAt,
        ]
      );
    }

    console.log(`  ✅ Created ${huddleMessages.length} huddle messages`);

    // Add file attachment messages (sharing meeting recording)
    const fileMessages = [
      {
        roomId: ROOM_IDS.ACME_ECOM_PROJECT,
        userId: USER_IDS.ACME_PM_1,
        orgId: ORG_IDS.ACME,
        content: 'Here\'s the recording from our Sprint 4 planning meeting. Please review the action items discussed.',
        type: MESSAGE_TYPE.FILE,
        fileName: 'sprint-4-planning.mp4',
        fileSize: getVideoFileSize(),
        mimeType: 'video/mp4',
        createdAt: daysAgo(6),
      },
      {
        roomId: ROOM_IDS.ACME_ENGINEERING,
        userId: USER_IDS.ACME_DEV_1,
        orgId: ORG_IDS.ACME,
        content: 'Retro recording for anyone who missed it. We had good discussions about process improvements.',
        type: MESSAGE_TYPE.FILE,
        fileName: 'retro-sprint-3.mp4',
        fileSize: getVideoFileSize(),
        mimeType: 'video/mp4',
        createdAt: daysAgo(2),
      },
    ];

    for (const msg of fileMessages) {
      const messageId = newId();

      await chatClient.query(
        `INSERT INTO messages (
          id, room_id, user_id, org_id, content, type, format, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          messageId,
          msg.roomId,
          msg.userId,
          msg.orgId,
          msg.content,
          msg.type,
          'plain',
          msg.createdAt,
        ]
      );

      // Add attachment
      await chatClient.query(
        `INSERT INTO message_attachments (
          id, message_id, file_id, file_name, file_size, mime_type, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          newId(),
          messageId,
          FILE_IDS.MEETING_VIDEO_1,
          msg.fileName,
          msg.fileSize,
          msg.mimeType,
          msg.createdAt,
        ]
      );
    }

    console.log(`  ✅ Created ${fileMessages.length} file messages with attachments`);

    await chatClient.query('COMMIT');
    console.log('✅ Seeded meetings and video messages successfully');
  } catch (error) {
    await chatClient.query('ROLLBACK');
    await meetingClient.query('ROLLBACK');
    console.error('❌ Error seeding meetings and videos:', error);
    throw error;
  } finally {
    chatClient.release();
    meetingClient.release();
    await chatPool.end();
    await meetingPool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seedChatWithVideo()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedChatWithVideo };
