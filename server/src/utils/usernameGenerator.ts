import { UserRepository } from '../repositories/user.repository';


export async function generateUniqueUsername(
  baseUsername: string,
  userRepo: UserRepository,
  maxAttempts = 100
): Promise<string> {
  // Sanitize: lowercase, keep only alphanumeric and underscore, max 30 chars
  let sanitized = baseUsername
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 30);

  // Ensure minimum length of 3 characters
  if (sanitized.length < 3) {
    sanitized = sanitized.padEnd(3, '0');
  }

  // Try base username first
  const existingUser = await userRepo.findByUsername(sanitized);
  if (!existingUser) {
    return sanitized;
  }

  // If base exists, try appending numbers
  for (let i = 2; i <= maxAttempts + 1; i++) {
    const suffix = String(i);
    const candidate = `${sanitized}${suffix}`;

    // If candidate exceeds max length, trim base to make room for suffix
    if (candidate.length > 30) {
      const trimLength = 30 - suffix.length;
      const trimmedBase = sanitized.substring(0, trimLength);
      const trimmedCandidate = `${trimmedBase}${suffix}`;

      const user = await userRepo.findByUsername(trimmedCandidate);
      if (!user) {
        return trimmedCandidate;
      }
      continue;
    }

    // Candidate fits within limit, check if available
    const user = await userRepo.findByUsername(candidate);
    if (!user) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to generate unique username from base "${baseUsername}" after ${maxAttempts} attempts`
  );
}
