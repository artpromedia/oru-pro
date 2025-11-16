import { Redis as RedisClient } from "ioredis";
import { env } from "../env.js";

const client = new RedisClient(env.REDIS_URL, {
  lazyConnect: false,
  maxRetriesPerRequest: 3
});

client.on("error", (error: unknown) => {
  if (process.env.NODE_ENV !== "test") {
    console.error("Redis error", error);
  }
});

export const redis = client;
