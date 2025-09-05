import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

// Types
interface Recommendation {
  serviceId: string;
  businessId: string;
  score: number;
  reason: string;
  confidence: number;
  metadata: {
    algorithm: string;
    factors: Record<string, number>;
    timestamp: string;
  };
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  rating: number;
  businessName: string;
  businessId: string;
  imageUrl?: string;
}

interface SearchIntent {
  intent: string;
  entities: any[];
  category?: string;
  confidence: number;
}

interface BusinessInsights {
  businessId: string;
  insights: {
    demandPrediction: Record<string, number>;
    priceOptimization: Record<string, number>;
    inventoryRecommendations: string[];
    marketingTargets: any[];
  };
  competitiveAnalysis: {
    position: number;
    strengths: string[];
    opportunities: string[];
    threats: string[];
  };
}

// Hook for recommendation functionality
export const useRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPersonalizedRecommendations = useCallback(async (options: {
    limit?: number;
    categories?: string[];
    location?: { lat: number; lng: number; radius: number };
    priceRange?: { min: number; max: number };
    timeSlot?: string;
  } = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/recommendations/personalized', {
        params: {
          limit: options.limit || 10,
          categories: options.categories?.join(','),
          location: options.location ? JSON.stringify(options.location) : undefined,
          priceRange: options.priceRange ? JSON.stringify(options.priceRange) : undefined,
          timeSlot: options.timeSlot
        }
      });
      
      return response.data.recommendations;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get recommendations');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeSearchIntent = useCallback(async (query: string): Promise<SearchIntent> => {
    try {
      const response = await axios.post('/api/recommendations/search-intent', { query });
      return response.data;
    } catch (err) {
      console.error('Failed to analyze search intent:', err);
      return { intent: 'unknown', entities: [], confidence: 0 };
    }
  }, []);

  const trackInteraction = useCallback(async (serviceId: string, interactionType: string) => {
    try {
      await axios.post('/api/recommendations/interactions', {
        serviceId,
        interactionType
      });
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  }, []);

  const smartSearch = useCallback(async (
    query: string,
    filters: any = {},
    location?: { lat: number; lng: number; radius: number },
    limit: number = 20
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/recommendations/smart-search', {
        query,
        filters,
        location,
        limit
      });

      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Search failed');
      return { results: [], intent: null };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getPersonalizedRecommendations,
    analyzeSearchIntent,
    trackInteraction,
    smartSearch,
    loading,
    error
  };
};

