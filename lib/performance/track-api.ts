/**
 * API Performance Tracking
 * 
 * Utility to track API route performance metrics.
 */

export interface ApiPerformanceMetrics {
  route: string;
  method: string;
  duration: number;
  status: number;
  timestamp: Date;
}

const metrics: ApiPerformanceMetrics[] = [];

/**
 * Track API route performance
 */
export async function trackApiPerformance(
  route: string,
  method: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const start = Date.now();
  let status = 500;
  
  try {
    const response = await handler();
    status = response.status;
    const duration = Date.now() - start;
    
    const metric: ApiPerformanceMetrics = {
      route,
      method,
      duration,
      status,
      timestamp: new Date(),
    };
    
    metrics.push(metric);
    
    // Log if slow (> 200ms)
    if (duration > 200) {
      console.warn(`[Performance] Slow API: ${method} ${route} took ${duration}ms`);
    } else {
      console.log(`[Performance] ${method} ${route}: ${duration}ms`);
    }
    
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[Performance] ${method} ${route}: ${duration}ms (ERROR)`, error);
    throw error;
  }
}

/**
 * Get performance metrics (for dashboard/admin)
 */
export function getPerformanceMetrics(): {
  recent: ApiPerformanceMetrics[];
  average: number;
  p95: number;
  p99: number;
} {
  const recent = metrics.slice(-100); // Last 100 requests
  const durations = recent.map(m => m.duration).sort((a, b) => a - b);
  
  return {
    recent,
    average: durations.reduce((a, b) => a + b, 0) / durations.length || 0,
    p95: durations[Math.floor(durations.length * 0.95)] || 0,
    p99: durations[Math.floor(durations.length * 0.99)] || 0,
  };
}

/**
 * Clear old metrics (keep last 1000)
 */
export function clearOldMetrics() {
  if (metrics.length > 1000) {
    metrics.splice(0, metrics.length - 1000);
  }
}

