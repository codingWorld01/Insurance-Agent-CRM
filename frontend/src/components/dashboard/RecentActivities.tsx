'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivitiesProps {
  activities: Activity[] | null;
  isLoading: boolean;
}

export default function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (isLoading) {
    return (
      <Card role="status" aria-label="Loading recent activities">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 animate-pulse" aria-hidden="true"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-20" aria-hidden="true"></div>
                </div>
              </div>
            ))}
          </div>
          <span className="sr-only">Loading recent activities...</span>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card role="region" aria-labelledby="activities-title">
        <CardHeader>
          <CardTitle id="activities-title">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500" role="status">
            No recent activities
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card role="region" aria-labelledby="activities-title">
      <CardHeader>
        <CardTitle id="activities-title">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="list" aria-label="Recent activities list">
          {activities.map((activity, index) => (
            <div 
              key={activity.id} 
              className="flex items-start space-x-3"
              role="listitem"
              aria-label={`Activity ${index + 1}: ${activity.description}, ${formatRelativeTime(activity.createdAt)}`}
            >
              <div 
                className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" 
                aria-hidden="true"
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 break-words">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  <time dateTime={activity.createdAt}>
                    {formatRelativeTime(activity.createdAt)}
                  </time>
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}