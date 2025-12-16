export interface IOAuth {
  provider: 'google' | 'fortytwo';
  id: string;
}

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt?: Date;
  oauth?: IOAuth;
}
