type ClerkLikeError = {
  longMessage?: string;
  message?: string;
};

export function clerkErrorMessage(
  error: ClerkLikeError | null | undefined,
  fallback: string,
): string {
  if (!error) return fallback;
  return error.longMessage ?? error.message ?? fallback;
}