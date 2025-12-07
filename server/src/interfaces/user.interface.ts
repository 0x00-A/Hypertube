export interface IWatchedMovie {
  movieId: string;
  date: Date;
}

export interface IOAuth {
  fortytwoId?: string;
  googleId?: string;
}

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
}

export interface ISignupDTO {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface IUpdateUserDTO extends Partial<ISignupDTO> {}
