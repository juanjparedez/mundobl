'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

type Politeness = 'polite' | 'assertive';

interface LiveRegionContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | undefined>(
  undefined
);

export function useLiveAnnouncer() {
  const ctx = useContext(LiveRegionContext);
  if (!ctx) {
    throw new Error('useLiveAnnouncer must be used within <LiveRegion>');
  }
  return ctx.announce;
}

export function LiveRegion({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timersRef = useRef<{ polite?: number; assertive?: number }>({});

  const announce = useCallback(
    (message: string, politeness: Politeness = 'polite') => {
      const setter =
        politeness === 'polite' ? setPoliteMessage : setAssertiveMessage;
      // Empty + set forces SR re-announce when message repeats.
      setter('');
      window.requestAnimationFrame(() => setter(message));

      const key = politeness;
      if (timersRef.current[key]) {
        window.clearTimeout(timersRef.current[key]);
      }
      timersRef.current[key] = window.setTimeout(() => setter(''), 1500);
    },
    []
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      if (timers.polite) window.clearTimeout(timers.polite);
      if (timers.assertive) window.clearTimeout(timers.assertive);
    };
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {politeMessage}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}
