import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { AuthUser } from "./useAuth";

const resolveRealtimeUrl = () =>
  process.env.NEXT_PUBLIC_REALTIME_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:4000` : "http://localhost:4000");

export const useWebSocket = (user?: AuthUser | null) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return undefined;

    const socket = io(resolveRealtimeUrl(), {
      transports: ["websocket"],
      withCredentials: true,
      auth: {
        tenantId: user.tenantId,
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
      },
    });

    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, user?.tenantId, user?.name, user?.avatar]);

  return { socket: socketRef.current, connected };
};
