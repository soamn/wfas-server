import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { Workflow } from "../../types/workflow.types.js";
import { AppError } from "../../errors/AppError.js";
import type { NODE } from "../../types/node.types.js";

export const WorkflowModel = {
  //create
  create: async (workflow: Workflow, userid: User["id"]) => {
    try {
      const nodes: NODE[] = workflow.nodes;

      const createdWorkflow = await prisma.workflow.create({
        data: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          state: workflow.state,
          user: {
            connect: {
              id: userid,
            },
          },
          nodes: {
            create: nodes.map((node) => ({
              id: node.id,
              type: node.type,
              label: node.label,
              position: node.position,
              result: node.result,
              error: node.error,
              index: node.index,
              config: node.config,
            })),
          },
        },
        select: { id: true },
      });
      prisma.connection.createMany({
        data: nodes.flatMap((node) =>
          node.connections.map((connection) => ({
            workflowId: workflow.id,
            sourceNodeId: connection.sourceNodeId,
            targetNodeId: connection.targetNodeId,
            sourceHandle: connection.sourceHandle
              ? connection.sourceHandle
              : null,
            targetHandle: connection.targetHandle
              ? connection.targetHandle
              : null,
          })),
        ),
      });
      return createdWorkflow.id;
    } catch (error: any) {
      throw new AppError("internal server error", 500, "INTERNAL_SERVER_ERROR");
    }
  },
  //update
  update: async (workflow: Workflow) => {
    const { nodes, id, name, description, state } = workflow;

    return prisma.$transaction(async (tx) => {
      await tx.workflow.update({
        where: { id },
        data: { name, description, state },
      });

      await tx.connection.deleteMany({ where: { workflowId: id } });
      await tx.node.deleteMany({ where: { workflowId: id } });

      await tx.node.createMany({
        data: nodes.map((node) => ({
          id: node.id,
          workflowId: id,
          label: node.label,
          position: node.position,
          result: node.result,
          error: node.result,
          index: node.index,
          type: node.type,
          config: node.config,
        })),
      });

      await tx.connection.createMany({
        data: nodes.flatMap((node) =>
          node.connections.map((connection) => ({
            workflowId: workflow.id,
            sourceNodeId: connection.sourceNodeId,
            targetNodeId: connection.targetNodeId,
            sourceHandle: connection.sourceHandle
              ? connection.sourceHandle
              : null,
            targetHandle: connection.targetHandle
              ? connection.targetHandle
              : null,
          })),
        ),
      });

      const updatedWorkflow = await tx.workflow.findUnique({
        where: { id },
        include: {
          nodes: {
            omit: { workflowId: true },
            include: {
              outgoing: {
                select: {
                  targetNode: {
                    select: { index: true },
                  },
                },
              },
            },
          },
        },
      });
      if (!updatedWorkflow) {
        throw new AppError("workflow not Found", 404, "NOT_FOUND");
      }
      const formattedNodes = updatedWorkflow.nodes.map((node) => ({
        ...node,
        outgoing: node.outgoing.map((edge) => edge.targetNode.index),
      }));
      return {
        ...updatedWorkflow,
        nodes: formattedNodes,
      };
    });
  },
  //delete
  delete: async (id: Workflow["id"], userId: User["id"]) => {
    const deletedWorkflow = await prisma.workflow.delete({
      where: { id, userId },
      omit: { id: true, userId: true },
    });
    return deletedWorkflow;
  },
  //Toggle state
  changeState: async (
    id: Workflow["id"],
    state: Workflow["state"],
    userId: User["id"],
  ): Promise<void> => {
    await prisma.workflow.update({
      where: { id, userId },
      data: {
        state,
      },
    });
  },
  //get multiple
  getAll: async (userId: User["id"]) => {
    return await prisma.workflow.findMany({
      where: { userId },
      omit: { userId: true },
    });
  },
  //findByid gives workflow
  findById: async (id: Workflow["id"], userId: User["id"]) => {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId: userId },
      select: { id: true },
    });
    return workflow;
  },

  //get by id gives workflow with scalar indexes
  getById: async (id: Workflow["id"], userId: User["id"]) => {
    const workflow = await prisma.workflow.findFirst({
      where: { id, userId },
      omit: { userId: true, createdAt: true },
      include: {
        nodes: {
          omit: { workflowId: true },
          include: {
            outgoing: {
              include: {
                targetNode: {
                  select: { index: true },
                },
              },
            },
          },
        },
      },
    });
    if (!workflow) {
      throw new AppError("workflow not Found", 404, "NOT_FOUND");
    }
    const formatedNodes = workflow.nodes.map((node) => ({
      ...node,
      outgoing: node.outgoing.map((edge) => edge.targetNode.index),
      connections: node.outgoing,
    }));

    return {
      ...workflow,
      nodes: formatedNodes,
    };
  },
};
