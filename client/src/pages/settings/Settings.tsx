import { useState, useMemo, useRef } from 'react';
import { useAuthState } from '../../hooks/useAuth';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';
import { useChangePassword } from '../../hooks/useChangePassword';
import { 
  Globe, 
  Mail, 
  User as UserIcon, 
  Camera, 
  Save, 
  Loader2,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Select, type SelectOption } from '../../components/ui/Select';
import { clsx } from 'clsx';

// ============================================================================
// SaveButton Component - Reusable save button with loading state
// ============================================================================

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  label?: string;
  loadingLabel?: string;
  icon?: React.ReactNode;
}

const SaveButton = ({ 
  onClick, 
  disabled, 
  isLoading, 
  label = 'Save Changes',
  loadingLabel = 'Saving...',
  icon = <Save className="w-5 h-5" />
}: SaveButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200',
      !disabled && !isLoading
        ? 'bg-primary text-black hover:bg-primary-light'
        : 'bg-bg-tertiary text-text-disabled cursor-not-allowed border border-border'
    )}
  >
    {isLoading ? (
      <>
        <Loader2 className="w-5 h-5 animate-spin" />
        {loadingLabel}
      </>
    ) : (
      <>
        {icon}
        {label}
      </>
    )}
  </button>
);

// ============================================================================
// Constants & Types
// ============================================================================
const LANGUAGES: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'العربية' },
];

// Settings tabs
const SETTINGS_TABS = [
  { id: 'profile', label: 'My Profile', icon: UserIcon },
  { id: 'account', label: 'Account', icon: Mail },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'preferences', label: 'Preferences', icon: Globe },
] as const;

type TabId = typeof SETTINGS_TABS[number]['id'];

interface SettingsFormData {
  language: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}


