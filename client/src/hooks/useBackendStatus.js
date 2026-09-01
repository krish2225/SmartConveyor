import { useState, useEffect } from 'react';

const BACKEND_URL = 'http://127.0.0.1:8000';

export function useBackendStatus(pollIntervalMs = 3500) {
  const [status, setStatus] = useState({
    isOnline: false,
    latencyMs: 0,
    version: null,
    statusText: 'Checking...',
    lastChecked: null
  });

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const startTime = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${BACKEND_URL}/health`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const latency = Math.round(performance.now() - startTime);

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStatus({
              isOnline: true,
              latencyMs: latency,
              version: data.version || '2.4.1',
              statusText: 'ONLINE',
              lastChecked: new Date()
            });
          }
        } else {
          if (isMounted) {
            setStatus({
              isOnline: false,
              latencyMs: 0,
              version: null,
              statusText: `HTTP ${res.status}`,
              lastChecked: new Date()
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setStatus({
            isOnline: false,
            latencyMs: 0,
            version: null,
            statusText: 'OFFLINE (Port 8000)',
            lastChecked: new Date()
          });
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, pollIntervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollIntervalMs]);

  return status;
}
