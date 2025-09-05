import React, { useState, useEffect, useRef } from 'react';
import { SearchIcon, MapPinIcon, ClockIcon } from './Icons';

interface SearchSuggestion {
    id: string;
    text: string;
    type: 'service' | 'location' | 'recent';
    icon?: React.ReactNode;
}

interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'service' | 'location';
    onFocus?: () => void;
    onBlur?: () => void;
    className?: string;
    suggestions?: SearchSuggestion[];
    showSuggestions?: boolean;
    onSuggestionClick?: (suggestion: SearchSuggestion) => void;
}

const DEFAULT_SERVICE_SUGGESTIONS: SearchSuggestion[] = [
    { id: '1', text: 'Haircut', type: 'service' },
    { id: '2', text: 'Hair coloring', type: 'service' },
    { id: '3', text: 'Manicure', type: 'service' },
    { id: '4', text: 'Pedicure', type: 'service' },
    { id: '5', text: 'Massage therapy', type: 'service' },
    { id: '6', text: 'Facial treatment', type: 'service' },
    { id: '7', text: 'Eyebrow shaping', type: 'service' },
    { id: '8', text: 'Beard trim', type: 'service' },
    { id: '9', text: 'Hair styling', type: 'service' },
    { id: '10', text: 'Blowout', type: 'service' },
];

const DEFAULT_LOCATION_SUGGESTIONS: SearchSuggestion[] = [
    { id: '1', text: 'New York, NY', type: 'location' },
    { id: '2', text: 'Los Angeles, CA', type: 'location' },
    { id: '3', text: 'Chicago, IL', type: 'location' },
    { id: '4', text: 'Houston, TX', type: 'location' },
    { id: '5', text: 'Phoenix, AZ', type: 'location' },
    { id: '6', text: 'Philadelphia, PA', type: 'location' },
    { id: '7', text: 'San Antonio, TX', type: 'location' },
    { id: '8', text: 'San Diego, CA', type: 'location' },
    { id: '9', text: 'Dallas, TX', type: 'location' },
    { id: '10', text: 'San Jose, CA', type: 'location' },
];

const SearchInput: React.FC<SearchInputProps> = ({
    value,
    onChange,
    placeholder = 'Search...',
    type = 'service',
    onFocus,
    onBlur,
    className = '',
    suggestions,
    showSuggestions = false,
    onSuggestionClick
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<SearchSuggestion[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const defaultSuggestions = type === 'service' ? DEFAULT_SERVICE_SUGGESTIONS : DEFAULT_LOCATION_SUGGESTIONS;
    const allSuggestions = suggestions || defaultSuggestions;

    useEffect(() => {
        if (value.trim() === '') {
            setFilteredSuggestions(allSuggestions.slice(0, 8));
        } else {
            const filtered = allSuggestions.filter(suggestion =>
                suggestion.text.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 8);
            setFilteredSuggestions(filtered);
        }
        setSelectedIndex(-1);
    }, [value, allSuggestions]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Delay hiding suggestions to allow for clicks
        setTimeout(() => {
            if (!e.currentTarget.contains(document.activeElement)) {
                setIsFocused(false);
                setSelectedIndex(-1);
                onBlur?.();
            }
        }, 150);
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        onChange(suggestion.text);
        setIsFocused(false);
        setSelectedIndex(-1);
        onSuggestionClick?.(suggestion);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isFocused || filteredSuggestions.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => 
                    prev < filteredSuggestions.length - 1 ? prev + 1 : -1
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > -1 ? prev - 1 : filteredSuggestions.length - 1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
                    handleSuggestionClick(filteredSuggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsFocused(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    // Get recent searches from localStorage
    const getRecentSearches = (): SearchSuggestion[] => {
        try {
            const recent = localStorage.getItem(`recent_${type}_searches`);
            if (recent) {
                return JSON.parse(recent).map((text: string, index: number) => ({
                    id: `recent_${index}`,
                    text,
                    type: 'recent' as const
                }));
            }
        } catch (error) {
            console.error('Error loading recent searches:', error);
        }
        return [];
    };

    // Save to recent searches
    const saveToRecentSearches = (searchText: string) => {
        if (!searchText.trim()) return;
        
        try {
            const recent = getRecentSearches().map(s => s.text);
            const updated = [searchText, ...recent.filter(r => r !== searchText)].slice(0, 5);
            localStorage.setItem(`recent_${type}_searches`, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving recent searches:', error);
        }
    };

    useEffect(() => {
        if (value && !isFocused) {
            saveToRecentSearches(value);
        }
    }, [value, isFocused, type]);

    const shouldShowSuggestions = (isFocused || showSuggestions) && filteredSuggestions.length > 0;
    const recentSearches = getRecentSearches();

    return (
        <div className={`relative ${className}`} onBlur={handleBlur}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    className="w-full border-0 bg-transparent py-2.5 px-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                    placeholder={placeholder}
                    autoComplete="off"
                />
            </div>

            {shouldShowSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {recentSearches.length > 0 && value.trim() === '' && (
                        <>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                                Recent Searches
                            </div>
                            {recentSearches.slice(0, 3).map((suggestion, index) => (
                                <button
                                    key={suggestion.id}
                                    ref={el => suggestionRefs.current[index] = el}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm ${
                                        selectedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''
                                    }`}
                                >
                                    <ClockIcon className="h-4 w-4 text-gray-400" />
                                    <span>{suggestion.text}</span>
                                </button>
                            ))}
                            {filteredSuggestions.length > 0 && (
                                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600 border-t">
                                    Suggestions
                                </div>
                            )}
                        </>
                    )}

                    {filteredSuggestions.map((suggestion, index) => {
                        const adjustedIndex = value.trim() === '' ? index + recentSearches.length : index;
                        return (
                            <button
                                key={suggestion.id}
                                ref={el => suggestionRefs.current[adjustedIndex] = el}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm ${
                                    selectedIndex === adjustedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                                }`}
                            >
                                {type === 'service' ? (
                                    <SearchIcon className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <MapPinIcon className="h-4 w-4 text-gray-400" />
                                )}
                                <span>{suggestion.text}</span>
                            </button>
                        );
                    })}

                    {filteredSuggestions.length === 0 && value.trim() !== '' && (
                        <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            No suggestions found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchInput;