'use client';

import {useEffect} from 'react';

// Loads console interception script from console-bridge-server sidecar
export function ConsoleBridge() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if ((window as any).__CONSOLE_BRIDGE_LOADED__) {
      return;
    }

    if ((window as any).__CONSOLE_BRIDGE_EXTENSION_ACTIVE__) {
      console.log('[Console Bridge] Extension detected, component disabled');
      return;
    }

    const script = document.createElement('script');
    script.src = '/api/console-bridge-script';
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onerror = () => {
      console.warn(
        '[Console Bridge] Failed to load script from sidecar. Is nest-dev running?',
      );
    };

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
