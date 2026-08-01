import { useRef, useCallback } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useUIStore } from '../stores/ui-store';

export function useScrollTabBar() {
  const lastScrollY = useRef<number>(0);
  const idleTimerRef = useRef<any>(null);
  const lastVisibilityDispatch = useRef<number>(0);
  const lastVisibility = useRef<boolean>(true);
  const setTabBarVisible = useUIStore((s) => s.setTabBarVisible);

  const dispatchVisibility = useCallback((next: boolean) => {
    // Skip if state hasn't changed — avoids re-renders on every scroll event
    if (lastVisibility.current === next) return;
    lastVisibility.current = next;
    lastVisibilityDispatch.current = Date.now();
    setTabBarVisible(next);
  }, [setTabBarVisible]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    // 1. Auto-show timer (300ms idle stop)
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      dispatchVisibility(true);
    }, 300);

    // 2. Scroll DOWN -> Hide (diff > 8 and scrolled past 40px)
    if (diff > 8 && currentY > 40) {
      dispatchVisibility(false);
    }
    // 3. Scroll UP -> Show (diff < -8)
    else if (diff < -8) {
      dispatchVisibility(true);
    }

    lastScrollY.current = currentY;
  }, [dispatchVisibility]);

  const onTouchStart = useCallback(() => {
    // Show immediately when user touches screen
    dispatchVisibility(true);
  }, [dispatchVisibility]);

  return { onScroll, onTouchStart };
}
