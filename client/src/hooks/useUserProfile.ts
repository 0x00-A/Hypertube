import { useQuery } from '@tanstack/react-query';
import type { User } from '../types/auth.types';
import { httpClient } from '../services/http-client';

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
      const response = await httpClient.get<UserProfileResponse>(`/users/${username}`);
      return response.data.data.user;
    },
    enabled: !!username,
  });
};
