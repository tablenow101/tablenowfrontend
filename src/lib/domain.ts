/**
 * Utility to detect which domain the app is running on
 * and serve different content accordingly
 */

export const isDomainMarketingSite = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // Marketing domain: tablenow.io or www.tablenow.io (root domain)
  // App domain: app.tablenow.io or localhost

  // Check if it's the marketing domain (tablenow.io or www.tablenow.io)
  // but NOT app.tablenow.io
  const isAppSubdomain = hostname.startsWith('app.');
  const isRootOrWWW = hostname === 'tablenow.io' || hostname === 'www.tablenow.io';

  return isRootOrWWW && !isAppSubdomain;
};

export const isAppDomain = (): boolean => {
  return !isDomainMarketingSite();
};
