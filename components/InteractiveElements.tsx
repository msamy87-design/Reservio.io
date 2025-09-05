import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicBusinessProfile } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, MapIcon, ListBulletIcon, StarIcon, MapPinIcon, ClockIcon, PhoneIcon, PlayIcon } from './Icons';
import BusinessCard from './BusinessCard';

// Mock data for carousel
const mockFeaturedCarousel = [
    {
        id: '1',
        title: 'Weekend Special: 25% Off Spa Treatments',
        description: 'Relax and rejuvenate with our premium spa services',
        image: '/images/spa-treatment.jpg',
        cta_text: 'Book Spa Day',
        cta_link: '/search?service=spa',
        badge: 'Limited Time'
    },
    {
        id: '2',
        title: 'New: Express Hair Services',
        description: 'Quick touch-ups and styling in 30 minutes or less',
        image: '/images/quick-hair.jpg',
        cta_text: 'Find Quick Cuts',
        cta_link: '/search?service=express haircut',
        badge: 'New Service'
    },
    {
        id: '3',
        title: 'Bridal Beauty Packages',
        description: 'Complete wedding day beauty with trial sessions',
        image: '/images/bridal-beauty.jpg',
        cta_text: 'Plan Wedding Look',
        cta_link: '/search?service=bridal',
        badge: 'Popular'
    }
];

const mockBusinessCarousel: PublicBusinessProfile[] = [
    {
        id: '1',
        name: 'Luxe Hair Studio',
        description: 'Premium hair styling and color services',
        address: '123 Fashion Ave, New York, NY',
        phone: '(555) 123-4567',
        email: 'info@luxehair.com',
        website: 'https://luxehair.com',
        rating: 4.9,
        review_count: 248,
        image_url: '/images/luxe-hair.jpg',
        business_hours: {} as any,
        services: [],
        staff: [],
        price_tier: '$$' as any,
        amenities: ['wifi', 'parking'] as any,
        latitude: 40.7589,
        longitude: -73.9851,
        distance_miles: 0.3,
        next_available_slot: 'Today 2:00 PM',
        popular_services: ['Balayage', 'Haircut', 'Blowout']
    },
    {
        id: '2',
        name: 'Serenity Day Spa',
        description: 'Full-service spa and wellness center',
        address: '456 Wellness Blvd, New York, NY',
        phone: '(555) 987-6543',
        email: 'hello@serenityspa.com',
        website: 'https://serenityspa.com',
        rating: 4.8,
        review_count: 189,
        image_url: '/images/serenity-spa.jpg',
        business_hours: {} as any,
        services: [],
        staff: [],
        price_tier: '$$$' as any,
        amenities: ['wifi', 'parking', 'wheelchair_accessible'] as any,
        latitude: 40.7614,
        longitude: -73.9776,
        distance_miles: 0.8,
        next_available_slot: 'Tomorrow 10:00 AM',
        popular_services: ['Massage', 'Facial', 'Body Treatment']
    },
    {
        id: '3',
        name: 'Perfect Nails Boutique',
        description: 'Artisan nail care and creative nail art',
        address: '789 Style St, New York, NY',
        phone: '(555) 456-7890',
        email: 'art@perfectnails.com',
        website: 'https://perfectnails.com',
        rating: 4.7,
        review_count: 156,
        image_url: '/images/perfect-nails.jpg',
        business_hours: {} as any,
        services: [],
        staff: [],
        price_tier: '$' as any,
        amenities: ['wifi', 'walk_ins'] as any,
        latitude: 40.7505,
        longitude: -73.9934,
        distance_miles: 1.2,
        next_available_slot: 'This Evening 6:00 PM',
        popular_services: ['Gel Manicure', 'Nail Art', 'Pedicure']
    }
];

interface CarouselSlide {
    id: string;
    title: string;
    description: string;
    image: string;
    cta_text: string;
    cta_link: string;
    badge?: string;
}

interface HeroCarouselProps {
    slides: CarouselSlide[];
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ slides }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const navigate = useNavigate();
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, slides.length]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const goToPrevious = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const goToNext = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            {/* Slides */}
            <div className="relative h-full">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-500 ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700">
                            <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative z-10 h-full flex items-center">
                            <div className="container mx-auto px-6 text-center text-white">
                                {slide.badge && (
                                    <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-semibold mb-4">
                                        {slide.badge}
                                    </div>
                                )}
                                
                                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                                    {slide.title}
                                </h1>
                                <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                                    {slide.description}
                                </p>
                                
                                <button
                                    onClick={() => navigate(slide.cta_link)}
                                    className="bg-white text-indigo-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
                                >
                                    {slide.cta_text}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-colors"
            >
                <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>
            
            <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-colors"
            >
                <ChevronRightIcon className="h-6 w-6 text-white" />
            </button>

            {/* Play/Pause Button */}
            <button
                onClick={togglePlayPause}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-2 transition-colors"
            >
                <PlayIcon className={`h-5 w-5 text-white ${isPlaying ? 'rotate-90' : ''} transition-transform`} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                            index === currentSlide ? 'bg-white' : 'bg-white/50'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

