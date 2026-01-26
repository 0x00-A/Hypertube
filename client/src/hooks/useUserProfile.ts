import { useQuery } from '@tanstack/react-query';
import type { User } from '../types/auth.types';

interface UserProfileResponse {
  status: string;
  data: {
    user: User;
  };
}

export const useUserProfile = (username: string | undefined) => {
  return useQuery<User>({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/users/${username}`
      );
      
      if (!response.ok) {
        throw new Error('User not found');
      }
      
      const json: UserProfileResponse = await response.json();
      return json.data.user;
    },
    enabled: !!username,
  });
};
