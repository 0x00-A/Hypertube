import { UserRepository } from '../repositories/user.repository';


export async function generateUniqueUsername(
  baseUsername: string,
  userRepo: UserRepository,
  maxAttempts = 100
): Promise<string> {
  let sanitized = baseUsername
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 20);

  if (sanitized.length < 3) {
    sanitized = sanitized.padEnd(3, '0');
  }

  const existingUser = await userRepo.findByUsername(sanitized);
  if (!existingUser) {
    return sanitized;
  }

  for (let i = 2; i <= maxAttempts; i++) {
    const candidate = `${sanitized}${i}`;

    if (candidate.length > 30) {
      const trimLength = 30 - String(i).length;
      const trimmedBase = sanitized.substring(0, trimLength);
      const newCandidate = `${trimmedBase}${i}`;

      const user = await userRepo.findByUsername(newCandidate);
      if (!user) {
        return newCandidate;
      }
      continue;
    }

    const user = await userRepo.findByUsername(candidate);
    if (!user) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to generate unique username from base "${baseUsername}" after ${maxAttempts} attempts`
  );
}
