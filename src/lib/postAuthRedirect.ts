import { AuthUser } from '../context/authContext';

export function getPostAuthRedirect(restaurant: AuthUser | null): string {
  if (!restaurant) return '/login';

  const restaurantSlug = restaurant.slug;
  if (restaurantSlug) {
    return `/r/${restaurantSlug}/dashboard`;
  }

  return '/setup/restaurant';
}
