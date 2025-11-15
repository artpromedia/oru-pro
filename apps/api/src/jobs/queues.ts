import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../env.js";

const connection = new Redis(env.REDIS_URL);

export const inventoryQueue = new Queue("inventory", { connection });
export const productionQueue = new Queue("production", { connection });
