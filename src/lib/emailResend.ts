import { supabase } from './supabase';

/**
 * Resend email confirmation link for signup.
 * Uses the official Supabase API: auth.resend({ type: 'signup', ... })
 * The link will redirect to /auth/callback (configured in Supabase).
 */
export async function resendSignupConfirmation(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

/**
 * Resend password reset link.
 * Uses supabase.auth.resetPasswordForEmail() (correct API).
 * The link will redirect to /reset-password (configured in Supabase).
 */
export async function resendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}
