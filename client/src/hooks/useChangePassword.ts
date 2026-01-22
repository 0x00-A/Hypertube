import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { ChangePasswordData } from '../types/auth.types';

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => authService.changePassword(data),
  });
};
