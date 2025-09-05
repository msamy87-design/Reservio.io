import React, { useState, useEffect, useCallback } from 'react';
import { 
    MapPinIcon, 
    ClockIcon, 
    BellIcon, 
    DevicePhoneMobileIcon,
    WifiIcon,
    ChatBubbleBottomCenterTextIcon,
    CalendarIcon,
    CameraIcon,
    QrCodeIcon,
    BoltIcon,
    GlobeAltIcon,
    CpuChipIcon,
    SparklesIcon,
    ShieldCheckIcon
} from './Icons';

interface SmartFeature {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    status: 'active' | 'available' | 'coming_soon';
    category: 'location' | 'booking' | 'communication' | 'ai' | 'security';
}

interface LiveUpdate {
    id: string;
    type: 'booking' | 'cancellation' | 'new_business' | 'offer';
    message: string;
    timestamp: Date;
    location?: string;
}

const SmartFeatures: React.FC = () => {
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
    const [realTimeBookings, setRealTimeBookings] = useState(0);
    const [nearbyBusinesses, setNearbyBusinesses] = useState(0);
    const [avgResponseTime, setAvgResponseTime] = useState('< 2 min');

    const smartFeatures: SmartFeature[] = [
        {
            id: '1',
            title: 'Smart Location Detection',
            description: 'Automatically find the best services near your current location',
            icon: MapPinIcon,
            status: 'active',
            category: 'location'
        },
        {
            id: '2',
            title: 'Real-time Availability',
            description: 'See live availability updates and book instantly',
            icon: ClockIcon,
            status: 'active',
            category: 'booking'
        },
        {
            id: '3',
            title: 'Smart Notifications',
            description: 'Get timely reminders and updates about your appointments',
            icon: BellIcon,
            status: 'active',
            category: 'communication'
        },
        {
            id: '4',
            title: 'Mobile-First Experience',
            description: 'Optimized for seamless mobile booking and management',
            icon: DevicePhoneMobileIcon,
            status: 'active',
            category: 'booking'
        },
        {
            id: '5',
            title: 'Offline Capabilities',
            description: 'View your bookings and business info even without internet',
            icon: WifiIcon,
            status: 'available',
            category: 'booking'
        },
        {
            id: '6',
            title: 'AI Chat Assistant',
            description: 'Get instant answers about services, pricing, and availability',
            icon: ChatBubbleBottomCenterTextIcon,
            status: 'coming_soon',
            category: 'ai'
        },
        {
            id: '7',
            title: 'Smart Calendar Sync',
            description: 'Automatically sync appointments with your device calendar',
            icon: CalendarIcon,
            status: 'active',
            category: 'booking'
        },
        {
            id: '8',
            title: 'Visual Search',
            description: 'Upload photos to find similar styles and services',
            icon: CameraIcon,
            status: 'coming_soon',
            category: 'ai'
        },
        {
            id: '9',
            title: 'QR Code Check-in',
            description: 'Contactless check-in at your appointment location',
            icon: QrCodeIcon,
            status: 'available',
            category: 'booking'
        },
        {
            id: '10',
            title: 'Instant Recommendations',
            description: 'AI-powered suggestions based on your preferences',
            icon: BoltIcon,
            status: 'active',
            category: 'ai'
        },
        {
            id: '11',
            title: 'Multi-language Support',
            description: 'Available in 12+ languages for global accessibility',
            icon: GlobeAltIcon,
            status: 'active',
            category: 'communication'
        },
        {
            id: '12',
            title: 'Advanced Security',
            description: 'Enterprise-grade security for all your personal data',
            icon: ShieldCheckIcon,
            status: 'active',
            category: 'security'
        }
    ];

    useEffect(() => {
        // Request geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationPermission('granted');
                    setNearbyBusinesses(Math.floor(Math.random() * 50) + 20);
                },
                () => {
                    setLocationPermission('denied');
                }
            );
        }

        // Simulate live updates
        const updateInterval = setInterval(() => {
            const updates: LiveUpdate[] = [
                {
                    id: Date.now().toString(),
                    type: 'booking',
                    message: 'New appointment booked at StyleCut Salon',
                    timestamp: new Date(),
                    location: 'Downtown'
                },
                {
                    id: (Date.now() + 1).toString(),
                    type: 'offer',
                    message: '20% off massage therapy this weekend',
                    timestamp: new Date(),
                    location: 'Spa Bliss'
                },
                {
                    id: (Date.now() + 2).toString(),
                    type: 'new_business',
                    message: 'New business: Elite Barbershop just joined',
                    timestamp: new Date(),
                    location: 'Midtown'
                }
            ];

            setLiveUpdates(prev => [...updates, ...prev].slice(0, 10));
        }, 8000);

        // Simulate real-time booking counter
        const bookingInterval = setInterval(() => {
            setRealTimeBookings(prev => prev + Math.floor(Math.random() * 3) + 1);
        }, 5000);

        return () => {
            clearInterval(updateInterval);
            clearInterval(bookingInterval);
        };
    }, []);

    const requestLocation = useCallback(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLocationPermission('granted');
                    setNearbyBusinesses(Math.floor(Math.random() * 50) + 20);
                },
                () => {
                    setLocationPermission('denied');
                }
            );
        }
    }, []);

    const getFeatureStatusColor = (status: SmartFeature['status']) => {
        switch (status) {
            case 'active': return 'text-green-600 dark:text-green-400';
            case 'available': return 'text-blue-600 dark:text-blue-400';
            case 'coming_soon': return 'text-orange-600 dark:text-orange-400';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getFeatureStatusBadge = (status: SmartFeature['status']) => {
        switch (status) {
            case 'active': 
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Active</span>;
            case 'available': 
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Available</span>;
            case 'coming_soon': 
                return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">Coming Soon</span>;
        }
    };

    const getCategoryIcon = (category: SmartFeature['category']) => {
        switch (category) {
            case 'location': return MapPinIcon;
            case 'booking': return CalendarIcon;
            case 'communication': return ChatBubbleBottomCenterTextIcon;
            case 'ai': return CpuChipIcon;
            case 'security': return ShieldCheckIcon;
            default: return SparklesIcon;
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 py-16 sm:py-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mb-6">
                        <SparklesIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Smart Features & Real-time Updates
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Experience the future of beauty and wellness booking with our AI-powered platform
                    </p>
                </div>

                {/* Real-time Stats */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <BoltIcon className="h-8 w-8 text-yellow-500" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {realTimeBookings.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Bookings today
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <MapPinIcon className="h-8 w-8 text-indigo-500" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {nearbyBusinesses}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Nearby businesses
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <ClockIcon className="h-8 w-8 text-green-500" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {avgResponseTime}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Avg response time
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <ShieldCheckIcon className="h-8 w-8 text-purple-500" />
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    99.9%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Uptime reliability
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Services */}
                {locationPermission === 'prompt' && (
                    <div className="mt-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-8 text-center">
                        <MapPinIcon className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Enable Location Services
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Get personalized recommendations and find businesses near you
                        </p>
                        <button
                            onClick={requestLocation}
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <MapPinIcon className="h-5 w-5 mr-2" />
                            Enable Location
                        </button>
                    </div>
                )}

                {locationPermission === 'granted' && (
                    <div className="mt-12 bg-green-50 dark:bg-green-900/20 rounded-2xl p-8 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <MapPinIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                            <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                Location services active
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            We found {nearbyBusinesses} businesses near your location
                        </p>
                    </div>
                )}

                {/* Live Updates Feed */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                            Smart Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {smartFeatures.map((feature) => {
                                const CategoryIcon = getCategoryIcon(feature.category);
                                return (
                                    <div
                                        key={feature.id}
                                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                                    <feature.icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                                </div>
                                                <CategoryIcon className="h-4 w-4 text-gray-400 ml-2" />
                                            </div>
                                            {getFeatureStatusBadge(feature.status)}
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                            {feature.title}
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                            Live Updates
                        </h3>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                <div className="flex items-center">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                                        Live Activity
                                    </span>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-gray-600 max-h-80 overflow-y-auto">
                                {liveUpdates.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                        <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Waiting for updates...</p>
                                    </div>
                                ) : (
                                    liveUpdates.map((update) => (
                                        <div key={update.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex items-start">
                                                <div className={`p-1 rounded-full mr-3 ${
                                                    update.type === 'booking' ? 'bg-blue-100 dark:bg-blue-900/20' :
                                                    update.type === 'offer' ? 'bg-green-100 dark:bg-green-900/20' :
                                                    'bg-purple-100 dark:bg-purple-900/20'
                                                }`}>
                                                    {update.type === 'booking' && <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                                    {update.type === 'offer' && <SparklesIcon className="h-4 w-4 text-green-600 dark:text-green-400" />}
                                                    {update.type === 'new_business' && <BoltIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900 dark:text-white">
                                                        {update.message}
                                                    </p>
                                                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <ClockIcon className="h-3 w-3 mr-1" />
                                                        {update.timestamp.toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                        {update.location && (
                                                            <>
                                                                <span className="mx-1">•</span>
                                                                <MapPinIcon className="h-3 w-3 mr-1" />
                                                                {update.location}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Assistant Preview */}
                <div className="mt-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl overflow-hidden">
                    <div className="px-8 py-12 text-center">
                        <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-full mb-6">
                            <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">
                            AI Assistant Coming Soon
                        </h3>
                        <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
                            Get instant answers, personalized recommendations, and smart booking assistance with our upcoming AI chat feature
                        </p>
                        <div className="flex items-center justify-center space-x-4">
                            <div className="flex items-center text-purple-100">
                                <CpuChipIcon className="h-5 w-5 mr-2" />
                                AI-Powered
                            </div>
                            <div className="flex items-center text-purple-100">
                                <BoltIcon className="h-5 w-5 mr-2" />
                                Instant Response
                            </div>
                            <div className="flex items-center text-purple-100">
                                <SparklesIcon className="h-5 w-5 mr-2" />
                                Personalized
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartFeatures;