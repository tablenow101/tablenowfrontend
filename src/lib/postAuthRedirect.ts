export interface AuthUser {
  slug?: string;
  address?: string;
  phone?: string;
  owner_name?: string;
  name?: string;
  [key: string]: unknown;
}

export function isRestaurantProfileComplete(restaurant: AuthUser | null | undefined): boolean {
  if (!restaurant) return false;
  return !!(restaurant.name && restaurant.owner_name && restaurant.address && restaurant.phone);
}

export function getPostAuthRedirect(
  restaurant: AuthUser | null,
  options?: { isNewUser?: boolean; needsOnboarding?: boolean }
): string {
  if (!restaurant) return '/dashboard';

  const needsOnboarding =
    options?.needsOnboarding ??
    options?.isNewUser ??
    !isRestaurantProfileComplete(restaurant);

  if (needsOnboarding) return '/register?onboarding=1';

  const restaurantSlug = restaurant.slug;
  if (restaurantSlug) return `/r/${restaurantSlug}/dashboard`;
  return '/dashboard';
}

export function getOnboardingRedirect(restaurant: AuthUser | null | undefined): string | null {
  if (!restaurant?.id) return null;
  if (!isRestaurantProfileComplete(restaurant)) return '/register?onboarding=1';
  return null;
}
