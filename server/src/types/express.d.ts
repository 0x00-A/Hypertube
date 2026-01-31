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
      file?: Multer.File;
    }

    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export {};
