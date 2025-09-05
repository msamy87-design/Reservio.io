import React, { ReactNode, useEffect } from 'react';
import { useABTest, useABTestComponent, useABTestVariant, useABTestConfig } from '../hooks/useABTest';

// Generic A/B Test Wrapper Component
interface ABTestWrapperProps {
  testId: string;
  variants: Record<string, ReactNode>;
  defaultVariant?: string;
  fallback?: ReactNode;
  trackView?: boolean;
}

export const ABTestWrapper: React.FC<ABTestWrapperProps> = ({
  testId,
  variants,
  defaultVariant,
  fallback = null,
  trackView = true
}) => {
  const { variant, trackEvent, isLoading, error } = useABTest(testId);

  useEffect(() => {
    if (trackView && variant) {
      trackEvent('view', { variant });
    }
  }, [variant, trackEvent, trackView]);

  if (error) {
    console.error(`A/B Test Error (${testId}):`, error);
    return <>{fallback}</>;
  }

  if (isLoading) {
    return <>{fallback}</>;
  }

  const currentVariant = variant || defaultVariant;
  if (!currentVariant || !variants[currentVariant]) {
    return <>{fallback}</>;
  }

  return <>{variants[currentVariant]}</>;
};

// Button A/B Test Component
interface ABTestButtonConfig {
  text: string;
  color: string;
  size: 'sm' | 'md' | 'lg';
  variant: 'primary' | 'secondary' | 'outline';
  icon?: ReactNode;
}

