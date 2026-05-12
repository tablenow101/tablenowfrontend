import { AuthUser } from '../context/authContext';

export function getPostAuthRedirect(user: AuthUser | null): string {
  if (!user) return '/login';

  const slug = user.slug || user.id;
  const hasRestaurant = !!slug && slug !== user.id;
  const setupComplete = user.setup_complete === true;
  const hasOpeningHours = user.opening_hours &&
    typeof user.opening_hours === 'object' &&
    Object.keys(user.opening_hours).length > 0;

  if (hasRestaurant && setupComplete && hasOpeningHours) {
    return `/r/${slug}/dashboard`;
  }

  return '/setup/restaurant';
}
