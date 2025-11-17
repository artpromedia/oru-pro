import { createLogger, format, transports } from 'winston';

const { combine, timestamp, colorize, printf, errors, splat } = format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}]: ${stack ?? message}${metaString}`;
});

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(errors({ stack: true }), splat(), timestamp(), logFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), errors({ stack: true }), splat(), timestamp(), logFormat),
    }),
  ],
});

export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
