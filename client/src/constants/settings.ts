import { Globe, Mail, User, Lock } from 'lucide-react';
import type { SelectOption } from '../../components/ui/Select';

export const LANGUAGES: SelectOption[] = [
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

export const SETTINGS_TABS = [
  { id: 'profile' as const, label: 'My Profile', icon: User },
  { id: 'account' as const, label: 'Account', icon: Mail },
  { id: 'password' as const, label: 'Password', icon: Lock },
  { id: 'preferences' as const, label: 'Preferences', icon: Globe },
] as const;
