import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getReports,
  getReport,
  createReport,
  deleteReport as deleteReportApi,
  retryReport as retryReportApi,
  getReportStatus,
  exportReport as exportReportApi,
  type Report,
  type ReportSummary,
  type CreateReportRequest,
  type ReportStatus,
  type ExportFormat,
} from '@/lib/api';

interface UseReportsState {
  reports: ReportSummary[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

interface UseReportsReturn extends UseReportsState {
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  createNewReport: (data: CreateReportRequest) => Promise<Report | null>;
  deleteReport: (reportId: string) => Promise<boolean>;
  retryReport: (reportId: string) => Promise<Report | null>;
  exportReport: (reportId: string, format: ExportFormat) => Promise<void>;
}

export function useReports(initialPage: number = 0): UseReportsReturn {
  const [page, setPageState] = useState(initialPage);
  const [state, setState] = useState<UseReportsState>({
    reports: [],
    total: 0,
    page: 0,
    totalPages: 0,
    isLoading: true,
    error: null,
  });

  const fetchReports = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await getReports(page, 20);

      setState({
        reports: response.items || [],
        total: response.total || 0,
        page: response.page || 0,
        totalPages: response.totalPages || 0,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch reports:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch reports',
      }));
    }
  }, [page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const createNewReport = useCallback(async (data: CreateReportRequest): Promise<Report | null> => {
    try {
      const report = await createReport(data);
      await fetchReports();
      return report;
    } catch (error: any) {
      console.error('Failed to create report:', error);
      throw error;
    }
  }, [fetchReports]);

  const deleteReportHandler = useCallback(async (reportId: string): Promise<boolean> => {
    try {
      await deleteReportApi(reportId);
      setState(prev => ({
        ...prev,
        reports: prev.reports.filter(r => r.id !== reportId),
        total: prev.total - 1,
      }));
      return true;
    } catch (error: any) {
      console.error('Failed to delete report:', error);
      return false;
    }
  }, []);

  const retryReportHandler = useCallback(async (reportId: string): Promise<Report | null> => {
    try {
      const report = await retryReportApi(reportId);
      await fetchReports();
      return report;
    } catch (error: any) {
      console.error('Failed to retry report:', error);
      return null;
    }
  }, [fetchReports]);

  const exportReportHandler = useCallback(async (reportId: string, format: ExportFormat): Promise<void> => {
    try {
      const blob = await exportReportApi(reportId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to export report:', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    refetch: fetchReports,
    setPage,
    createNewReport,
    deleteReport: deleteReportHandler,
    retryReport: retryReportHandler,
    exportReport: exportReportHandler,
  };
}

// Hook for single report with status polling
interface UseReportDetailReturn {
  report: Report | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useReportDetail(reportId: string | null): UseReportDetailReturn {
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchReport = useCallback(async () => {
    if (!reportId) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getReport(reportId);
      setReport(data);

      // Start polling if report is still processing
      if (data.status === 'PENDING' || data.status === 'PROCESSING') {
        startPolling(reportId);
      } else {
        stopPolling();
      }
    } catch (err: any) {
      console.error('Failed to fetch report:', err);
      setError(err.message || 'Failed to fetch report');
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  const startPolling = useCallback((id: string) => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const status = await getReportStatus(id);
        if (status.status === 'COMPLETED' || status.status === 'FAILED') {
          stopPolling();
          // Fetch full report data
          const data = await getReport(id);
          setReport(data);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchReport();
    return () => stopPolling();
  }, [fetchReport, stopPolling]);

  return {
    report,
    isLoading,
    error,
    refetch: fetchReport,
  };
}
