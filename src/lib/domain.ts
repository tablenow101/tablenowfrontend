/**
 * Utility to detect which domain the app is running on
 * and serve different content accordingly
 */

export const isDomainMarketingSite = (): boolean => {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;

  // Marketing domain: tablenow.io (root domain only, not subdomains)
  // App domain: app.tablenow.io or localhost

  return hostname === 'tablenow.io';
};

export const isAppDomain = (): boolean => {
  return !isDomainMarketingSite();
};
