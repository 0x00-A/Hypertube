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
  password?: string; // Optional, excluded by default with select: false
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
}

// export interface IUpdateUserDTO extends Partial<ISignupDTO> {}
