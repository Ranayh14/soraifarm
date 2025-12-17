/**
 * Utility functions for chart data generation
 * Generates dynamic dates and realistic dummy data for market charts
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
 * @param days Number of days to generate (e.g., 7 for week, 30 for month)
 * @returns Array of date objects
 */
export const generateDateRange = (days: number): Date[] => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  return dates;
};

/**
 * Format date for chart label (Indonesian format)
 * @param date Date object
 * @param includeDayName Whether to include day name (e.g., "Sen 15 Des")
 * @returns Formatted date string
 */
export const formatChartDate = (date: Date, includeDayName: boolean = false): string => {
  const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' }); // Sen, Sel, Rab, etc.
  const day = date.getDate();
  const month = date.toLocaleDateString('id-ID', { month: 'short' }); // Des, Nov, etc.

  if (includeDayName) {
    return `${dayName} ${day} ${month}`;
  }
  return `${day} ${month}`;
};

/**
 * Generate realistic dummy market data with fluctuations
 * @param days Number of days to generate
 * @param basePrice Base price (default: 2500)
 * @param baseVolume Base volume in tons (default: 100)
 * @returns Array of chart data points
 */
export const generateDummyMarketData = (
  days: number,
  basePrice: number = 2500,
  baseVolume: number = 100
): ChartDataPoint[] => {
  const dates = generateDateRange(days);
  const data: ChartDataPoint[] = [];

  dates.forEach((date, index) => {
    // Add realistic fluctuations with slight trend
    // Price: random variation ±5% with slight upward trend
    const priceVariation = (Math.random() - 0.4) * 0.1; // -0.1 to 0.1 (slight upward bias)
    const trendFactor = (index / days) * 0.05; // Slight upward trend over time
    const price = Math.round(basePrice * (1 + priceVariation + trendFactor));

    // Volume: random variation ±15% with slight upward trend
    const volumeVariation = (Math.random() - 0.3) * 0.3; // -0.15 to 0.15
    const volumeTrend = (index / days) * 0.1; // Slight upward trend
    const volume = Math.round((baseVolume * (1 + volumeVariation + volumeTrend)) * 100) / 100;

    const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString('id-ID', { month: 'short' });

    data.push({
      name: days <= 7 ? `${dayName} ${day} ${month}` : `${day} ${month}`,
      price,
      volume,
      fullDate: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      dateValue: date.getTime()
    });
  });

  return data;
};

/**
 * Transform API market data to chart format with dynamic dates
 * @param apiData Array of market data from API
 * @param days Number of days expected (for fallback)
 * @returns Array of chart data points
 */
export const transformMarketDataToChart = (
  apiData: any[],
  days: number
): ChartDataPoint[] => {
  if (!apiData || apiData.length === 0) {
    // Generate dummy data if API returns empty
    return generateDummyMarketData(days);
  }

  const dates = generateDateRange(days);
  const data: ChartDataPoint[] = [];

  // If API data has dates, use them; otherwise map to generated dates
  apiData.forEach((item, index) => {
    let date: Date;

    if (item.date && typeof item.date === 'string') {
      // Parse date from API (format: YYYY-MM-DD)
      const parts = item.date.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        date = new Date(year, month - 1, day, 12, 0, 0);
      } else {
        date = new Date(item.date);
      }
    } else {
      // Use generated date based on index
      const dateIndex = Math.min(index, dates.length - 1);
      date = dates[dateIndex];
    }

    const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString('id-ID', { month: 'short' });

    data.push({
      name: days <= 7 ? `${dayName} ${day} ${month}` : `${day} ${month}`,
      price: item.average_price || item.price || 2500,
      volume: item.sales_volume || item.volume || 100,
      fullDate: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      dateValue: date.getTime()
    });
  });

  // Sort by date to ensure chronological order
  return data.sort((a, b) => a.dateValue - b.dateValue);
};

