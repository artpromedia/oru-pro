import { Prisma, type Agent } from '../lib/prisma';

import { prisma } from '../lib/prisma';
import { publishEvent } from './eventBus';

export type AgentCommand = 'start' | 'pause' | 'resume' | 'reboot' | 'calibrate';

export type AgentSummary = Omit<Agent, 'metrics'> & {
  metrics: AgentTelemetry;
};

export type AgentTelemetry = {
  confidence?: number;
  tasksCompleted?: number;
  tasksToday?: number;
  errorRate?: number;
  currentLoad?: number;
  monthlySavings?: number;
  uptime?: number;
  [key: string]: unknown;
};

export interface AgentFilters {
  status?: string;
  type?: string;
  mode?: string;
  search?: string;
}

export interface AgentListResult {
  agents: AgentSummary[];
  metrics: {
    total: number;
    byStatus: Record<string, number>;
    byMode: Record<string, number>;
    byType: Record<string, number>;
    averageConfidence: number;
    activeLoad: number;
  };
}

const DEFAULT_METRICS: AgentTelemetry = {
  confidence: 90,
  tasksCompleted: 0,
  tasksToday: 0,
  errorRate: 0,
  currentLoad: 0,
};

const parseJson = <T>(value: Prisma.JsonValue | null | undefined): T | undefined => {
  if (!value) return undefined;
  if (typeof value === 'object') {
    return value as T;
  }
  return undefined;
};

export interface AgentCreateParams {
  name: string;
  type: string;
  mode: string;
  status?: Agent['status'];
  configuration?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  metrics?: AgentTelemetry;
}

export interface AgentUpdateParams {
  name?: string;
  type?: string;
  mode?: string;
  status?: Agent['status'];
  configuration?: Record<string, unknown>;
  permissions?: Record<string, unknown>;
  metrics?: AgentTelemetry;
  lastAction?: string;
  lastActionTime?: Date;
}