export default function Settings() {
  const { user } = useAuthState();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  // Form state
  const [formData, setFormData] = useState<SettingsFormData>({
    language: user?.language || 'en',
    email: user?.email || '',
    username: user?.username || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatarUrl: user?.avatarUrl || '',
  });

  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [previewAvatar, setPreviewAvatar] = useState<string>(user?.avatarUrl || '');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check if form has changes
  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      formData.language !== (user.language || 'en') ||
      formData.email !== user.email ||
      formData.username !== user.username ||
      formData.firstName !== (user.firstName || '') ||
      formData.lastName !== (user.lastName || '') ||
      formData.avatarUrl !== (user.avatarUrl || '')
    );
  }, [formData, user]);

  // Get initials for avatar fallback
  const initials = useMemo(() => {
    if (!user) return '?';
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    return formData.username?.[0]?.toUpperCase() || '?';
  }, [user, formData]);

  const handleInputChange = (field: keyof SettingsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMessage('');

      // Create preview using URL.createObjectURL for better performance
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatar(previewUrl);

      // Upload to server and get permanent URL
      const imageUrl = await uploadImageToServer(file);
      setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
      
      // Clean up object URL after successful upload
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      setErrorMessage('Failed to upload image. Please try again.');
      // Re-throw for proper error handling
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  // Image upload function
  const uploadImageToServer = async (file: File): Promise<string> => {
    // Development-only mock implementation
    // TODO: Replace with actual upload to server/cloud storage in production
    if (import.meta.env.PROD) {
      throw new Error('Image upload is not yet implemented. Please contact support.');
    }
    
    // Simulate upload delay (development only)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return data URL for development
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveProfile = () => {
    setSuccessMessage('');
    setErrorMessage('');

    // Basic validation
    if (!formData.email.trim()) {
      setErrorMessage('Email is required');
      return;
    }

    if (!formData.username.trim()) {
      setErrorMessage('Username is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    updateProfile(
      {
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatar: formData.avatarUrl,
        language: formData.language,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Profile updated successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: unknown) => {
          if (error instanceof Error) {
            setErrorMessage(error.message || 'Failed to update profile');
          } else {
            setErrorMessage('Failed to update profile. Please try again.');
          }
        },
      }
    );
  };

  const handleChangePasswordSubmit = () => {
    setSuccessMessage('');
    setErrorMessage('');

    // Validate passwords
    if (!passwordData.currentPassword) {
      setErrorMessage('Current password is required');
      return;
    }

    if (!passwordData.newPassword) {
      setErrorMessage('New password is required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    changePassword(
      {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      },
      {
        onSuccess: () => {
          setSuccessMessage('Password changed successfully!');
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: unknown) => {
          if (error instanceof Error) {
            setErrorMessage(error.message || 'Failed to change password');
          } else {
            setErrorMessage('Failed to change password. Please try again.');
          }
        },
      }
    );
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">Settings</h1>
          <p className="text-text-secondary">Manage your account settings and preferences.</p>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <nav className="grid grid-cols-2 sm:flex sm:gap-8 gap-2 border-b border-border">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center justify-center sm:justify-start gap-2 px-4 py-4 text-sm font-medium transition-colors border-b-2 -mb-px',
                    isActive
                      ? 'text-text-primary border-primary'
                      : 'text-text-secondary border-transparent hover:text-text-primary'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <p className="text-success font-medium">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <p className="text-error font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <>
              {/* Profile Picture Card */}
              <div className="bg-bg-card rounded-lg border border-border p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">Profile Picture</h3>
                  <p className="text-sm text-text-secondary">Update your profile picture.</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-primary/30 flex items-center justify-center text-2xl font-bold text-primary shadow-lg overflow-hidden">
                      {previewAvatar ? (
                        <img 
                          src={previewAvatar} 
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>
                    
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleImageClick}
                      disabled={uploadingImage}
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <p className="text-text-primary font-medium mb-1">Upload a new picture</p>
                    <p className="text-text-secondary text-sm mb-3">JPG, PNG or GIF. Max size 5MB</p>
                    <button
                      type="button"
                      onClick={handleImageClick}
                      disabled={uploadingImage}
                      className={clsx(
                        'px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border',
                        uploadingImage
                          ? 'bg-bg-tertiary text-text-disabled border-border cursor-not-allowed'
                          : 'bg-bg-tertiary text-text-primary border-border hover:border-primary'
                      )}
                    >
                      {uploadingImage ? 'Uploading...' : 'Choose File'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Information Card */}
              <div className="bg-bg-card rounded-lg border border-border p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">Profile Information</h3>
                  <p className="text-sm text-text-secondary">Update your personal information.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={clsx(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-bg-tertiary text-text-primary',
                        'border border-border',
                        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                        'transition-all duration-200'
                      )}
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={clsx(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-bg-tertiary text-text-primary',
                        'border border-border',
                        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                        'transition-all duration-200'
                      )}
                      placeholder="Doe"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-text-secondary">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={clsx(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-bg-tertiary text-text-primary',
                        'border border-border',
                        'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                        'transition-all duration-200'
                      )}
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <SaveButton
                    onClick={handleSaveProfile}
                    disabled={!hasChanges || isPending}
                    isLoading={isPending}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'account' && (
            <div className="bg-bg-card rounded-lg border border-border p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-1">Account Details</h3>
                <p className="text-sm text-text-secondary">Update your account information.</p>
              </div>

              <div className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={clsx(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-bg-tertiary text-text-primary',
                      'border border-border',
                      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                      'transition-all duration-200'
                    )}
                    placeholder="john.doe@example.com"
                  />
                </div>

                {/* Account Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Account Status
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-bg-tertiary border border-border rounded-lg">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-text-primary font-medium">Active</span>
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Member Since
                  </label>
                  <div className="px-4 py-3 bg-bg-tertiary border border-border rounded-lg text-text-primary">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <SaveButton
                  onClick={handleSaveProfile}
                  disabled={!hasChanges || isPending}
                  isLoading={isPending}
                />
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-bg-card rounded-lg border border-border p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-1">Change Password</h3>
                <p className="text-sm text-text-secondary">Update your password to keep your account secure.</p>
              </div>

              <div className="space-y-6 max-w-md">
                {/* Current Password */}
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-text-secondary">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={clsx(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-bg-tertiary text-text-primary',
                      'border border-border',
                      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                      'transition-all duration-200'
                    )}
                    placeholder="••••••••"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={clsx(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-bg-tertiary text-text-primary',
                      'border border-border',
                      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                      'transition-all duration-200'
                    )}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-text-muted">Must be at least 8 characters</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={clsx(
                      'w-full px-4 py-3 rounded-lg',
                      'bg-bg-tertiary text-text-primary',
                      'border border-border',
                      'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
                      'transition-all duration-200'
                    )}
                    placeholder="••••••••"
                  />
                </div>

                <SaveButton
                  onClick={handleChangePasswordSubmit}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || isChangingPassword}
                  isLoading={isChangingPassword}
                  label="Update Password"
                  loadingLabel="Updating..."
                  icon={<Lock className="w-5 h-5" />}
                />
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-bg-card rounded-lg border border-border p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-text-primary mb-1">Preferences</h3>
                <p className="text-sm text-text-secondary">Customize your language preference.</p>
              </div>

              <div className="space-y-6 max-w-md">
                {/* Language */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Language
                  </label>
                  <div className="border-2 border-border rounded-lg bg-bg-tertiary focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200">
                    <Select
                      value={formData.language}
                      onChange={(value) => handleInputChange('language', value)}
                      options={LANGUAGES}
                      placeholder="Select language"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <SaveButton
                    onClick={handleSaveProfile}
                    disabled={!hasChanges || isPending}
                    isLoading={isPending}
                    label="Save Preferences"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
