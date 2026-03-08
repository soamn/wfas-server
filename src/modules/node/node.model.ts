import { prisma } from "../../lib/prisma.js";
import type { NODE, NODELITE } from "../../types/node.types.js";
import type { Workflow } from "../../types/workflow.types.js";

export const NodeModel = {
  findById: async (id: NODE["id"]) => {
    const node = await prisma.node.findFirst({
      where: { id },
    });
    return node;
  },
  findmany: async (nodeIds: string[]) => {
    return await prisma.node.findMany({
      where: {
        id: { in: nodeIds },
      },
      select: { id: true },
    });
  },
  update: async (node: NODELITE) => {
    return await prisma.node.update({
      where: { id: node.id },
      data: node,
      omit: { workflowId: true },
    });
  },
  delete: async (id: NODE["id"]) => {
    return await prisma.node.delete({
      where: { id: id },
      omit: { workflowId: true },
    });
  },
};
