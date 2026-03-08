import { prisma } from "../../lib/prisma.js";
import type { ExecutionLog, User } from "@prisma/client";

export const ExecutionModel = {
  getByWorkflowId: async (
    workflowId: string,
    email: User["email"],
  ): Promise<ExecutionLog[]> => {
    return prisma.executionLog.findMany({
      where: { workflowId, workflow: { user: { email } } },
      orderBy: { startedAt: "desc" },
    });
  },
  getById: async (id: number): Promise<ExecutionLog | null> => {
    return prisma.executionLog.findFirst({
      where: { id },
    });
  },

  getAll: async (email: User["email"]): Promise<ExecutionLog[]> => {
    return prisma.executionLog.findMany({
      where: { workflow: { user: { email } } },
      orderBy: { startedAt: "desc" },
      take: 20,
    });
  },

  deleteByWorkflowId: async (workflowId: string): Promise<void> => {
    await prisma.executionLog.deleteMany({
      where: { workflowId },
    });
  },

  deleteById: async (id: number, email: User["email"]): Promise<void> => {
    await prisma.executionLog.delete({
      where: { id, workflow: { user: { email } } },
    });
  },
};
