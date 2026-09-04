import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const STOCK_QUERY_KEYS = ["stocks", "movements", "dashboard", "receipts", "inventories"] as const;

export function useStockWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let closed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      socket = new WebSocket("ws://localhost:3001/ws");

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string) as { type?: string };
          if (message.type === "STOCK_UPDATED") {
            for (const key of STOCK_QUERY_KEYS) {
              queryClient.invalidateQueries({ queryKey: [key] });
            }
          }
        } catch {
          // message non JSON : on ignore
        }
      };

      socket.onclose = () => {
        if (closed) return;
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [queryClient]);
}
