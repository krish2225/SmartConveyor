import { useState, useEffect } from 'react';

const MERN_BACKEND_URL = '/api/health';
const ML_MICROSERVICE_URL = 'http://127.0.0.1:8000/health';

export function useBackendStatus(pollIntervalMs = 3500) {
  const [status, setStatus] = useState({
    isOnline: false,
    latencyMs: 0,
    version: null,
    statusText: 'Checking...',
    dbConnected: false,
    dbName: 'smartconveyor',
    mlOnline: false,
    lastChecked: null
  });

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const startTime = performance.now();
      let mernOk = false;
      let mlOk = false;
      let dbConnected = false;
      let dbName = 'smartconveyor';
      let version = '2.0.0';

      // 1. Check MERN Express + MongoDB Backend (Port 5000)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(MERN_BACKEND_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          mernOk = true;
          dbConnected = data.database?.connected || false;
          dbName = data.database?.name || 'smartconveyor';
          version = data.version || '2.0.0';
        }
      } catch {
        mernOk = false;
      }

      // 2. Check Optional Python ML Microservice (Port 8000)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(ML_MICROSERVICE_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) mlOk = true;
      } catch {
        mlOk = false;
      }

      const latency = Math.round(performance.now() - startTime);

      if (isMounted) {
        setStatus({
          isOnline: mernOk,
          latencyMs: latency,
          version,
          statusText: mernOk ? (dbConnected ? 'MERN + MONGO ONLINE' : 'MERN ONLINE') : 'BACKEND OFFLINE',
          dbConnected,
          dbName,
          mlOnline: mlOk,
          lastChecked: new Date()
        });
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
