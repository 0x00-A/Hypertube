export interface IOAuth {
  provider: 'google' | 'fortytwo';
  id: string;
  isPasswordSet?: boolean;
}

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  isActive?: boolean;
  password?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt?: Date;
  oauth?: IOAuth;

  language?: string;
}

export interface IUserProfileUpdate {
  email?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}