import { useQuery } from '@tanstack/react-query';
import type { User } from '../types/auth.types';
import { authService } from '../services/auth.service';

export const useUserProfile = (username: string | undefined) => {
  return useQuery<User>({
    queryKey: ['user', username],
    queryFn: async () => {
      if (!username) throw new Error('Username is required');
      return authService.getUserProfile(username);
    },
    enabled: !!username,
  });
};
