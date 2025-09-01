import { supabase } from '@/integrations/supabase/client';
import { ErrorContext } from '@/types/analysis';

export class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private isProcessing = false;

  static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }

  static async logError(error: Error, context: ErrorContext): Promise<void> {
    const monitor = ErrorMonitoring.getInstance();
    await monitor.logErrorInternal(error, context);
  }

  private async logErrorInternal(error: Error, context: ErrorContext): Promise<void> {
    // Add to queue for batch processing
    this.errorQueue.push({ error, context });

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processErrorQueue();
    }

    // Also log to console for immediate debugging
    console.error('Error logged:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context
    });
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const batch = this.errorQueue.splice(0, 10); // Process up to 10 errors at once
      
      await Promise.all(batch.map(({ error, context }) => 
        this.saveErrorToDatabase(error, context)
      ));

      // If there are more errors, continue processing
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processErrorQueue(), 1000);
      }

    } catch (processingError) {
      console.error('Error processing error queue:', processingError);
    } finally {
      this.isProcessing = false;
    }
  }

  private async saveErrorToDatabase(error: Error, context: ErrorContext): Promise<void> {
    try {
      const { error: dbError } = await supabase
        .from('security_events')
        .insert({
          event_type: 'application_error',
          user_id: context.userId || null,
          metadata: {
            error_type: error.name,
            error_message: error.message,
            error_stack: error.stack || '',
            context: {
              timestamp: context.timestamp || new Date().toISOString(),
              url: typeof window !== 'undefined' ? window.location.href : '',
              userAgent: context.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')
            }
          } as any,
          severity: this.determineSeverity(error)
        });

      if (dbError) {
        console.error('Failed to save error to database:', dbError);
        // Fallback to local storage for critical errors
        this.saveToLocalStorage({ error, context });
      }

    } catch (saveError) {
      console.error('Error saving to database:', saveError);
      // Fallback to local storage
      this.saveToLocalStorage({ error, context });
    }
  }

  private determineSeverity(error: Error): string {
    switch (error.name) {
      case 'AIAnalysisError':
        return 'critical';
      case 'ProcessingError':
        return 'critical';
      case 'QuotaExceededError':
        return 'warning';
      case 'RateLimitError':
        return 'info';
      case 'UnsupportedFileTypeError':
        return 'info';
      case 'DocumentProcessingError':
        return 'warning';
      default:
        if (error.message.includes('network') || error.message.includes('fetch')) {
          return 'warning';
        }
        return 'critical';
    }
  }

  private saveToLocalStorage(errorData: any): void {
    try {
      const existingErrors = JSON.parse(
        localStorage.getItem('resume_analyzer_errors') || '[]'
      );
      
      existingErrors.push({
        ...errorData,
        timestamp: new Date().toISOString()
      });

      // Keep only the most recent 50 errors
      const recentErrors = existingErrors.slice(-50);
      
      localStorage.setItem(
        'resume_analyzer_errors', 
        JSON.stringify(recentErrors)
      );

    } catch (localStorageError) {
      console.error('Failed to save to localStorage:', localStorageError);
    }
  }

  // Public method to get error statistics using existing security_events table
  async getErrorStats(userId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: any[];
  }> {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'application_error')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: errors, error } = await query.limit(100);

      if (error) {
        throw error;
      }

      const stats = {
        total: errors?.length || 0,
        byType: {} as Record<string, number>,
        bySeverity: {} as Record<string, number>,
        recent: errors?.slice(0, 10) || []
      };

      errors?.forEach(err => {
        const errorType = (err.metadata as any)?.error_type || 'unknown';
        const severity = err.severity || 'unknown';
        
        stats.byType[errorType] = (stats.byType[errorType] || 0) + 1;
        stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
      });

      return stats;

    } catch (error) {
      console.error('Error fetching error stats:', error);
      return {
        total: 0,
        byType: {},
        bySeverity: {},
        recent: []
      };
    }
  }

  // Public method to clear old errors
  async clearOldErrors(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('security_events')
        .delete()
        .eq('event_type', 'application_error')
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Error clearing old errors:', error);
      }

    } catch (error) {
      console.error('Failed to clear old errors:', error);
    }
  }

  // Public method to export errors for analysis
  async exportErrors(userId?: string, startDate?: string, endDate?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'application_error')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: errors, error } = await query;

      if (error) {
        throw error;
      }

      return errors || [];

    } catch (error) {
      console.error('Error exporting errors:', error);
      return [];
    }
  }

  // Public method to get performance metrics
  getPerformanceMetrics(): {
    errorQueueSize: number;
    isProcessing: boolean;
    localStorageErrors: number;
  } {
    let localStorageErrorsCount = 0;
    
    try {
      const errors = JSON.parse(
        localStorage.getItem('resume_analyzer_errors') || '[]'
      );
      localStorageErrorsCount = errors.length;
    } catch {
      localStorageErrorsCount = 0;
    }

    return {
      errorQueueSize: this.errorQueue.length,
      isProcessing: this.isProcessing,
      localStorageErrors: localStorageErrorsCount
    };
  }

  // Public method to manually flush error queue
  async flushErrorQueue(): Promise<void> {
    if (!this.isProcessing) {
      await this.processErrorQueue();
    }
  }
}

// Global error handler setup
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    ErrorMonitoring.logError(event.error, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    ErrorMonitoring.logError(
      new Error(event.reason),
      {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
    );
  });
}
