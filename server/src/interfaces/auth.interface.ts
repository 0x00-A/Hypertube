import { IUser } from "./user.interface";

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

export type JWTErrorType = 'EXPIRED' | 'INVALID' | 'NOT_BEFORE';

export type JWTVerifyResult =
  | { success: true; user: Partial<IUser>; newAccessToken?: string }
  | { success: false; error: { type: JWTErrorType; message: string } };

export interface ILoginDTO {
  identifier: string;
  password: string;
}
