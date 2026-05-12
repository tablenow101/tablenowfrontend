import { AuthUser } from '../context/authContext';

export function getPostAuthRedirect(user: AuthUser | null): string {
  if (!user) return '/login';

  const slug = user.slug || user.id;
  if (slug && slug !== user.id) {
    return `/r/${slug}/dashboard`;
  }

  return '/setup/restaurant';
}
