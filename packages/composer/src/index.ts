import { randomUUID } from "node:crypto";
import { z } from "zod";

export const StageSchema = z.object({
  id: z.string(),
  type: z.enum(["http", "queue", "agent", "webhook"]),
  config: z.record(z.any())
});

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().default(1),
  stages: z.array(StageSchema)
});

export type Workflow = z.infer<typeof WorkflowSchema>;

export class WorkflowComposer {
  private definition: Workflow;

  constructor(definition?: Partial<Workflow>) {
    this.definition = WorkflowSchema.parse({
  id: definition?.id ?? randomUUID(),
      name: definition?.name ?? "untitled",
      version: definition?.version ?? 1,
      stages: definition?.stages ?? []
    });
  }

  addStage(stage: z.infer<typeof StageSchema>) {
    this.definition = {
      ...this.definition,
      stages: [...this.definition.stages, StageSchema.parse(stage)]
    };
    return this;
  }

  build() {
    return this.definition;
  }
}