export class AgentOrchestrator {
  async listAgents(organizationId: string, filters: AgentFilters = {}): Promise<AgentListResult> {
    const where: Prisma.AgentWhereInput = { organizationId };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.mode) where.mode = filters.mode;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { type: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const agents = await prisma.agent.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { name: 'asc' },
      ],
    });

    const summaries = agents.map((agent) => this.enrichAgent(agent));
    const byStatus = groupBy(summaries, 'status');
    const byMode = groupBy(summaries, 'mode');
    const byType = groupBy(summaries, 'type');

    const confidenceValues = summaries.map((agent) => agent.metrics.confidence ?? DEFAULT_METRICS.confidence!);
    const averageConfidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : DEFAULT_METRICS.confidence!;

    const activeLoad = summaries
      .filter((agent) => agent.status === 'active')
      .reduce((sum, agent) => sum + (agent.metrics.currentLoad ?? 0), 0);

    return {
      agents: summaries,
      metrics: {
        total: summaries.length,
        byStatus,
        byMode,
        byType,
        averageConfidence: Number(averageConfidence.toFixed(1)),
        activeLoad,
      },
    };
  }

  async getAgent(organizationId: string, agentId: string) {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, organizationId },
    });

    if (!agent) {
      return null;
    }

    const recentActivity = await prisma.agentActivity.findMany({
      where: { agentId: agent.id },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    return {
      agent: this.enrichAgent(agent),
      activity: recentActivity,
    };
  }

  async getRecentActivity(organizationId: string, limit = 20) {
    return prisma.agentActivity.findMany({
      where: {
        agent: {
          organizationId,
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            type: true,
            mode: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getAgentActivity(agentId: string, organizationId: string, limit = 20) {
    return prisma.agentActivity.findMany({
      where: {
        agentId,
        agent: { organizationId },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async createAgent(organizationId: string, payload: AgentCreateParams, actorId: string) {
    const created = await prisma.agent.create({
      data: {
        name: payload.name,
        type: payload.type,
        mode: payload.mode,
        status: payload.status ?? 'active',
        organization: { connect: { id: organizationId } },
        configuration: payload.configuration ? (payload.configuration as Prisma.InputJsonValue) : Prisma.JsonNull,
        permissions: payload.permissions ? (payload.permissions as Prisma.InputJsonValue) : Prisma.JsonNull,
        metrics: payload.metrics ? (payload.metrics as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    await this.recordActivity(created.id, actorId, 'create', {
      message: 'Agent created',
    });

    await publishEvent('agent.created', {
      agentId: created.id,
      organizationId,
      type: created.type,
    });

    return this.enrichAgent(created);
  }

  async updateAgent(agentId: string, organizationId: string, data: AgentUpdateParams, actorId: string) {
    const prismaData: Prisma.AgentUpdateInput = {};

    if (data.name !== undefined) prismaData.name = data.name;
    if (data.type !== undefined) prismaData.type = data.type;
    if (data.mode !== undefined) prismaData.mode = data.mode;
    if (data.status !== undefined) prismaData.status = data.status;
    if (data.lastAction !== undefined) prismaData.lastAction = data.lastAction;
    if (data.lastActionTime !== undefined) prismaData.lastActionTime = data.lastActionTime;
    if (data.configuration !== undefined) {
      prismaData.configuration = data.configuration as Prisma.InputJsonValue;
    }
    if (data.permissions !== undefined) {
      prismaData.permissions = data.permissions as Prisma.InputJsonValue;
    }
    if (data.metrics !== undefined) {
      prismaData.metrics = data.metrics as Prisma.InputJsonValue;
    }

    const updated = await prisma.agent.update({
      where: { id: agentId, organizationId },
      data: prismaData,
    });

    await this.recordActivity(agentId, actorId, 'update', {
      message: 'Agent configuration updated',
      data,
    });

    await publishEvent('agent.updated', {
      agentId,
      organizationId,
      status: updated.status,
    });

    return this.enrichAgent(updated);
  }

  async runCommand(agentId: string, organizationId: string, command: AgentCommand, actorId: string, metadata?: Record<string, unknown>) {
    const nextStatus = this.mapCommandToStatus(command);

    const updated = await prisma.agent.update({
      where: { id: agentId, organizationId },
      data: {
        status: nextStatus,
        lastAction: `${command} issued`,
        lastActionTime: new Date(),
      },
    });

    await this.recordActivity(agentId, actorId, command, metadata);

    await publishEvent('agent.command', {
      agentId,
      command,
      organizationId,
      status: updated.status,
    });

    return this.enrichAgent(updated);
  }

  async recordActivity(agentId: string, actorId: string, action: string, details?: Record<string, unknown>) {
    const payload: Record<string, unknown> = {
      actorId,
      ...(details ?? {}),
    };

    const telemetry = details as AgentTelemetry | undefined;
    const confidence = typeof telemetry?.confidence === 'number' ? telemetry.confidence : 0;
    const result = typeof telemetry?.result === 'string' ? telemetry.result : undefined;

    await prisma.agentActivity.create({
      data: {
        agentId,
        action,
        details: payload as Prisma.InputJsonValue,
        confidence,
        result,
      },
    });
  }

  private enrichAgent(agent: Agent): AgentSummary {
    const { metrics: rawMetrics, ...rest } = agent;
    const metrics = parseJson<AgentTelemetry>(rawMetrics) ?? DEFAULT_METRICS;

    return {
      ...rest,
      metrics,
    };
  }

  private mapCommandToStatus(command: AgentCommand): Agent['status'] {
    switch (command) {
      case 'start':
      case 'resume':
        return 'active';
      case 'pause':
        return 'idle';
      case 'reboot':
        return 'maintenance';
      case 'calibrate':
        return 'training';
      default:
        return 'idle';
    }
  }
}

export type AgentOverview = {
  metrics: AgentListResult['metrics'] & {
    autonomousDecisions: number;
    supervisedDecisions: number;
    monthlySavings: number;
  };
  activity: Awaited<ReturnType<AgentOrchestrator['getRecentActivity']>>;
};

export async function buildAgentOverview(orchestrator: AgentOrchestrator, organizationId: string): Promise<AgentOverview> {
  const [list, activity] = await Promise.all([
    orchestrator.listAgents(organizationId),
    orchestrator.getRecentActivity(organizationId, 25),
  ]);

  const autonomousDecisions = activity.filter((entry) => entry.agent?.mode === 'autonomous').length;
  const supervisedDecisions = activity.filter((entry) => entry.agent?.mode !== 'autonomous').length;
  const monthlySavings = list.agents.reduce((sum, agent) => sum + (agent.metrics.monthlySavings ?? 0), 0);

  return {
    metrics: {
      ...list.metrics,
      autonomousDecisions,
      supervisedDecisions,
      monthlySavings,
    },
    activity,
  };
}

const groupBy = (agents: AgentSummary[], key: keyof AgentSummary) =>
  agents.reduce<Record<string, number>>((acc, agent) => {
    const value = String(agent[key] ?? 'unknown');
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
