import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1734256800000 implements MigrationInterface {
  name = 'InitialSchema1734256800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create rooms table
    await queryRunner.query(`
      CREATE TABLE "rooms" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "org_id" uuid NOT NULL,
        "type" varchar(20) NOT NULL DEFAULT 'channel',
        "name" varchar(255),
        "description" text,
        "is_private" boolean NOT NULL DEFAULT false,
        "avatar_url" varchar(500),
        "project_id" uuid,
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "archived_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rooms" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for rooms
    await queryRunner.query(`CREATE INDEX "IDX_rooms_org_id" ON "rooms" ("org_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_rooms_org_project" ON "rooms" ("org_id", "project_id")`);

    // Create room_members table
    await queryRunner.query(`
      CREATE TABLE "room_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "org_id" uuid NOT NULL,
        "role" varchar(20) NOT NULL DEFAULT 'MEMBER',
        "last_seen_message_id" uuid,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_room_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_room_members_room_user" UNIQUE ("room_id", "user_id")
      )
    `);

    // Create indexes for room_members
    await queryRunner.query(`CREATE INDEX "IDX_room_members_user_org" ON "room_members" ("user_id", "org_id")`);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "org_id" uuid NOT NULL,
        "thread_id" uuid,
        "content" text NOT NULL,
        "type" varchar(20) NOT NULL DEFAULT 'text',
        "format" varchar(20) NOT NULL DEFAULT 'plain',
        "edited_at" TIMESTAMP,
        "deleted_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for messages
    await queryRunner.query(`CREATE INDEX "IDX_messages_room_created" ON "messages" ("room_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_thread" ON "messages" ("thread_id")`);

    // Create message_reactions table
    await queryRunner.query(`
      CREATE TABLE "message_reactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "message_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "emoji" varchar(50) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_message_reactions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_message_reactions_msg_user_emoji" UNIQUE ("message_id", "user_id", "emoji")
      )
    `);

    // Create pinned_messages table
    await queryRunner.query(`
      CREATE TABLE "pinned_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "message_id" uuid NOT NULL,
        "pinned_by" uuid NOT NULL,
        "pinned_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pinned_messages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pinned_messages_room_message" UNIQUE ("room_id", "message_id")
      )
    `);

    // Create channel_notification_settings table
    await queryRunner.query(`
      CREATE TABLE "channel_notification_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "room_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "muted" boolean NOT NULL DEFAULT false,
        "muted_until" TIMESTAMP,
        "notification_level" varchar(20) NOT NULL DEFAULT 'all',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_channel_notification_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_channel_notification_settings_room_user" UNIQUE ("room_id", "user_id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "room_members"
      ADD CONSTRAINT "FK_room_members_room"
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_room"
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages"
      ADD CONSTRAINT "FK_messages_thread"
      FOREIGN KEY ("thread_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "message_reactions"
      ADD CONSTRAINT "FK_message_reactions_message"
      FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "pinned_messages"
      ADD CONSTRAINT "FK_pinned_messages_room"
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "pinned_messages"
      ADD CONSTRAINT "FK_pinned_messages_message"
      FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "channel_notification_settings"
      ADD CONSTRAINT "FK_channel_notification_settings_room"
      FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.query(`ALTER TABLE "channel_notification_settings" DROP CONSTRAINT "FK_channel_notification_settings_room"`);
    await queryRunner.query(`ALTER TABLE "pinned_messages" DROP CONSTRAINT "FK_pinned_messages_message"`);
    await queryRunner.query(`ALTER TABLE "pinned_messages" DROP CONSTRAINT "FK_pinned_messages_room"`);
    await queryRunner.query(`ALTER TABLE "message_reactions" DROP CONSTRAINT "FK_message_reactions_message"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_thread"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_room"`);
    await queryRunner.query(`ALTER TABLE "room_members" DROP CONSTRAINT "FK_room_members_room"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "channel_notification_settings"`);
    await queryRunner.query(`DROP TABLE "pinned_messages"`);
    await queryRunner.query(`DROP TABLE "message_reactions"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "room_members"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
  }
}
