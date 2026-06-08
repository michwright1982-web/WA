"use client";

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookSDK() {
  useEffect(() => {
    window.fbAsyncInit = function() {
      if (!process.env.NEXT_PUBLIC_META_APP_ID) {
        console.warn('NEXT_PUBLIC_META_APP_ID is not set. Facebook SDK initialization skipped.');
        return;
      }
      
      window.FB.init({
        appId            : process.env.NEXT_PUBLIC_META_APP_ID,
        autoLogAppEvents : true,
        xfbml            : true,
        version          : 'v20.0'
      });
    };
  }, []);

  return (
    <Script
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src="https://connect.facebook.net/en_US/sdk.js"
    />
  );
}
