/**
 * Sentry Error Tracking and Performance Monitoring Configuration
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';
const RELEASE_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

/**
 * Initialize Sentry for production error tracking
 */
export function initializeSentry() {
  // Only initialize in production or if DSN is configured
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `sproutcv@${RELEASE_VERSION}`,
    
    // Performance monitoring
    integrations: [
      new BrowserTracing({
        // Track navigation and routing
        tracingOrigins: ['localhost', 'sproutcv.com', /^\//],
        // Track user interactions
        trackFetch: true,
        trackXHR: true,
      }),
    ],

    // Set sample rates
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Filter what gets sent to Sentry
    beforeSend(event, hint) {
      // Don't send errors in development (unless you want to)
      if (ENVIRONMENT === 'development') {
        console.log('Sentry event (dev mode):', event);
        return null; // Don't send to Sentry in dev
      }

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore network errors that are user-caused
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('Network request failed')) {
          return null;
        }

        // Ignore quota exceeded errors (browser storage)
        if (error.name === 'QuotaExceededError') {
          return null;
        }
      }

      return event;
    },

    // Attach user context
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out sensitive data from breadcrumbs
      if (breadcrumb.category === 'console') {
        return null; // Don't log console messages
      }
      return breadcrumb;
    },

    // Performance thresholds
    profilesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0,
    
    // Error boundaries
    attachStacktrace: true,
    
    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Random plugins/extensions
      'atomicFindClose',
      // Network errors
      'NetworkError',
      'Network request failed',
      // ResizeObserver errors (benign)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  });

  // Set initial user context (will be updated on auth)
  Sentry.setUser({ id: 'anonymous' });

  console.log(`✅ Sentry initialized (${ENVIRONMENT})`);
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Add custom breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture custom error with context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: 'fatal' | 'error' | 'warning' | 'info';
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, any>
) {
  const transaction = Sentry.startTransaction({
    name,
    op,
    data,
  });

  return {
    transaction,
    finish: () => transaction.finish(),
    setStatus: (status: string) => transaction.setStatus(status),
    setData: (key: string, value: any) => transaction.setData(key, value),
  };
}

/**
 * Measure function performance
 */
export async function measurePerformance<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(name, operation);
  
  try {
    const result = await fn();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * React Error Boundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap components with Sentry error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: React.ReactElement;
    showDialog?: boolean;
  }
) {
  return (props: P) => (
    <Sentry.ErrorBoundary
      fallback={options?.fallback}
      showDialog={options?.showDialog}
    >
      <Component {...props} />
    </Sentry.ErrorBoundary>
  );
}
