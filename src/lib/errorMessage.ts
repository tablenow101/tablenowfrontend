// Coerce any API / thrown error into a human-readable string for rendering.
//
// The backend is not uniform about error shape:
//   • route-level errors return  { error: "some string" }
//   • the unified error handler returns { error: { code, message, correlationId } }
//   • the 404 handler returns      { error: { code, message } }
//
// Rendering any of the object shapes directly as a React child throws
// "Objects are not valid as a React child" (minified React error #31). This
// helper always returns a string, so error state can be rendered safely.
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;

  // Shape: { error: ... }
  const errorField = (data as { error?: unknown })?.error;
  if (typeof errorField === 'string' && errorField.trim()) return errorField;
  if (errorField && typeof errorField === 'object') {
    const msg = (errorField as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }

  // Shape: { message: "..." } at the top level
  const topMessage = (data as { message?: unknown })?.message;
  if (typeof topMessage === 'string' && topMessage.trim()) return topMessage;

  // Native Error (e.g. network failure) — message only, never the object.
  if (err instanceof Error && err.message) return err.message;

  return fallback;
}