interface BusinessCarouselProps {
    businesses: PublicBusinessProfile[];
    title: string;
}

const BusinessCarousel: React.FC<BusinessCarouselProps> = ({ businesses, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(3);
    const carouselRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setItemsPerView(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerView(2);
            } else {
                setItemsPerView(3);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = Math.max(0, businesses.length - itemsPerView);

    const goToPrevious = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        carouselRef.current?.setAttribute('data-start-x', touch.clientX.toString());
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const touch = e.changedTouches[0];
        const startX = parseFloat(carouselRef.current?.getAttribute('data-start-x') || '0');
        const endX = touch.clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goToNext();
            } else {
                goToPrevious();
            }
        }
    }, []);

    return (
        <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h3>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevious}
                        disabled={currentIndex === 0}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    <button
                        onClick={goToNext}
                        disabled={currentIndex === maxIndex}
                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>
            
            <div
                ref={carouselRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="overflow-hidden"
            >
                <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                        width: `${(businesses.length / itemsPerView) * 100}%`
                    }}
                >
                    {businesses.map((business) => (
                        <div
                            key={business.id}
                            className="flex-shrink-0 px-3"
                            style={{ width: `${100 / businesses.length}%` }}
                        >
                            <BusinessCard
                                business={business}
                                showActions={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentIndex 
                                ? 'bg-indigo-600 dark:bg-indigo-400' 
                                : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
};

interface InteractiveMapProps {
    businesses: PublicBusinessProfile[];
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ businesses }) => {
    const [selectedBusiness, setSelectedBusiness] = useState<PublicBusinessProfile | null>(null);
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
    const navigate = useNavigate();

    const handleBusinessClick = (business: PublicBusinessProfile) => {
        setSelectedBusiness(business);
    };

    const handleBookNow = (business: PublicBusinessProfile) => {
        navigate(`/business/${business.id}`);
    };

    return (
        <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Explore Nearby
                </h3>
                
                <div className="inline-flex rounded-lg shadow-sm">
                    <button
                        onClick={() => setViewMode('map')}
                        className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                            viewMode === 'map'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                    >
                        <MapIcon className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-b border-r ${
                            viewMode === 'list'
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                    >
                        <ListBulletIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
            
            {viewMode === 'map' ? (
                <div className="relative">
                    {/* Map Container */}
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                        {/* Mock Map Interface */}
                        <div className="h-full flex items-center justify-center relative">
                            <div className="text-center">
                                <MapIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Interactive map would be integrated here
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    (Google Maps, Mapbox, or similar service)
                                </p>
                            </div>
                            
                            {/* Mock Map Pins */}
                            {businesses.slice(0, 3).map((business, index) => (
                                <button
                                    key={business.id}
                                    onClick={() => handleBusinessClick(business)}
                                    className={`absolute w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors ${
                                        index === 0 ? 'top-1/3 left-1/3' :
                                        index === 1 ? 'top-1/2 right-1/3' :
                                        'bottom-1/3 left-1/2'
                                    }`}
                                >
                                    <MapPinIcon className="h-4 w-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Selected Business Info */}
                    {selectedBusiness && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold">
                                    {selectedBusiness.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {selectedBusiness.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {selectedBusiness.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        <div className="flex items-center gap-1">
                                            <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                                            <span>{selectedBusiness.rating}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                            <MapPinIcon className="h-4 w-4" />
                                            <span>{selectedBusiness.distance_miles} mi</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                            <ClockIcon className="h-4 w-4" />
                                            <span>{selectedBusiness.next_available_slot}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleBookNow(selectedBusiness)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                        >
                                            Book Now
                                        </button>
                                        <a
                                            href={`tel:${selectedBusiness.phone}`}
                                            className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
                                        >
                                            <PhoneIcon className="h-4 w-4" />
                                            Call
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* List View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map((business) => (
                        <BusinessCard
                            key={business.id}
                            business={business}
                            showActions={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const InteractiveElements: React.FC = () => {
    const [featuredSlides] = useState<CarouselSlide[]>(mockFeaturedCarousel);
    const [featuredBusinesses] = useState<PublicBusinessProfile[]>(mockBusinessCarousel);

    return (
        <div className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Carousel */}
                <div className="mb-16">
                    <HeroCarousel slides={featuredSlides} />
                </div>

                {/* Business Carousel */}
                <BusinessCarousel
                    businesses={featuredBusinesses}
                    title="Trending This Week"
                />

                {/* Interactive Map */}
                <InteractiveMap businesses={featuredBusinesses} />
            </div>
        </div>
    );
};

export default InteractiveElements;