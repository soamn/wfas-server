import z from "zod";
import { NodeType } from "@prisma/client";
import { ProviderEnum } from "./credential.schema.js";

export const SetConfigSchema = z.object({
  fields: z
    .array(
      z.object({
        key: z.string().min(1, "Key is required"),
        type: z.enum(["string", "number", "boolean"]),
        value: z.any().refine((val) => {
          if (typeof val === "string") {
            return val.trim().length > 0;
          }
          return val !== undefined && val !== null;
        }, "Value cannot be empty"),
      }),
    )
    .default([]),
});

export const TriggerConfigSchema = z.object({
  triggerType: z.enum(["manual", "schedule"]),
  cronExpression: z.string().optional(),
});

export const WebhookConfigSchema = z.object({
  provider: z.string().optional(),
  triggerMessage: z.string().optional(),
});

export const ActionConfigSchema = z.object({
  provider: z.enum(ProviderEnum),
  body: z.json().nullable(),
});

const templateRegex = /\{\{.*?\}\}/;
export const ManualApiConfigSchema = z.object({
  apiEndpoint: z.string().refine((value) => {
    if (templateRegex.test(value)) return true;
    return z.url().safeParse(value).success;
  }, "Must be valid URL or variable reference"),
  method: z.enum(["POST", "GET"]),
  retry: z.number().min(0).max(5).default(3),
  timeout: z.number().min(100).max(30000).default(5000),
  body: z.json().nullable(),
});

export const FilterConfigSchema = z
  .object({
    fieldName: z.string().min(1, "Target property is required"),
    operator: z.enum([
      "equals",
      "not_equals",
      "contains",
      "starts_with",
      "greater_than",
      "less_than",
      "exists",
    ]),
    valueType: z.enum(["text", "number", "boolean"]),
    compareValue: z.any(),
  })
  .superRefine((data, ctx) => {
    if (data.operator === "exists") return;
    if (data.valueType === "text") {
      if (
        typeof data.compareValue !== "string" ||
        data.compareValue.trim() === ""
      ) {
        ctx.addIssue("Text can not be empty");
      }
    } else if (data.valueType === "number") {
      if (typeof data.compareValue !== "number" || isNaN(data.compareValue)) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a valid number",
          path: ["compareValue"],
        });
      }
    } else if (data.valueType === "boolean") {
      if (data.compareValue !== true && data.compareValue !== false) {
        ctx.addIssue({
          code: "custom",
          message: "Must select true or false",
          path: ["compareValue"],
        });
      }
    }
  });

export const DelayConfigSchema = z
  .object({
    hours: z.number().min(0).max(1).default(0),
    minutes: z.number().min(0).max(59).default(0),
    seconds: z.number().min(0).max(59).default(0),
    milliseconds: z.number().min(0).max(1000).default(0),
  })
  .refine(
    (data) => {
      const totalMs =
        data.hours * 3600000 +
        data.minutes * 60000 +
        data.seconds * 1000 +
        data.milliseconds;
      const oneSecond = 1000;
      const oneHour = 3600000;

      return totalMs >= oneSecond && totalMs <= oneHour;
    },
    {
      message: "Delay must be between 1 second and 1 hour",
      path: ["seconds"],
    },
  );

export const ChatConfigSchema = z.object({
  model: z.string().min(1, "Model selection is required"),
  system: z.string().optional(),
  user: z.string().min(1, "User prompt is required"),
  temperature: z.number().min(0).max(2).default(0.7),
});

export const TransformConfigSchema = z.object({
  transforms: z
    .array(
      z.object({
        originalPath: z.string(),
        changedKey: z.string().min(1, "Key name is required"),
        changedValue: z.string(),
      }),
    )
    .default([]),
});

export const ExtractConfigSchema = z.object({
  extractedPaths: z.array(z.string()).default([]),
});

export const ConditionConfigSchema = z
  .object({
    fieldName: z.string().min(1, "Target property is required"),
    operator: z.enum([
      "equals",
      "not_equals",
      "contains",
      "starts_with",
      "greater_than",
      "less_than",
      "exists",
    ]),
    valueType: z.enum(["text", "number", "boolean"]),
    compareValue: z.any(),
    trueNodeId: z.string().min(1, "True path connection required"),
    falseNodeId: z.string().min(1, "False path connection required"),
  })
  .superRefine((data, ctx) => {
    if (data.operator === "exists") return;
    if (data.valueType === "text") {
      if (
        typeof data.compareValue !== "string" ||
        data.compareValue.trim() === ""
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Text cannot be empty",
          path: ["compareValue"],
        });
      }
    } else if (data.valueType === "number") {
      if (typeof data.compareValue !== "number" || isNaN(data.compareValue)) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a valid number",
          path: ["compareValue"],
        });
      }
    } else if (data.valueType === "boolean") {
      if (data.compareValue !== true && data.compareValue !== false) {
        ctx.addIssue({
          code: "custom",
          message: "Must select true or false",
          path: ["compareValue"],
        });
      }
    }
  });

