import { IUser } from './user.interface';

export interface ISignupDTO {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface IJWTPayload {
  userId: string;
}

export interface JWTVerifyResult {
  user: Partial<IUser>;
  newAccessToken?: string;
}

export interface ILoginDTO {
  identifier: string;
  password: string;
}

export interface IVerificationEmail {
  userId: string;
  token: string;
  // createdAt: Date;
}

// export interface IVerificationEmailDTO {
//   userId: string;
//   token: string;
//   email: string;
// }