// Personalized Recommendations Component
export const PersonalizedRecommendations: React.FC<{
  categories?: string[];
  location?: { lat: number; lng: number; radius: number };
  limit?: number;
  onServiceClick?: (serviceId: string) => void;
}> = ({ categories, location, limit = 6, onServiceClick }) => {
  const { getPersonalizedRecommendations, trackInteraction, loading, error } = useRecommendations();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [services, setServices] = useState<Record<string, Service>>({});

  useEffect(() => {
    const loadRecommendations = async () => {
      const recs = await getPersonalizedRecommendations({
        categories,
        location,
        limit
      });
      
      setRecommendations(recs);
      
      // Load service details for each recommendation
      const serviceIds = recs.map((r: Recommendation) => r.serviceId);
      if (serviceIds.length > 0) {
        try {
          const serviceResponse = await axios.get(`/api/services/batch`, {
            params: { ids: serviceIds.join(',') }
          });
          
          const serviceMap = serviceResponse.data.services.reduce(
            (acc: Record<string, Service>, service: Service) => {
              acc[service.id] = service;
              return acc;
            },
            {}
          );
          
          setServices(serviceMap);
        } catch (err) {
          console.error('Failed to load service details:', err);
        }
      }
    };

    loadRecommendations();
  }, [categories, location, limit, getPersonalizedRecommendations]);

  const handleServiceClick = (serviceId: string) => {
    trackInteraction(serviceId, 'click');
    onServiceClick?.(serviceId);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow animate-pulse">
            <div className="h-48 bg-gray-300 rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No personalized recommendations available.</p>
        <p className="text-sm text-gray-500">Book more services to get better recommendations!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
        <span className="text-sm text-gray-500">Powered by AI</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => {
          const service = services[rec.serviceId];
          if (!service) return null;

          return (
            <div
              key={rec.serviceId}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleServiceClick(rec.serviceId)}
            >
              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{service.name}</h3>
                  <span className="text-green-600 font-bold">${service.price}</span>
                </div>
                
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{service.businessName}</span>
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1">{service.rating.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {Math.round(rec.confidence * 100)}% match
                  </span>
                  
                  <div className="text-xs text-gray-500" title={rec.reason}>
                    {rec.reason.length > 30 ? rec.reason.substring(0, 30) + '...' : rec.reason}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Smart Search Component
export const SmartSearchBox: React.FC<{
  onResults?: (results: any) => void;
  placeholder?: string;
  categories?: string[];
}> = ({ onResults, placeholder = "Search for services...", categories }) => {
  const { smartSearch, analyzeSearchIntent, loading } = useRecommendations();
  const [query, setQuery] = useState('');
  const [intent, setIntent] = useState<SearchIntent | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced intent analysis
  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(async () => {
        const searchIntent = await analyzeSearchIntent(query);
        setIntent(searchIntent);
        setShowSuggestions(true);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setIntent(null);
      setShowSuggestions(false);
    }
  }, [query, analyzeSearchIntent]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setShowSuggestions(false);
    const results = await smartSearch(query, { categories });
    onResults?.(results);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    const results = await smartSearch(suggestion, { categories });
    onResults?.(results);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </form>

      {/* Intent-based suggestions */}
      {showSuggestions && intent && intent.confidence > 0.5 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b">
            <p className="text-xs text-gray-500 mb-2">
              I think you're looking for:
            </p>
            <p className="text-sm font-medium text-blue-600">
              {intent.intent.replace('_', ' ').toUpperCase()}
              {intent.category && ` in ${intent.category.toUpperCase()}`}
            </p>
          </div>
          
          {intent.entities.length > 0 && (
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-2">Suggestions:</p>
              {intent.entities.slice(0, 3).map((entity, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(entity.sourceText)}
                  className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                >
                  {entity.sourceText}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Trending Services Component
export const TrendingServices: React.FC<{
  category?: string;
  location?: { lat: number; lng: number; radius: number };
  limit?: number;
}> = ({ category, location, limit = 8 }) => {
  const [trendingServices, setTrendingServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackInteraction } = useRecommendations();

  useEffect(() => {
    const loadTrendingServices = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/recommendations/trending', {
          params: {
            category,
            location: location ? JSON.stringify(location) : undefined,
            limit
          }
        });
        
        setTrendingServices(response.data.services);
      } catch (error) {
        console.error('Failed to load trending services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTrendingServices();
  }, [category, location, limit]);

  const handleServiceClick = (serviceId: string) => {
    trackInteraction(serviceId, 'trending_click');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow animate-pulse">
            <div className="h-32 bg-gray-300 rounded-t-lg"></div>
            <div className="p-3">
              <div className="h-3 bg-gray-300 rounded mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Trending Now</h3>
        <span className="ml-2 text-red-500">🔥</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {trendingServices.map((service) => (
          <div
            key={service.id}
            onClick={() => handleServiceClick(service.id)}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            {service.imageUrl && (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-32 object-cover rounded-t-lg"
              />
            )}
            
            <div className="p-3">
              <h4 className="font-medium text-sm text-gray-900 truncate">
                {service.name}
              </h4>
              <p className="text-xs text-gray-600 truncate">
                {service.businessName}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-green-600">
                  ${service.price}
                </span>
                <div className="flex items-center text-xs">
                  <span className="text-yellow-400">★</span>
                  <span className="ml-1 text-gray-600">{service.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Business Intelligence Dashboard
export const BusinessIntelligenceDashboard: React.FC<{
  businessId: string;
}> = ({ businessId }) => {
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/recommendations/business-insights/${businessId}`);
        setInsights(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load business insights');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [businessId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-4"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Insights</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
        <span className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
          AI-Powered Insights
        </span>
      </div>

      {/* Competitive Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              #{insights.competitiveAnalysis.position}
            </div>
            <div className="text-sm text-gray-600">Market Ranking</div>
          </div>
          
          <div>
            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
            {insights.competitiveAnalysis.strengths.slice(0, 2).map((strength, i) => (
              <p key={i} className="text-sm text-gray-600">• {strength}</p>
            ))}
          </div>
          
          <div>
            <h4 className="font-medium text-blue-600 mb-2">Opportunities</h4>
            {insights.competitiveAnalysis.opportunities.slice(0, 2).map((opp, i) => (
              <p key={i} className="text-sm text-gray-600">• {opp}</p>
            ))}
          </div>
          
          <div>
            <h4 className="font-medium text-orange-600 mb-2">Threats</h4>
            {insights.competitiveAnalysis.threats.slice(0, 2).map((threat, i) => (
              <p key={i} className="text-sm text-gray-600">• {threat}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Recommendations</h3>
          {insights.insights.inventoryRecommendations.length > 0 ? (
            <ul className="space-y-2">
              {insights.insights.inventoryRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No recommendations available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Optimization</h3>
          {Object.entries(insights.insights.priceOptimization).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(insights.insights.priceOptimization).slice(0, 4).map(([service, price]) => (
                <div key={service} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 truncate">{service}</span>
                  <span className="text-sm font-medium text-green-600">
                    ${typeof price === 'number' ? price.toFixed(2) : price}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No price recommendations available</p>
          )}
        </div>
      </div>

      {/* Demand Prediction */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demand Prediction</h3>
        {Object.entries(insights.insights.demandPrediction).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(insights.insights.demandPrediction).map(([period, demand]) => (
              <div key={period} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {typeof demand === 'number' ? demand.toFixed(0) : demand}
                </div>
                <div className="text-sm text-gray-600 capitalize">{period}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Building demand prediction model...</p>
        )}
      </div>
    </div>
  );
};

// Recommendation Configuration Component
export const RecommendationConfig: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get('/api/recommendations/config');
        setConfig(response.data);
      } catch (error) {
        console.error('Failed to load recommendation config:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendation System</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl mb-2 ${config.configured ? 'text-green-500' : 'text-red-500'}`}>
            {config.configured ? '✓' : '✗'}
          </div>
          <div className="text-sm text-gray-600">System Status</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {config.stats?.userProfiles || 0}
          </div>
          <div className="text-sm text-gray-600">User Profiles</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {config.stats?.serviceProfiles || 0}
          </div>
          <div className="text-sm text-gray-600">Service Profiles</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {config.stats?.recommendations?.generated || 0}
          </div>
          <div className="text-sm text-gray-600">Generated</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Natural Language Processing</span>
          <span className={`text-sm ${config.features?.nlp ? 'text-green-600' : 'text-red-600'}`}>
            {config.features?.nlp ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Sentiment Analysis</span>
          <span className={`text-sm ${config.features?.sentiment ? 'text-green-600' : 'text-red-600'}`}>
            {config.features?.sentiment ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">AI Enhancement</span>
          <span className={`text-sm ${config.features?.ai ? 'text-green-600' : 'text-red-600'}`}>
            {config.features?.ai ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Database Connection</span>
          <span className={`text-sm ${config.features?.database ? 'text-green-600' : 'text-red-600'}`}>
            {config.features?.database ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};