import { ref, computed } from 'vue';

// Analytics state (in-memory only - no localStorage persistence)
export const isLoading = ref(false);
export const analyticsError = ref(null);

// Analytics data
export const analyticsData = ref(null);
export const selectedRange = ref('week');

// Fetch analytics data based on time range
export const fetchAnalytics = async (userId, timeRange) => {
  isLoading.value = true;
  analyticsError.value = null;

  try {
    // In a real app, this would make an API call
    // For now, we'll return mock data
    const mockData = generateMockAnalytics(timeRange);

    analyticsData.value = mockData;
    return mockData;
  } catch (err) {
    console.error('Error fetching analytics:', err);
    analyticsError.value = err.message;
    throw err;
  } finally {
    isLoading.value = false;
  }
};

// Generate mock analytics data for demo
const generateMockAnalytics = (timeRange) => {
  // Mock hourly trend data
  const hoursTrendData = [];
  const daysInPeriod = timeRange === 'week' ? 7 :
                        timeRange === 'month' ? 30 :
                        timeRange === 'quarter' ? 90 : 365;

  if (timeRange === 'week') {
    hoursTrendData.push(
      { label: 'Mon', hours: 7.5 + Math.random() * 2 },
      { label: 'Tue', hours: 7 + Math.random() * 3 },
      { label: 'Wed', hours: 8 + Math.random() * 2 },
      { label: 'Thu', hours: 7.5 + Math.random() * 2 },
      { label: 'Fri', hours: 6 + Math.random() * 3 },
      { label: 'Sat', hours: Math.random() > 0.7 ? 3 + Math.random() * 2 : 0 },
      { label: 'Sun', hours: Math.random() > 0.8 ? 2 + Math.random() * 2 : 0 }
    );
  } else {
    // Generate mock data for longer periods
    const labels = timeRange === 'month' ?
                   Array.from({ length: 4 }, (_, i) => `Week ${i+1}`) :
                   timeRange === 'quarter' ?
                   Array.from({ length: 3 }, (_, i) => `Month ${i+1}`) :
                   Array.from({ length: 12 }, (_, i) => `Month ${i+1}`);

    labels.forEach(label => {
      hoursTrendData.push({
        label,
        hours: 30 + Math.random() * 20
      });
    });
  }

  // Mock department stats
  const departmentStats = [
    { name: 'Management', avgHours: 7.5 + Math.random() },
    { name: 'Development', avgHours: 8 + Math.random() },
    { name: 'Sales', avgHours: 7 + Math.random() * 2 },
    { name: 'Design', avgHours: 6.5 + Math.random() * 2 }
  ];

  // Mock top performers
  const topPerformers = [
    { name: 'Jane Smith', role: 'manager', hours: 40 + Math.random() * 10, days: 5 },
    { name: 'John Doe', role: 'employee', hours: 38 + Math.random() * 10, days: 5 },
    { name: 'Mike Johnson', role: 'employee', hours: 36 + Math.random() * 10, days: 4 },
    { name: 'Sarah Williams', role: 'employee', hours: 34 + Math.random() * 10, days: 4 }
  ];

  // Mock alerts
  const alerts = [
    {
      id: 1,
      type: 'warning',
      icon: '⚠️',
      message: 'John Doe has missed clock-out 2 times this week',
      time: '3 hours ago'
    },
    {
      id: 2,
      type: 'info',
      icon: 'ℹ️',
      message: 'Team average hours below target for this week',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'success',
      icon: '✅',
      message: 'All employees have logged hours today',
      time: '2 days ago'
    }
  ];

  // Calculate totals
  const totalHours = hoursTrendData.reduce((sum, day) => sum + day.hours, 0);
  const avgDailyHours = timeRange === 'week' ?
                        totalHours / hoursTrendData.filter(d => d.hours > 0).length :
                        8.1;

  // Generate overtime hours (>8h per day)
  const overtimeHours = hoursTrendData
    .map(day => Math.max(0, day.hours - 8))
    .reduce((sum, hours) => sum + hours, 0);

  return {
    totalHours,
    overtimeHours,
    totalBreakMinutes: 30 + Math.floor(Math.random() * 90),
    avgDailyHours,
    hoursTrend: hoursTrendData,
    departmentStats,
    topPerformers,
    alerts
  };
};

// Export the store as a composable function
export const useAnalyticsStore = () => {
  return {
    isLoading: computed(() => isLoading.value),
    analyticsError: computed(() => analyticsError.value),
    analyticsData: computed(() => analyticsData.value),
    selectedRange: computed(() => selectedRange.value),
    fetchAnalytics
  };
};
