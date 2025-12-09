import { ISignupDTO, ILoginDTO, IUser } from '../interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: ISignupDTO | ILoginDTO;
        params?: Record<string, any>;
        query?: Record<string, any>;
      };
      user?: Partial<IUser>;
    }
  }
}

export {};
