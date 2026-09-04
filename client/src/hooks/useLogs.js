import { useState, useEffect, useCallback } from 'react';
import { getLogsApi, getLogStatsApi, createLogApi, clearLogsApi } from '../services/api.js';

export function useLogs(facilityId = 'nmdc-kirandul-cv101', initialFilters = {}, autoRefreshSeconds = 5) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    levels: { INFO: 0, WARN: 0, ERROR: 0, CRITICAL: 0 },
    categories: { SYSTEM: 0, SENSOR: 0, ANOMALY: 0, VISION: 0, ALERT: 0, EMERGENCY: 0, AUDIT: 0, MAINTENANCE: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 50 });

  const [filters, setFilters] = useState({
    level: 'ALL',
    category: 'ALL',
    jointId: 'ALL',
    search: '',
    page: 1,
    limit: 50,
    ...initialFilters
  });

  const fetchLogs = useCallback(async () => {
    try {
      const queryParams = {
        facilityId,
        page: filters.page,
        limit: filters.limit
      };

      if (filters.level && filters.level !== 'ALL') queryParams.level = filters.level;
      if (filters.category && filters.category !== 'ALL') queryParams.category = filters.category;
      if (filters.jointId && filters.jointId !== 'ALL') queryParams.jointId = filters.jointId;
      if (filters.search) queryParams.search = filters.search;
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;

      const [logsRes, statsRes] = await Promise.all([
        getLogsApi(queryParams),
        getLogStatsApi(facilityId)
      ]);

      if (logsRes.success) {
        setLogs(logsRes.logs || []);
        if (logsRes.pagination) setPagination(logsRes.pagination);
      }

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }

      setError(null);
    } catch (err) {
      console.warn('[useLogs Hook] Failed to fetch MongoDB logs:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [facilityId, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Optional auto-refresh interval
  useEffect(() => {
    if (!autoRefreshSeconds || autoRefreshSeconds <= 0) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, autoRefreshSeconds * 1000);
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefreshSeconds]);

  const insertLog = async (logData) => {
    try {
      const res = await createLogApi({ facilityId, ...logData });
      if (res.success && res.log) {
        setLogs(prev => [res.log, ...prev]);
        fetchLogs();
      }
      return res;
    } catch (err) {
      console.error('Failed to create log entry:', err);
      throw err;
    }
  };

  const purgeLogs = async (olderThanDays) => {
    try {
      await clearLogsApi({ facilityId, olderThanDays });
      fetchLogs();
    } catch (err) {
      console.error('Failed to clear logs:', err);
      throw err;
    }
  };

  return {
    logs,
    stats,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    refetch: fetchLogs,
    insertLog,
    purgeLogs
  };
}