interface ABTestButtonProps {
  testId: string;
  variants: Record<string, ABTestButtonConfig>;
  defaultVariant?: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const ABTestButton: React.FC<ABTestButtonProps> = ({
  testId,
  variants,
  defaultVariant,
  onClick,
  className = '',
  disabled = false
}) => {
  const { config, trackClick, trackConversion, isLoading } = useABTestComponent(
    testId,
    variants,
    defaultVariant
  );

  const handleClick = () => {
    trackClick();
    onClick();
  };

  const handleConversion = (conversionData?: Record<string, any>) => {
    trackConversion(conversionData);
  };

  if (isLoading || !config) {
    const fallbackConfig = variants[defaultVariant || Object.keys(variants)[0]];
    return (
      <button 
        onClick={onClick} 
        disabled={disabled}
        className={`btn ${fallbackConfig?.variant || 'primary'} ${className}`}
      >
        {fallbackConfig?.text || 'Loading...'}
      </button>
    );
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700', 
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
  };

  const buttonClass = `
    ${sizeClasses[config.size]} 
    ${variantClasses[config.variant]}
    ${config.color ? `bg-${config.color}-600 hover:bg-${config.color}-700` : ''}
    font-medium rounded-lg transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();

  return (
    <button 
      onClick={handleClick}
      disabled={disabled}
      className={buttonClass}
      style={{ backgroundColor: config.color }}
    >
      {config.icon && <span className="mr-2">{config.icon}</span>}
      {config.text}
    </button>
  );
};

// Header A/B Test Component
interface ABTestHeaderConfig {
  title: string;
  subtitle?: string;
  titleColor: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  alignment: 'left' | 'center' | 'right';
  showSubtitle: boolean;
}

interface ABTestHeaderProps {
  testId: string;
  variants: Record<string, ABTestHeaderConfig>;
  defaultVariant?: string;
  className?: string;
}

export const ABTestHeader: React.FC<ABTestHeaderProps> = ({
  testId,
  variants,
  defaultVariant,
  className = ''
}) => {
  const { config, trackCustomEvent, isLoading } = useABTestComponent(
    testId,
    variants,
    defaultVariant
  );

  useEffect(() => {
    if (config) {
      trackCustomEvent('header_rendered', { 
        title: config.title,
        size: config.size,
        alignment: config.alignment
      });
    }
  }, [config, trackCustomEvent]);

  if (isLoading || !config) {
    const fallbackConfig = variants[defaultVariant || Object.keys(variants)[0]];
    return (
      <div className={`${className}`}>
        <h1 className="text-3xl font-bold">{fallbackConfig?.title || 'Loading...'}</h1>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center', 
    right: 'text-right'
  };

  return (
    <div className={`${alignmentClasses[config.alignment]} ${className}`}>
      <h1 
        className={`${sizeClasses[config.size]} font-bold mb-4`}
        style={{ color: config.titleColor }}
      >
        {config.title}
      </h1>
      {config.showSubtitle && config.subtitle && (
        <p className="text-gray-600 text-lg">
          {config.subtitle}
        </p>
      )}
    </div>
  );
};

// Pricing A/B Test Component
interface ABTestPricingConfig {
  layout: 'horizontal' | 'vertical';
  showDiscount: boolean;
  highlightSavings: boolean;
  priceColor: string;
  ctaText: string;
  showFeatures: boolean;
}

interface ABTestPricingProps {
  testId: string;
  variants: Record<string, ABTestPricingConfig>;
  defaultVariant?: string;
  price: number;
  originalPrice?: number;
  features?: string[];
  onCTAClick: () => void;
  className?: string;
}

export const ABTestPricing: React.FC<ABTestPricingProps> = ({
  testId,
  variants,
  defaultVariant,
  price,
  originalPrice,
  features = [],
  onCTAClick,
  className = ''
}) => {
  const { config, trackClick, trackConversion, isLoading } = useABTestComponent(
    testId,
    variants,
    defaultVariant
  );

  const handleCTAClick = () => {
    trackClick();
    trackConversion({ price, originalPrice });
    onCTAClick();
  };

  if (isLoading || !config) {
    return (
      <div className={`p-6 border rounded-lg ${className}`}>
        <div className="text-2xl font-bold">${price}</div>
        <button 
          onClick={onCTAClick}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Book Now
        </button>
      </div>
    );
  }

  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;
  const savings = originalPrice ? originalPrice - price : 0;

  const layoutClass = config.layout === 'horizontal' ? 'flex items-center space-x-4' : 'space-y-4';

  return (
    <div className={`p-6 border rounded-lg ${className}`}>
      <div className={layoutClass}>
        <div className="pricing-display">
          <div 
            className="text-3xl font-bold"
            style={{ color: config.priceColor }}
          >
            ${price}
          </div>
          
          {config.showDiscount && originalPrice && originalPrice > price && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 line-through">${originalPrice}</span>
              {config.highlightSavings && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                  Save {discount}% (${savings})
                </span>
              )}
            </div>
          )}
        </div>

        {config.showFeatures && features.length > 0 && (
          <div className="features">
            <ul className="space-y-1 text-sm text-gray-600">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleCTAClick}
        className="w-full mt-4 bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700 transition-colors"
      >
        {config.ctaText}
      </button>
    </div>
  );
};

// Search Results A/B Test Component
interface ABTestSearchConfig {
  layout: 'grid' | 'list';
  showImages: boolean;
  showRatings: boolean;
  showDistance: boolean;
  resultsPerPage: number;
  sortDefault: 'relevance' | 'distance' | 'rating' | 'price';
}

interface SearchResult {
  id: string;
  name: string;
  image?: string;
  rating?: number;
  distance?: string;
  price?: number;
  description?: string;
}

interface ABTestSearchResultsProps {
  testId: string;
  variants: Record<string, ABTestSearchConfig>;
  defaultVariant?: string;
  results: SearchResult[];
  onResultClick: (result: SearchResult) => void;
  className?: string;
}

export const ABTestSearchResults: React.FC<ABTestSearchResultsProps> = ({
  testId,
  variants,
  defaultVariant,
  results,
  onResultClick,
  className = ''
}) => {
  const { config, trackClick, isLoading } = useABTestComponent(
    testId,
    variants,
    defaultVariant
  );

  const handleResultClick = (result: SearchResult, index: number) => {
    trackClick();
    trackCustomEvent('result_click', { 
      resultId: result.id,
      position: index + 1,
      layout: config?.layout
    });
    onResultClick(result);
  };

  if (isLoading || !config) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {results.slice(0, 6).map((result) => (
          <div key={result.id} className="p-4 border rounded">
            <h3 className="font-semibold">{result.name}</h3>
          </div>
        ))}
      </div>
    );
  }

  const { trackCustomEvent } = useABTest(testId);

  const layoutClass = config.layout === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'space-y-4';

  const displayResults = results.slice(0, config.resultsPerPage);

  return (
    <div className={`${layoutClass} ${className}`}>
      {displayResults.map((result, index) => (
        <div
          key={result.id}
          onClick={() => handleResultClick(result, index)}
          className={`
            cursor-pointer transition-shadow hover:shadow-md
            ${config.layout === 'grid' 
              ? 'p-4 border rounded-lg' 
              : 'p-4 border-b flex items-center space-x-4'
            }
          `}
        >
          {config.showImages && result.image && (
            <img 
              src={result.image} 
              alt={result.name}
              className={config.layout === 'grid' ? 'w-full h-32 object-cover rounded mb-2' : 'w-16 h-16 object-cover rounded'}
            />
          )}
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{result.name}</h3>
            
            {config.showRatings && result.rating && (
              <div className="flex items-center mt-1">
                <span className="text-yellow-500">★</span>
                <span className="ml-1">{result.rating}</span>
              </div>
            )}
            
            {config.showDistance && result.distance && (
              <p className="text-gray-600 text-sm">{result.distance}</p>
            )}
            
            {result.description && (
              <p className="text-gray-600 text-sm mt-1">{result.description}</p>
            )}
            
            {result.price && (
              <div className="mt-2 font-semibold text-indigo-600">
                ${result.price}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Higher Order Component for A/B Testing
export function withABTest<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  testId: string,
  variantConfigs: Record<string, Partial<T>>,
  defaultVariant?: string
) {
  return function ABTestEnhancedComponent(props: T) {
    const variant = useABTestVariant(testId, defaultVariant);
    const config = useABTestConfig(testId);
    const { trackEvent } = useABTest(testId);

    const variantProps = variant ? variantConfigs[variant] : {};
    const mergedProps = { ...props, ...variantProps, ...config };

    useEffect(() => {
      if (variant) {
        trackEvent('component_render', { variant, component: Component.displayName || 'Unknown' });
      }
    }, [variant, trackEvent]);

    return <Component {...mergedProps} />;
  };
}

export default {
  ABTestWrapper,
  ABTestButton,
  ABTestHeader,
  ABTestPricing,
  ABTestSearchResults,
  withABTest
};