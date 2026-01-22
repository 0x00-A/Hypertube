import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { UpdateProfileData, User } from '../types/auth.types';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/slices/authSlice';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => authService.updateProfile(data),
    onSuccess: (updatedUser: User) => {
      // Update the user in Redux store
      dispatch(setUser(updatedUser));
      
      // Invalidate and refetch user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};
