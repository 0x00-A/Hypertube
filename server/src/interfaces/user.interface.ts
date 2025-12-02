export interface IWatchedMovie {
  movieId: string;
  date: Date;
}

export interface IOAuth {
  fortytwoId?: string;
  googleId?: string;
}
export interface IUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string; // may be absent for OAuth-only accounts
  profilePicture?: string;
  language: string;
  oauth?: IOAuth;
  watchedMovies: IWatchedMovie[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateUserDTO {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  profilePicture?: string;
  language?: string;
  oauth?: IOAuth;
  watchedMovies?: IWatchedMovie[];
}

export interface IUpdateUserDTO extends Partial<ICreateUserDTO> {}
