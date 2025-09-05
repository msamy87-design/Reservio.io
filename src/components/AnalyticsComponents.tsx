import React, { useState, useEffect, useMemo } from 'react';
import { useAnalytics, useBookingTracking, useEcommerceTracking, useInteractionTracking, useFormTracking } from '../hooks/useAnalytics';
import axios from 'axios';

// Types for analytics data
interface DashboardData {
  overview: {
    totalSessions: number;
    totalPageViews: number;
    totalEvents: number;
    avgSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
  };
  traffic: {
    current: number;
    previous: number;
    change: number;
  };
  topPages: Array<{
    path: string;
    views: number;
    avgDuration: number;
  }>;
  userBehavior: {
    newUsers: number;
    returningUsers: number;
    avgPagesPerSession: number;
  };
  conversions: Array<{
    type: string;
    count: number;
    value: number;
  }>;
  realTimeMetrics: {
    activeUsers: number;
    currentPageViews: number;
    topEvents: Array<{
      eventName: string;
      count: number;
    }>;
  };
}

interface BusinessMetrics {
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    revenue: number;
  };
  customers: {
    new: number;
    returning: number;
    churnRate: number;
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

interface FunnelData {
  steps: Array<{
    name: string;
    users: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
  totalUsers: number;
  overallConversionRate: number;
}

// Main Analytics Dashboard Component
export const AnalyticsDashboard: React.FC = () => {
  const { isConfigured } = useAnalytics();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/analytics/dashboard');
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Analytics dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isConfigured) {
      fetchDashboardData();
      // Refresh data every 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isConfigured]);

  if (!isConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Analytics Not Configured</h3>
        <p className="text-yellow-700">
          Analytics service is not properly configured. Please check your environment variables and database connection.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Overview Cards */}
      {dashboardData && (
        <>
          <OverviewCards data={dashboardData.overview} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrafficChart data={dashboardData.traffic} />
            <RealTimeMetrics data={dashboardData.realTimeMetrics} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPages pages={dashboardData.topPages} />
            <ConversionMetrics conversions={dashboardData.conversions} />
          </div>
        </>
      )}
    </div>
  );
};

// Overview Cards Component
const OverviewCards: React.FC<{ data: DashboardData['overview'] }> = ({ data }) => {
  const cards = [
    {
      title: 'Total Sessions',
      value: data.totalSessions.toLocaleString(),
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      title: 'Page Views',
      value: data.totalPageViews.toLocaleString(),
      icon: '📄',
      color: 'bg-green-500'
    },
    {
      title: 'Events',
      value: data.totalEvents.toLocaleString(),
      icon: '⚡',
      color: 'bg-purple-500'
    },
    {
      title: 'Avg. Session Duration',
      value: `${Math.round(data.avgSessionDuration / 1000)}s`,
      icon: '⏱️',
      color: 'bg-orange-500'
    },
    {
      title: 'Bounce Rate',
      value: `${(data.bounceRate * 100).toFixed(1)}%`,
      icon: '📉',
      color: 'bg-red-500'
    },
    {
      title: 'Conversion Rate',
      value: `${(data.conversionRate * 100).toFixed(2)}%`,
      icon: '🎯',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`${card.color} rounded-lg p-3 text-white text-lg mr-4`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Traffic Chart Component
const TrafficChart: React.FC<{ data: DashboardData['traffic'] }> = ({ data }) => {
  const changeColor = data.change >= 0 ? 'text-green-600' : 'text-red-600';
  const changeIcon = data.change >= 0 ? '↗️' : '↘️';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Overview</h3>
      <div className="space-y-4">
        <div>
          <p className="text-3xl font-bold text-gray-900">{data.current.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Current Period</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`${changeColor} font-medium`}>
            {changeIcon} {Math.abs(data.change).toFixed(1)}%
          </span>
          <span className="text-gray-600">vs previous period</span>
        </div>
        <div className="text-sm text-gray-500">
          Previous: {data.previous.toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// Real-time Metrics Component
const RealTimeMetrics: React.FC<{ data: DashboardData['realTimeMetrics'] }> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Real-time</h3>
        <div className="flex items-center text-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm">Live</span>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">{data.activeUsers}</p>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-900">{data.currentPageViews}</p>
          <p className="text-sm text-gray-600">Page Views (last 30 min)</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 mb-2">Top Events</p>
          {data.topEvents.slice(0, 3).map((event, index) => (
            <div key={event.eventName} className="flex justify-between text-sm">
              <span className="text-gray-600">{event.eventName}</span>
              <span className="font-medium">{event.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Top Pages Component
const TopPages: React.FC<{ pages: DashboardData['topPages'] }> = ({ pages }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Pages</h3>
      <div className="space-y-3">
        {pages.slice(0, 5).map((page, index) => (
          <div key={page.path} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{page.path}</p>
              <p className="text-xs text-gray-500">Avg. {Math.round(page.avgDuration / 1000)}s</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{page.views.toLocaleString()}</p>
              <p className="text-xs text-gray-500">views</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Conversion Metrics Component
const ConversionMetrics: React.FC<{ conversions: DashboardData['conversions'] }> = ({ conversions }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Conversions</h3>
      <div className="space-y-3">
        {conversions.map((conversion) => (
          <div key={conversion.type} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {conversion.type.replace('_', ' ')}
              </p>
              <p className="text-xs text-gray-500">{conversion.count} conversions</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                ${conversion.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">value</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Business Metrics Dashboard
export const BusinessMetricsDashboard: React.FC<{ businessId: string }> = ({ businessId }) => {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/analytics/business-metrics/${businessId}?period=${period}`);
        setMetrics(response.data);
      } catch (error) {
        console.error('Failed to fetch business metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [businessId, period]);

  if (loading) {
    return <div className="text-center py-8">Loading business metrics...</div>;
  }

  if (!metrics) {
    return <div className="text-center py-8 text-red-600">Failed to load metrics</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bookings</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">{metrics.bookings.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">{metrics.bookings.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cancelled</span>
              <span className="font-semibold text-red-600">{metrics.bookings.cancelled}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Revenue</span>
              <span className="font-semibold text-blue-600">
                ${metrics.bookings.revenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customers</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">New</span>
              <span className="font-semibold text-green-600">{metrics.customers.new}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Returning</span>
              <span className="font-semibold text-blue-600">{metrics.customers.returning}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Churn Rate</span>
              <span className="font-semibold text-orange-600">
                {(metrics.customers.churnRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response</span>
              <span className="font-semibold">{metrics.performance.avgResponseTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate</span>
              <span className="font-semibold text-red-600">
                {(metrics.performance.errorRate * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Uptime</span>
              <span className="font-semibold text-green-600">
                {(metrics.performance.uptime * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Funnel Analysis Component
export const FunnelAnalysis: React.FC = () => {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [funnelName, setFunnelName] = useState('booking');

  const predefinedFunnels = {
    booking: ['service_viewed', 'booking_started', 'booking_completed'],
    registration: ['landing_page', 'signup_form', 'email_verification', 'profile_completed'],
    purchase: ['product_view', 'add_to_cart', 'checkout_started', 'payment_completed']
  };

  useEffect(() => {
    const fetchFunnelData = async () => {
      try {
        setLoading(true);
        const response = await axios.post('/api/analytics/funnel-analysis', {
          funnelName,
          steps: predefinedFunnels[funnelName as keyof typeof predefinedFunnels],
          timeframe: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            endDate: new Date()
          }
        });
        setFunnelData(response.data);
      } catch (error) {
        console.error('Failed to fetch funnel data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelData();
  }, [funnelName]);

  if (loading) {
    return <div className="text-center py-8">Loading funnel analysis...</div>;
  }

  if (!funnelData) {
    return <div className="text-center py-8 text-red-600">Failed to load funnel data</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Funnel Analysis</h3>
        <select 
          value={funnelName} 
          onChange={(e) => setFunnelName(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="booking">Booking Funnel</option>
          <option value="registration">Registration Funnel</option>
          <option value="purchase">Purchase Funnel</option>
        </select>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Total Users: {funnelData.totalUsers.toLocaleString()} | 
          Overall Conversion: {(funnelData.overallConversionRate * 100).toFixed(1)}%
        </div>
      </div>

      <div className="space-y-4">
        {funnelData.steps.map((step, index) => (
          <div key={step.name} className="relative">
            <div className="flex items-center">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 capitalize">
                    {step.name.replace('_', ' ')}
                  </h4>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {step.users.toLocaleString()} users
                    </div>
                    <div className="text-xs text-gray-500">
                      {(step.conversionRate * 100).toFixed(1)}% conversion
                    </div>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${step.conversionRate * 100}%` }}
                    ></div>
                  </div>
                </div>
                {step.dropOffRate > 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    {(step.dropOffRate * 100).toFixed(1)}% drop-off
                  </div>
                )}
              </div>
            </div>
            {index < funnelData.steps.length - 1 && (
              <div className="ml-4 w-0.5 h-4 bg-gray-300 mt-2"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Analytics Event Tracker Component (for development/testing)
export const AnalyticsEventTracker: React.FC = () => {
  const { trackEvent, trackPageView, trackConversion, isConfigured } = useAnalytics();
  const { trackClick } = useInteractionTracking();
  const [eventName, setEventName] = useState('');
  const [eventProperties, setEventProperties] = useState('');

  const handleTrackCustomEvent = async () => {
    try {
      const properties = eventProperties ? JSON.parse(eventProperties) : {};
      await trackEvent(eventName, properties);
      alert('Event tracked successfully!');
      setEventName('');
      setEventProperties('');
    } catch (error) {
      alert('Failed to track event: ' + error);
    }
  };

  const trackSampleEvents = () => {
    trackEvent('test_event', { source: 'analytics_component', timestamp: Date.now() });
    trackPageView('/test-page', 'Test Page');
    trackConversion('test_conversion', 100);
    trackClick('test_button', 'button');
  };

  if (!isConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Analytics not configured</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics Event Tracker</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g., button_click"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Properties (JSON)
          </label>
          <textarea
            value={eventProperties}
            onChange={(e) => setEventProperties(e.target.value)}
            placeholder='{"key": "value"}'
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleTrackCustomEvent}
            disabled={!eventName}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Track Custom Event
          </button>
          
          <button
            onClick={trackSampleEvents}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Track Sample Events
          </button>
        </div>
      </div>
    </div>
  );
};