export const SwitchCaseSchema = z
  .object({
    id: z.string(),
    operator: z.string().min(1, "Operator is required"),
    valueType: z.enum(["text", "number", "boolean"]),
    compareValue: z.any(),
    targetNodeId: z.string().min(1, "Connection required"),
  })
  .superRefine((data, ctx) => {
    const { valueType, compareValue, operator } = data;

    if (operator === "exists") return;

    if (valueType === "number") {
      if (typeof compareValue !== "number" || isNaN(compareValue)) {
        ctx.addIssue({
          code: "custom",
          message: "Must be a valid number",
          path: ["compareValue"],
        });
      }
    }

    if (valueType === "boolean") {
      if (typeof compareValue !== "boolean") {
        ctx.addIssue({
          code: "custom",
          message: "Must be true or false",
          path: ["compareValue"],
        });
      }
    }

    if (valueType === "text") {
      if (typeof compareValue !== "string" || compareValue.trim() === "") {
        ctx.addIssue({
          code: "custom",
          message: "Text value cannot be empty",
          path: ["compareValue"],
        });
      }
    }

    const numberOps = ["greater_than", "less_than"];
    const textOps = ["contains", "starts_with"];

    if (valueType === "number" && textOps.includes(operator)) {
      ctx.addIssue({
        code: "custom",
        message: "Operator not supported for numbers",
        path: ["operator"],
      });
    }

    if (
      valueType === "boolean" &&
      (numberOps.includes(operator) || textOps.includes(operator))
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Booleans only support Equals/Not Equals",
        path: ["operator"],
      });
    }
  });

export const SwitchConfigSchema = z
  .object({
    referencePath: z.string().min(1, "Variable selection required"),
    cases: z.array(SwitchCaseSchema).default([]),
    showDefault: z.boolean().default(true),
    defaultNodeId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    data.cases.forEach((c, index) => {
      if (!c.targetNodeId || c.targetNodeId === "") {
        ctx.addIssue({
          code: "custom",
          message: `Path ${index + 1} requires an edge connection`,
          path: ["cases", index, "targetNodeId"], // Points exactly to the handle
        });
      }
    });

    if (
      data.showDefault &&
      (!data.defaultNodeId || data.defaultNodeId === "")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Connect the 'Default' output",
        path: ["defaultNodeId"],
      });
    }
  });
export const LoopConfigSchema = z.object({
  loopOver: z.string().min(1, "Please select an array variable"),
  maxIterations: z
    .number()
    .positive()
    .min(1)
    .max(100, "Max iterations should be less than 100 "),
  iterateNodeId: z.string().min(1, "Iteration branch must be connected"),
  nextNodeId: z.string().min(1, "Completion path must be connected"),
});

export const FailConfigSchema = z.object({
  errorMessage: z.string().default("Workflow stopped at this step."),
});

export const BaseNodeSchema = {
  id: z.uuid(),
  label: z.string().nullable(),
  index: z.number(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),

  result: z.any().nullable().default(null),
  status: z.enum(["idle", "running", "success", "failed"]).default("idle"),
  error: z.string().nullable().default(null),
  outgoing: z.array(z.number().int().nonnegative()),
  connections: z.array(
    z.object({
      sourceNodeId: z.string(),
      targetNodeId: z.string(),
      sourceHandle: z.string().nullish(),
      targetHandle: z.string().nullish(),
    }),
  ),
};

export const nodeSchema = z.discriminatedUnion("type", [
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.ACTION),
    config: ActionConfigSchema,
  }),

  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.WEBHOOK),
    config: WebhookConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.TRIGGER),
    config: TriggerConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.SET),
    config: SetConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.MANUAL_API),
    config: ManualApiConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.FILTER),
    config: FilterConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.DELAY),
    config: DelayConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.CHAT),
    config: ChatConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.TRANSFORM),
    config: TransformConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.EXTRACT),
    config: ExtractConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.CONDITION),
    config: ConditionConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.LOOP),
    config: LoopConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.SWITCH),
    config: SwitchConfigSchema,
  }),
  z.object({
    ...BaseNodeSchema,
    type: z.literal(NodeType.FAIL),
    config: FailConfigSchema,
  }),
]);
export const nodeLiteSchema = z.discriminatedUnion(
  "type",
  nodeSchema.options.map((option) =>
    option.omit({ index: true, outgoing: true }),
  ) as any,
);

