import { Router, type Request, type Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';

import { asyncHandler } from '../utils/asyncHandler';
import {
  AgentOrchestrator,
  type AgentFilters,
  type AgentCommand,
  type AgentTelemetry,
  buildAgentOverview,
} from '../services/agentOrchestrator';

const router = Router();
const orchestrator = new AgentOrchestrator();

const STATUS_VALUES = ['active', 'idle', 'error', 'maintenance', 'training', 'learning'];
const MODE_VALUES = ['autonomous', 'supervised', 'training'];
const COMMAND_VALUES: AgentCommand[] = ['start', 'pause', 'resume', 'reboot', 'calibrate'];

const ensureUserContext = (req: Request) => {
  if (!req.user) {
    throw new Error('Authentication context missing');
  }
  return req.user;
};

const handleValidation = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array() });
    return false;
  }
  return true;
};

router.get(
  '/',
  [
    query('status').optional().isString().isIn(STATUS_VALUES),
    query('type').optional().isString(),
    query('mode').optional().isString().isIn(MODE_VALUES),
    query('search').optional().isString().isLength({ min: 2 }),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    const filters: AgentFilters = {
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      mode: req.query.mode as string | undefined,
      search: req.query.search as string | undefined,
    };

    const result = await orchestrator.listAgents(user.organizationId, filters);
    res.json({ success: true, data: result.agents, metrics: result.metrics });
  }),
);

router.get(
  '/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const user = ensureUserContext(req);
    const overview = await buildAgentOverview(orchestrator, user.organizationId);
    res.json({ success: true, overview });
  }),
);

router.get(
  '/:id',
  param('id').isString(),
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);
    const record = await orchestrator.getAgent(user.organizationId, req.params.id);

    if (!record) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    res.json({ success: true, data: record });
  }),
);

router.get(
  '/:id/activity',
  param('id').isString(),
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);
    const activity = await orchestrator.getAgentActivity(req.params.id, user.organizationId, 25);
    res.json({ success: true, data: activity });
  }),
);

router.post(
  '/',
  [
    body('name').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('mode').isString().isIn(MODE_VALUES),
  body('status').optional().isString().isIn(STATUS_VALUES),
    body('configuration').optional().isObject(),
    body('permissions').optional(),
    body('metrics').optional().isObject(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    const payload = {
      name: req.body.name as string,
      type: req.body.type as string,
      mode: req.body.mode as string,
      status: (req.body.status as string | undefined) ?? 'active',
      configuration: req.body.configuration as Record<string, unknown> | undefined,
      permissions: req.body.permissions as Record<string, unknown> | undefined,
      metrics: req.body.metrics as AgentTelemetry | undefined,
    };

    const agent = await orchestrator.createAgent(user.organizationId, payload, user.id);
    res.status(201).json({ success: true, data: agent });
  }),
);

router.patch(
  '/:id',
  [
    param('id').isString(),
    body('name').optional().isString().trim().isLength({ min: 2 }),
    body('type').optional().isString(),
    body('mode').optional().isIn(MODE_VALUES),
  body('status').optional().isString().isIn(STATUS_VALUES),
    body('configuration').optional().isObject(),
    body('permissions').optional(),
    body('metrics').optional().isObject(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);

    try {
      const agent = await orchestrator.updateAgent(
        req.params.id,
        user.organizationId,
        {
          name: req.body.name,
          type: req.body.type,
          mode: req.body.mode,
          status: req.body.status,
          configuration: req.body.configuration,
          permissions: req.body.permissions,
          metrics: req.body.metrics as AgentTelemetry | undefined,
          lastAction: req.body.lastAction,
          lastActionTime: req.body.lastActionTime ? new Date(req.body.lastActionTime) : undefined,
        },
        user.id,
      );
      res.json({ success: true, data: agent });
    } catch (error) {
      res.status(404).json({ success: false, error: (error as Error).message });
    }
  }),
);

router.post(
  '/:id/commands',
  [
    param('id').isString(),
    body('command').isString().custom((value) => COMMAND_VALUES.includes(value as AgentCommand)),
    body('metadata').optional().isObject(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    if (!handleValidation(req, res)) return;
    const user = ensureUserContext(req);
    const command = req.body.command as AgentCommand;
    const metadata = req.body.metadata as Record<string, unknown> | undefined;

    try {
      const agent = await orchestrator.runCommand(req.params.id, user.organizationId, command, user.id, metadata);
      res.json({ success: true, data: agent });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }),
);

export default router;
