export type TabId = 'profile' | 'account' | 'password' | 'preferences';

export interface SettingsFormData {
  language: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  label?: string;
  loadingLabel?: string;
  icon?: React.ReactNode;
}
