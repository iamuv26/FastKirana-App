import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL } from '../lib/constants';

interface UseOrderStreamProps {
  orderId?: string;
  role?: 'USER' | 'PICKER' | 'CHEF' | 'DELIVERY' | 'ADMIN';
  onEvent?: (event: string, data: any) => void;
  enabled?: boolean;
}

export function useOrderStream({ orderId, role, onEvent, enabled = true }: UseOrderStreamProps = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);
  const { token, user } = useAuthStore();
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;

    let sseActive = false;
    let pollIntervalId: any = null;
    let abortController: AbortController | null = null;
    let reconnectTimeoutId: any = null;
    let attempt = 0;

    const startPolling = () => {
      if (pollIntervalId) return;
      setIsPollingActive(true);
      console.log(`[OrderStream] Starting smart polling fallback (orderId: ${orderId || 'all'}, role: ${role || 'user'})`);
      
      const poll = async () => {
        try {
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          if (user) {
            headers['x-user-id'] = user.id;
            headers['x-user-role'] = user.role;
          }

          const url = orderId 
            ? `${API_BASE_URL}/orders/${orderId}`
            : `${API_BASE_URL}/orders?all=true`;

          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            // Trigger status change event simulated locally
            if (onEventRef.current) {
              onEventRef.current('poll:update', data);
            }
          }
        } catch (e) {
          console.warn('[OrderStream] Poll attempt failed:', e);
        }
      };

      // Poll immediately and then on interval
      poll();
      pollIntervalId = setInterval(poll, orderId ? 4000 : 15000);
    };

    const stopPolling = () => {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }
      setIsPollingActive(false);
    };

    const connectSSE = async () => {
      // Clean up previous attempts
      if (abortController) abortController.abort();
      stopPolling();

      const { user } = useAuthStore.getState();
      if (!user) {
        startPolling();
        return;
      }

      try {
        abortController = new AbortController();
        const url = `${API_BASE_URL}/sse/orders?userId=${user.id}${orderId ? `&orderId=${orderId}` : ''}${role ? `&role=${role}` : ''}`;
        
        const headers: Record<string, string> = {
          'Accept': 'text/event-stream',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Attempt fetch-based stream connection
        const response = await fetch(url, {
          headers,
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`SSE request failed: ${response.status}`);
        }

        setIsConnected(true);
        sseActive = true;
        attempt = 0;

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Readable stream not supported');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (sseActive) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            if (cleanLine.startsWith('data:')) {
              try {
                const eventData = JSON.parse(cleanLine.substring(5).trim());
                if (onEventRef.current) {
                  onEventRef.current(eventData.event || 'message', eventData.payload);
                }
              } catch (e) {
                console.warn('[OrderStream] Failed parsing stream payload:', e);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        
        console.warn(`[OrderStream] SSE error:`, err.message || err);
        setIsConnected(false);
        sseActive = false;

        attempt++;
        if (attempt >= 3) {
          console.warn('[OrderStream] SSE failed 3 times, falling back permanently to polling');
          startPolling();
        } else {
          // Retry SSE with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          reconnectTimeoutId = setTimeout(connectSSE, delay);
        }
      }
    };

    // Start stream connection
    connectSSE();

    return () => {
      sseActive = false;
      if (abortController) abortController.abort();
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      stopPolling();
    };
  }, [orderId, role, enabled, token, user]);

  return {
    isConnected,
    isPollingActive,
  };
}
