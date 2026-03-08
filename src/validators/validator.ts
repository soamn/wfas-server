import z from "zod";
import { AppError } from "../errors/AppError.js";
import type { NODE } from "../types/node.types.js";

export const checkSession = (user: any) => {
  if (!user) {
    throw new AppError("Session expired", 200, "SESSION_EXPIRED");
  }
  return { user };
};

export const ValidateBody = <T>(schema: z.Schema<T>, body: any): T => {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const message = JSON.parse(parsed.error.message)[0].message;
    throw new AppError(message, 400, "BAD_REQUEST");
  }

  return parsed.data;
};

export const CheckNodeBounds = (nodes: NODE[]) => {
  const nodeCount = nodes.length;

  for (const node of nodes) {
    for (const targetIndex of node.outgoing) {
      if (targetIndex < 0 || targetIndex >= nodeCount) {
        throw new AppError(
          `Node "${node.label}" points to index ${targetIndex}, which is out of bounds.`,
          400,
          "INVALID_DATA",
        );
      }
    }
  }
};

const dfsCheck = (
  nodeIndex: number,
  nodes: NODE[],
  vis: number[],
  pathVis: number[],
): boolean => {
  vis[nodeIndex] = 1;
  pathVis[nodeIndex] = 1;

  const nodeAtIndex = nodes[nodeIndex];

  for (const nextIndex of nodeAtIndex!.outgoing) {
    if (!vis[nextIndex]) {
      if (dfsCheck(nextIndex, nodes, vis, pathVis)) {
        return true;
      }
    } else if (pathVis[nextIndex]) {
      return true;
    }
  }
  pathVis[nodeIndex] = 0;
  return false;
};

export const Dag = (nodes: NODE[]): boolean => {
  const n = nodes.length;
  const vis = Array(n).fill(0);
  const pathVis = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    if (!vis[i]) {
      if (dfsCheck(i, nodes, vis, pathVis)) {
        return false;
      }
    }
  }

  return true;
};
