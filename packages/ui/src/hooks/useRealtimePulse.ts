"use client";

import { useEffect, useState } from "react";

interface PulseOptions {
  ttl?: number;
}

export const useRealtimePulse = ({ ttl = 7_000 }: PulseOptions = {}) => {
  const [timestamp, setTimestamp] = useState<number>(Date.now());

  useEffect(() => {
    const id = setInterval(() => setTimestamp(Date.now()), ttl / 2);
    return () => clearInterval(id);
  }, [ttl]);

  return {
    timestamp,
    stale: Date.now() - timestamp > ttl
  };
};
