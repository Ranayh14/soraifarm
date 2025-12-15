/**
 * Utility functions for date generation and chart data
 */

export interface ChartDataPoint {
  name: string;
  price: number;
  volume: number;
  fullDate: string;
  dateValue: number;
}

/**
 * Generate array of dates going backwards from today
 * @param days Number of days to generate
 * @returns Array of date objects
 */
export const generateDateRange = (days: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  // Generate dates going backwards from today in chronological order: [(days-1) days ago, ..., yesterday, today]
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  return dates;
};

/**
 * Format date for chart label (Indonesian locale)
 * @param date Date object
 * @param includeDayName Whether to include day name (e.g., "Sen")
 * @returns Formatted date string
 */
export const formatChartDate = (date: Date, includeDayName: boolean = false): string => {
  const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('id-ID', { month: 'short' });
  
  if (includeDayName) {
    return `${dayName} ${day} ${month}`;
  }
  return `${day} ${month}`;
};

/**
 * Format full date for display (Indonesian locale)
 * @param date Date object
 * @returns Full formatted date string
 */
export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Generate mock market data with realistic fluctuations
 * @param days Number of days
 * @param basePrice Base price (default: 2500)
 * @param baseVolume Base volume in tons (default: 100)
 * @returns Array of chart data points
 */
export const generateMockMarketData = (
  days: number,
  basePrice: number = 2500,
  baseVolume: number = 100
): ChartDataPoint[] => {
  const dates = generateDateRange(days);
  const data: ChartDataPoint[] = [];
  
  // Use a seed based on today's date to make data consistent per day but different each day
  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;
  
  dates.forEach((date, index) => {
    // Create pseudo-random but consistent fluctuations
    const randomSeed = (seed + index) * 17;
    const priceVariation = (randomSeed % 200) - 100; // -100 to +100
    const volumeVariation = (randomSeed % 40) - 20; // -20 to +20
    
    // Add slight trend (slight upward trend over time)
    const trendFactor = index * 0.5;
    
    const price = Math.round(basePrice + priceVariation + trendFactor);
    const volume = Math.max(50, Math.round(baseVolume + volumeVariation + trendFactor * 0.3));
    
    data.push({
      name: formatChartDate(date, days <= 7), // Include day name for 7 days or less
      price,
      volume,
      fullDate: formatFullDate(date),
      dateValue: date.getTime()
    });
  });
  
  return data;
};

