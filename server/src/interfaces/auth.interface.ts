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

export interface ILoginDTO {
  identifier: string;
  password: string;
}
