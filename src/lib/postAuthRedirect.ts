export interface AuthUser {
  slug?: string;
  [key: string]: unknown;
}

export function getPostAuthRedirect(restaurant: AuthUser | null): string {
  if (!restaurant) return '/login';
  const restaurantSlug = restaurant.slug;
  if (restaurantSlug) return `/r/${restaurantSlug}/dashboard`;
  return '/dashboard';
}
