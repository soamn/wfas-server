/*
  Warnings:

  - The primary key for the `Node` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Workflow` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `index` to the `Node` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_fromNodeId_fkey";

-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_toNodeId_fkey";

-- DropForeignKey
ALTER TABLE "Connection" DROP CONSTRAINT "Connection_workflowId_fkey";

-- DropForeignKey
ALTER TABLE "ExecutionLog" DROP CONSTRAINT "ExecutionLog_workflowId_fkey";

-- DropForeignKey
ALTER TABLE "Node" DROP CONSTRAINT "Node_workflowId_fkey";

-- AlterTable
ALTER TABLE "Connection" ALTER COLUMN "workflowId" DROP NOT NULL,
ALTER COLUMN "workflowId" SET DATA TYPE TEXT,
ALTER COLUMN "fromNodeId" SET DATA TYPE TEXT,
ALTER COLUMN "toNodeId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ExecutionLog" ALTER COLUMN "workflowId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Node" DROP CONSTRAINT "Node_pkey",
ADD COLUMN     "index" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "workflowId" DROP NOT NULL,
ALTER COLUMN "workflowId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Node_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Node_id_seq";

-- AlterTable
ALTER TABLE "Workflow" DROP CONSTRAINT "Workflow_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "isActive" SET DEFAULT true,
ADD CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Workflow_id_seq";

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
