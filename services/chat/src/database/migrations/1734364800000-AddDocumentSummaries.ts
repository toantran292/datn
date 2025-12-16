import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentSummaries1734364800000 implements MigrationInterface {
  name = 'AddDocumentSummaries1734364800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create document_summaries table for caching AI-generated summaries
    await queryRunner.query(`
      CREATE TABLE "document_summaries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "attachment_id" uuid NOT NULL,
        "room_id" uuid NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "mime_type" varchar(100) NOT NULL,
        "summary" text NOT NULL,
        "transcription" text,
        "generated_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_summaries" PRIMARY KEY ("id")
      )
    `);

    // Create unique index on attachment_id (one summary per attachment)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_document_summaries_attachment_id" ON "document_summaries" ("attachment_id")`);

    // Create index on room_id for querying summaries by room
    await queryRunner.query(`CREATE INDEX "IDX_document_summaries_room_id" ON "document_summaries" ("room_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_document_summaries_room_id"`);
    await queryRunner.query(`DROP INDEX "IDX_document_summaries_attachment_id"`);
    await queryRunner.query(`DROP TABLE "document_summaries"`);
  }
}
