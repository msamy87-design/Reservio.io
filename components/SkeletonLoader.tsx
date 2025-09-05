import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`} />
    );
};

export const BusinessCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col">
            <Skeleton className="h-48 w-full" />
            <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-4 w-4 rounded" />
                        ))}
                    </div>
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-5/6 mb-2" />
                <div className="flex gap-1 mb-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex gap-2 mt-4">
                    <Skeleton className="h-10 flex-1 rounded-md" />
                    <Skeleton className="h-10 w-12 rounded-md" />
                </div>
            </div>
        </div>
    );
};

export const SearchResultsSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Array.from({ length: count }, (_, i) => (
                <BusinessCardSkeleton key={i} />
            ))}
        </div>
    );
};

export const BusinessProfileSkeleton: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Skeleton className="h-64 sm:h-80 lg:h-96 w-full" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <Skeleton className="h-8 w-32 mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <Skeleton className="h-6 w-40 mb-2" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SkeletonTextProps {
    lines?: number;
    className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }, (_, i) => {
                const widths = ['w-full', 'w-5/6', 'w-3/4', 'w-4/5'];
                const width = widths[i % widths.length];
                return <Skeleton key={i} className={`h-4 ${width}`} />;
            })}
        </div>
    );
};

export default Skeleton;