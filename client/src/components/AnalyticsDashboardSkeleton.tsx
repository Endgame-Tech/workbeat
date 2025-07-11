import React from 'react';
import SkeletonLoader from './ui/SkeletonLoader';
import { Card, CardHeader, CardContent } from './ui/Card';

const AnalyticsDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header and Controls Skeleton */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <SkeletonLoader className="h-8 w-64 mb-2" />
          <SkeletonLoader className="h-4 w-80" />
        </div>
        <div className="flex flex-wrap gap-3">
          <SkeletonLoader className="h-10 w-40" />
          <SkeletonLoader className="h-10 w-40" />
          <SkeletonLoader className="h-10 w-24" />
        </div>
      </div>

      {/* Report Type Tabs Skeleton */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700">
        <SkeletonLoader className="h-9 w-24" />
        <SkeletonLoader className="h-9 w-32" />
        <SkeletonLoader className="h-9 w-28" />
        <SkeletonLoader className="h-9 w-36" />
      </div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <SkeletonLoader className="h-6 w-3/4 mb-2" />
            <SkeletonLoader className="h-8 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <SkeletonLoader className="h-6 w-3/4 mb-2" />
            <SkeletonLoader className="h-8 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <SkeletonLoader className="h-6 w-3/4 mb-2" />
            <SkeletonLoader className="h-8 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <SkeletonLoader className="h-6 w-3/4 mb-2" />
            <SkeletonLoader className="h-8 w-1/2" />
          </CardContent>
        </Card>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <SkeletonLoader className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <SkeletonLoader className="h-4 w-full mb-2" />
            <SkeletonLoader className="h-4 w-full mb-2" />
            <SkeletonLoader className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <SkeletonLoader className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <SkeletonLoader className="h-4 w-full mb-2" />
            <SkeletonLoader className="h-4 w-full mb-2" />
            <SkeletonLoader className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboardSkeleton;
