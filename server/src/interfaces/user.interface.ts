export interface IWatchedMovie {
  movieId: string;
  date: Date;
}

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
  createdAt?: Date;
  oauth?: IOAuth;
}
