/*
  Warnings:

  - You are about to drop the column `fromNodeId` on the `Connection` table. All the data in the column will be lost.
  - You are about to drop the column `toNodeId` on the `Connection` table. All the data in the column will be lost.
  - Added the required column `sourceNodeId` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetNodeId` to the `Connection` table without a default value. This is not possible if the table is not empty.
  - Made the column `workflowId` on table `Connection` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workflowId` on table `Node` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_fromNodeId_fkey";

-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_toNodeId_fkey";

-- AlterTable
ALTER TABLE "Connection" DROP COLUMN "fromNodeId",
DROP COLUMN "toNodeId",
ADD COLUMN     "sourceNodeId" TEXT NOT NULL,
ADD COLUMN     "targetNodeId" TEXT NOT NULL,
ALTER COLUMN "workflowId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Node" ALTER COLUMN "workflowId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
