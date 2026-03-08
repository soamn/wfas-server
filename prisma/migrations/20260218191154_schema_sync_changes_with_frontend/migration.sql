/*
  Warnings:

  - You are about to drop the column `name` on the `Node` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Connection" ADD COLUMN     "sourceHandle" TEXT,
ADD COLUMN     "targetHandle" TEXT;

-- AlterTable
ALTER TABLE "Node" DROP COLUMN "name",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "position" JSONB,
ADD COLUMN     "result" JSONB,
ADD COLUMN     "status" TEXT DEFAULT 'idle';
