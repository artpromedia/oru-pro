import { EventEmitter } from 'events';

import { logger } from '../utils/logger';

const bus = new EventEmitter();

export type EventPayload = Record<string, unknown>;

export const publishEvent = async (event: string, payload: EventPayload = {}): Promise<void> => {
  logger.info('Event published', { event, payload });
  bus.emit(event, payload);
};

export const subscribeEvent = (event: string, listener: (payload: EventPayload) => void) => {
  bus.on(event, listener);
  return () => bus.off(event, listener);
};
