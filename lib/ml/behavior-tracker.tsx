// User Behavior Tracking Component for ML Engine
// Tracks user interactions for machine learning analysis

"use client";

import { useEffect, useRef, useCallback } from 'react';
import { mlEngine } from './ml-engine';
import { useAuth } from '@/lib/contexts/AuthContext';

type UserBehaviorData = {
  userId: string;
  timestamp: number;
  action: 'view' | 'click' | 'hover' | 'scroll' | 'filter' | 'search';
  targetType: 'destination' | 'hotel' | 'activity' | 'budget' | 'route' | 'preference';
  targetId: string;
  targetData?: {
    category?: string;
    price?: number;
    rating?: number;
    duration?: number;
    location?: string;
    tags?: string[];
  };
  sessionId: string;
  timeSpent?: number;
  deviceInfo?: {
    type: 'desktop' | 'mobile' | 'tablet';
    screenWidth: number;
  };
};

interface BehaviorTrackerProps {
  children: React.ReactNode;
  targetType?: UserBehaviorData['targetType'];
  targetId?: string;
  targetData?: UserBehaviorData['targetData'];
}

export function BehaviorTracker({ 
  children, 
  targetType, 
  targetId, 
  targetData 
}: BehaviorTrackerProps) {
  const { user } = useAuth();
  const elementRef = useRef<HTMLDivElement>(null);
  const sessionStartTime = useRef<number>(Date.now());
  const hoverStartTime = useRef<number | null>(null);
  const viewStartTime = useRef<number | null>(null);

  // Track view/start of interaction
  const trackView = useCallback(() => {
    if (!user) return;
    
    viewStartTime.current = Date.now();
    mlEngine.trackUserBehavior({
      userId: user.id,
      timestamp: Date.now(),
      action: 'view',
      targetType: targetType || 'destination',
      targetId: targetId || 'unknown',
      targetData,
      sessionId: getSessionId(),
      deviceInfo: {
        type: getDeviceType(),
        screenWidth: window.innerWidth
      }
    });
  }, [user, targetType, targetId, targetData]);

  // Track hover interactions
  const trackHover = useCallback(() => {
    if (!user || !viewStartTime.current) return;
    
    hoverStartTime.current = Date.now();
    
    mlEngine.trackUserBehavior({
      userId: user.id,
      timestamp: Date.now(),
      action: 'hover',
      targetType: targetType || 'destination',
      targetId: targetId || 'unknown',
      targetData,
      sessionId: getSessionId(),
      timeSpent: Date.now() - viewStartTime.current,
      deviceInfo: {
        type: getDeviceType(),
        screenWidth: window.innerWidth
      }
    });
  }, [user, targetType, targetId, targetData]);

  // Track click interactions
  const trackClick = useCallback(() => {
    if (!user) return;
    
    const timeSpent = viewStartTime.current ? Date.now() - viewStartTime.current : 0;
    
    mlEngine.trackUserBehavior({
      userId: user.id,
      timestamp: Date.now(),
      action: 'click',
      targetType: targetType || 'destination',
      targetId: targetId || 'unknown',
      targetData,
      sessionId: getSessionId(),
      timeSpent,
      deviceInfo: {
        type: getDeviceType(),
        screenWidth: window.innerWidth
      }
    });
  }, [user, targetType, targetId, targetData]);

  // Setup event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mouseenter', trackView);
    element.addEventListener('mouseleave', () => {
      if (hoverStartTime.current) {
        const hoverTime = Date.now() - hoverStartTime.current;
        hoverStartTime.current = null;
      }
    });
    
    element.addEventListener('click', trackClick);

    // Cleanup
    return () => {
      element.removeEventListener('mouseenter', trackView);
      element.removeEventListener('click', trackClick);
    };
  }, [trackView, trackClick]);

  // Track when component mounts
  useEffect(() => {
    if (elementRef.current) {
      trackView();
    }
  }, [trackView]);

  return (
    <div ref={elementRef} className="behavior-tracker">
      {children}
    </div>
  );
}

// Helper functions
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('jatour_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('jatour_session_id', sessionId);
  }
  return sessionId;
}

function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

// Hook for manual behavior tracking
export function useBehaviorTracking() {
  const { user } = useAuth();

  const trackInteraction = useCallback((
    action: UserBehaviorData['action'],
    targetType: UserBehaviorData['targetType'],
    targetId: string,
    targetData?: UserBehaviorData['targetData']
  ) => {
    if (!user) return;

    mlEngine.trackUserBehavior({
      userId: user.id,
      timestamp: Date.now(),
      action,
      targetType,
      targetId,
      targetData,
      sessionId: getSessionId(),
      deviceInfo: {
        type: getDeviceType(),
        screenWidth: window.innerWidth
      }
    });
  }, [user]);

  const trackFilterUsage = useCallback((filterType: string, filterValue: string) => {
    if (!user) return;

    mlEngine.trackUserBehavior({
      userId: user.id,
      timestamp: Date.now(),
      action: 'filter',
      targetType: 'preference',
      targetId: filterType,
      targetData: { category: filterValue },
      sessionId: getSessionId(),
      deviceInfo: {
        type: getDeviceType(),
        screenWidth: window.innerWidth
      }
    });
  }, [user]);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    if (!user) return;

    mlEngine.trackUserBehavior({
      userId: user.id,
      timestamp: Date.now(),
      action: 'search',
      targetType: 'preference',
      targetId: 'search_query',
      targetData: { category: query, price: resultsCount },
      sessionId: getSessionId(),
      deviceInfo: {
        type: getDeviceType(),
        screenWidth: window.innerWidth
      }
    });
  }, [user]);

  return {
    trackInteraction,
    trackFilterUsage,
    trackSearch
  };
}
