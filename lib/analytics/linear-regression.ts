/**
 * Linear Regression Utility
 * 
 * Calculates linear regression (best-fit line) for a series of data points.
 * Used for generating trendlines on the AttributeTimelineChart.
 * 
 * The regression line follows the equation: y = mx + b
 * where m is the slope and b is the y-intercept.
 */

export interface DataPoint {
  x: number;  // Period index (0, 1, 2, ...)
  y: number;  // Score value (1.0 - 5.0)
}

export interface LinearRegressionResult {
  slope: number;       // Rate of change per period
  intercept: number;   // Y value when x = 0
  getY: (x: number) => number;  // Helper to get Y at any X
  r2: number;          // R-squared (coefficient of determination)
}

/**
 * Calculate linear regression for a set of data points.
 * Uses the least squares method.
 * 
 * @param points Array of (x, y) data points
 * @returns Regression result with slope, intercept, and helper function
 */
export function calculateLinearRegression(points: DataPoint[]): LinearRegressionResult {
  const n = points.length;
  
  // Handle edge cases
  if (n === 0) {
    return {
      slope: 0,
      intercept: 0,
      getY: () => 0,
      r2: 0
    };
  }
  
  if (n === 1) {
    // Single point - horizontal line at that Y value
    const y = points[0].y;
    return {
      slope: 0,
      intercept: y,
      getY: () => y,
      r2: 1
    };
  }
  
  // Calculate sums for least squares
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
    sumY2 += point.y * point.y;
  }
  
  // Calculate slope (m) and intercept (b)
  // m = (n * Σxy - Σx * Σy) / (n * Σx² - (Σx)²)
  // b = (Σy - m * Σx) / n
  
  const denominator = n * sumX2 - sumX * sumX;
  
  // Avoid division by zero (all x values are the same)
  if (denominator === 0) {
    const avgY = sumY / n;
    return {
      slope: 0,
      intercept: avgY,
      getY: () => avgY,
      r2: 0
    };
  }
  
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared (coefficient of determination)
  // R² = 1 - (SS_res / SS_tot)
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  
  for (const point of points) {
    const predicted = slope * point.x + intercept;
    ssTot += (point.y - meanY) ** 2;
    ssRes += (point.y - predicted) ** 2;
  }
  
  const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
  
  return {
    slope,
    intercept,
    getY: (x: number) => slope * x + intercept,
    r2: Math.max(0, Math.min(1, r2)) // Clamp to [0, 1]
  };
}

/**
 * Convert period labels to numeric indices for regression.
 * Periods are sorted chronologically.
 * 
 * @param periods Array of period labels (e.g., ["PGY-1 Fall", "PGY-1 Spring", ...])
 * @returns Map of period label to numeric index
 */
export function periodToIndex(periods: string[]): Map<string, number> {
  // Sort periods chronologically
  const sorted = [...periods].sort((a, b) => {
    const parseLabel = (label: string) => {
      const match = label.match(/PGY-(\d+)\s+(Fall|Spring)/);
      if (!match) return { pgy: 0, semester: 0 };
      const pgy = parseInt(match[1], 10);
      const semester = match[2] === 'Fall' ? 0 : 1;
      return { pgy, semester };
    };
    
    const aParsed = parseLabel(a);
    const bParsed = parseLabel(b);
    
    if (aParsed.pgy !== bParsed.pgy) {
      return aParsed.pgy - bParsed.pgy;
    }
    return aParsed.semester - bParsed.semester;
  });
  
  const indexMap = new Map<string, number>();
  sorted.forEach((period, index) => {
    indexMap.set(period, index);
  });
  
  return indexMap;
}

/**
 * Calculate trendline endpoints for rendering on a chart.
 * 
 * @param regression The regression result
 * @param startX Starting X position (usually 0)
 * @param endX Ending X position (usually number of periods - 1)
 * @param chartHeight Height of the chart area in pixels
 * @param maxY Maximum Y value (usually 5.0 for our scores)
 * @returns Start and end coordinates for the line
 */
export function getTrendlineCoordinates(
  regression: LinearRegressionResult,
  startX: number,
  endX: number,
  chartHeight: number,
  maxY: number = 5.0
): { x1: number; y1: number; x2: number; y2: number } {
  const startY = regression.getY(startX);
  const endY = regression.getY(endX);
  
  // Convert Y values to pixel coordinates (inverted because SVG Y increases downward)
  // Also clamp to valid range [0, maxY]
  const clampedStartY = Math.max(0, Math.min(maxY, startY));
  const clampedEndY = Math.max(0, Math.min(maxY, endY));
  
  const y1 = chartHeight - (clampedStartY / maxY) * chartHeight;
  const y2 = chartHeight - (clampedEndY / maxY) * chartHeight;
  
  return { x1: startX, y1, x2: endX, y2 };
}

/**
 * Determine the trend direction based on slope.
 * 
 * @param slope The regression slope
 * @param threshold Minimum slope to consider significant (default 0.1)
 * @returns 'improving', 'declining', or 'stable'
 */
export function getTrendDirection(
  slope: number,
  threshold: number = 0.1
): 'improving' | 'declining' | 'stable' {
  if (slope > threshold) return 'improving';
  if (slope < -threshold) return 'declining';
  return 'stable';
}


