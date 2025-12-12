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

  // Fetch all existing usernames matching the pattern in a single query
  const existingUsernames = await userRepo.findUsernamesByPattern(sanitized);
  const existingSet = new Set(existingUsernames.map(u => u.toLowerCase()));

  // Try base username first
  if (!existingSet.has(sanitized)) {
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

      if (!existingSet.has(trimmedCandidate)) {
        return trimmedCandidate;
      }
      continue;
    }

    // Candidate fits within limit, check if available
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to generate unique username from base "${baseUsername}" after ${maxAttempts} attempts`
  );
}
