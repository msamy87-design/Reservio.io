import React, { useState } from 'react';
import { SearchFilters } from '../services/marketplaceApi';
import { PriceTier, BusinessAmenity } from '../types';
import { StarIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import { getAmenityIcon, getAmenityLabel } from '../utils/businessUtils';

interface SearchFiltersProps {
    filters: Omit<SearchFilters, 'lat' | 'lon'>;
    onFiltersChange: (filters: Partial<typeof filters>) => void;
    hasLocation?: boolean;
}

const PRICE_TIERS: PriceTier[] = ['$', '$$', '$$$'];
const AMENITIES: BusinessAmenity[] = ['wifi', 'parking', 'wheelchair_accessible', 'credit_cards', 'walk_ins', 'online_booking'];
const DISTANCE_OPTIONS = [1, 2, 5, 10, 25, 50];

const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({ 
    filters, 
    onFiltersChange,
    hasLocation = false
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const handlePriceTierToggle = (tier: PriceTier) => {
        const currentTiers = filters.priceTiers || [];
        const newTiers = currentTiers.includes(tier)
            ? currentTiers.filter(t => t !== tier)
            : [...currentTiers, tier];
        onFiltersChange({ priceTiers: newTiers.length > 0 ? newTiers : undefined });
    };

    const handleAmenityToggle = (amenity: BusinessAmenity) => {
        const currentAmenities = filters.amenities || [];
        const newAmenities = currentAmenities.includes(amenity)
            ? currentAmenities.filter(a => a !== amenity)
            : [...currentAmenities, amenity];
        onFiltersChange({ amenities: newAmenities.length > 0 ? newAmenities : undefined });
    };

    const clearAllFilters = () => {
        onFiltersChange({
            minPrice: undefined,
            maxPrice: undefined,
            minRating: undefined,
            date: undefined,
            maxDistance: undefined,
            priceTiers: undefined,
            amenities: undefined,
            isOpenNow: false,
            hasAvailability: false
        });
    };

    const hasActiveFilters = Object.values(filters).some(value => 
        value !== undefined && value !== false && (Array.isArray(value) ? value.length > 0 : true)
    );

    const FilterSection: React.FC<{ title: string; id: string; children: React.ReactNode }> = ({ title, id, children }) => {
        const isExpanded = expandedSections.has(id);
        return (
            <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                <button
                    onClick={() => toggleSection(id)}
                    className="flex items-center justify-between w-full text-left font-medium text-gray-800 dark:text-gray-200 mb-3"
                >
                    {title}
                    {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5" />
                    ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                    )}
                </button>
                {isExpanded && <div>{children}</div>}
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Filter Results</h3>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <FilterSection title="Basic Filters" id="basic">
                {/* Price Range */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            placeholder="Min"
                            value={filters.minPrice || ''}
                            onChange={e => onFiltersChange({ minPrice: Number(e.target.value) || undefined })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={filters.maxPrice || ''}
                            onChange={e => onFiltersChange({ maxPrice: Number(e.target.value) || undefined })}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
                        />
                    </div>
                </div>

                {/* Rating Filter */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Rating</label>
                    <div className="flex gap-2">
                        {[4, 3, 2, 1].map(rating => (
                            <button
                                key={rating}
                                onClick={() => onFiltersChange({ minRating: filters.minRating === rating ? undefined : rating })}
                                className={`flex items-center gap-1 px-3 py-2 border rounded-md text-sm transition-colors ${
                                    filters.minRating === rating
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                {rating}+ <StarIcon className="h-4 w-4 text-yellow-400" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Availability Filter */}
                <div>
                    <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available On</label>
                    <input
                        id="date-filter"
                        type="date"
                        value={filters.date || ''}
                        onChange={e => onFiltersChange({ date: e.target.value || undefined })}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white text-sm"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Price Tiers" id="price">
                <div className="flex flex-wrap gap-2">
                    {PRICE_TIERS.map(tier => (
                        <button
                            key={tier}
                            onClick={() => handlePriceTierToggle(tier)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                filters.priceTiers?.includes(tier)
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {tier}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {hasLocation && (
                <FilterSection title="Distance" id="distance">
                    <div className="space-y-2">
                        {DISTANCE_OPTIONS.map(distance => (
                            <label key={distance} className="flex items-center">
                                <input
                                    type="radio"
                                    name="distance"
                                    checked={filters.maxDistance === distance}
                                    onChange={() => onFiltersChange({ maxDistance: distance })}
                                    className="mr-2 text-indigo-600"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Within {distance} mile{distance !== 1 ? 's' : ''}
                                </span>
                            </label>
                        ))}
                        <label className="flex items-center">
                            <input
                                type="radio"
                                name="distance"
                                checked={filters.maxDistance === undefined}
                                onChange={() => onFiltersChange({ maxDistance: undefined })}
                                className="mr-2 text-indigo-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Any distance</span>
                        </label>
                    </div>
                </FilterSection>
            )}

            <FilterSection title="Amenities" id="amenities">
                <div className="grid grid-cols-1 gap-2">
                    {AMENITIES.map(amenity => (
                        <label key={amenity} className="flex items-center">
                            <input
                                type="checkbox"
                                checked={filters.amenities?.includes(amenity) || false}
                                onChange={() => handleAmenityToggle(amenity)}
                                className="mr-3 rounded text-indigo-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                <span className="mr-2">{getAmenityIcon(amenity)}</span>
                                {getAmenityLabel(amenity)}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Quick Filters" id="quick">
                <div className="space-y-3">
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={filters.isOpenNow || false}
                            onChange={(e) => onFiltersChange({ isOpenNow: e.target.checked || undefined })}
                            className="mr-3 rounded text-indigo-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Open now</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            checked={filters.hasAvailability || false}
                            onChange={(e) => onFiltersChange({ hasAvailability: e.target.checked || undefined })}
                            className="mr-3 rounded text-indigo-600"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Has availability today</span>
                    </label>
                </div>
            </FilterSection>
        </div>
    );
};

export default SearchFiltersComponent;