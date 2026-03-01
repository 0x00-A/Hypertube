import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { queryKeys } from '../config/queryClient';
import { useAppDispatch } from '../redux/hooks';
import { setUser } from '../redux/slices/authSlice';
import type { UpdateProfileData } from '../types/auth.types';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileData }) => authService.updateProfile(id, data),
    onSuccess: async () => {
      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });

      // Fetch fresh user data and update Redux store
      const updatedUser = await authService.getCurrentUser();
      dispatch(setUser(updatedUser));

      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to update profile';
      toast.error(errorMessage);
    },
  });
};
