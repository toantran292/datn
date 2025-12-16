/*
  Warnings:

  - You are about to alter the column `sequence_id` on the `issue` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `identifier` on the `project` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(5)`.
  - A unique constraint covering the columns `[project_id,sequence_id]` on the table `issue` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[org_id,identifier]` on the table `project` will be added. If there are existing duplicate values, this will fail.
  - Made the column `sequence_id` on table `issue` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "project_identifier_key";

-- AlterTable
ALTER TABLE "issue" ALTER COLUMN "sequence_id" SET NOT NULL,
ALTER COLUMN "sequence_id" SET DATA TYPE INTEGER,
ALTER COLUMN "created_by" DROP NOT NULL,
ALTER COLUMN "created_by" DROP DEFAULT;

-- AlterTable
ALTER TABLE "issue_status" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "description" TEXT,
ALTER COLUMN "identifier" SET DATA TYPE VARCHAR(5);

-- CreateIndex
CREATE UNIQUE INDEX "issue_project_id_sequence_id_key" ON "issue"("project_id", "sequence_id");

-- CreateIndex
CREATE INDEX "project_org_id_idx" ON "project"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_org_id_identifier_key" ON "project"("org_id", "identifier");

-- RenameIndex
ALTER INDEX "unique_project_status_order" RENAME TO "issue_status_project_id_order_key";
