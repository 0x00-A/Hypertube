import { UserModel } from '../models/User';
import { IUser } from '../interfaces/user.interface';
import { ISignupDTO } from '../interfaces/auth.interface';
import { IUserDocument } from '../models/user.model.types';

// Interface for the Repository (Good for testing/mocking)
export interface IUserRepository {
  create(user: ISignupDTO): Partial<IUser>;
  findByEmail(email: string): Promise<Partial<IUser> | null>;
  findByUsername(username: string): Promise<Partial<IUser> | null>;
  findById(id: string): Promise<Partial<IUser> | null>;
}

export class UserRepository {
  private toIUser(doc: IUserDocument | null): Partial<IUser> | null {
    if (!doc) return null;
    return {
      _id: doc._id.toString(),
      username: doc.username,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      createdAt: doc.createdAt,
      password: doc.password
    };
  }

  async findByUsername(username: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({ username }).select('+password').exec();
    return this.toIUser(doc);
  }

  async findByEmail(email: string): Promise<Partial<IUser>  | null> {
    const doc = await UserModel.findOne({ email }).select('+password').exec();
    return this.toIUser(doc);
  }

  async create(userData: ISignupDTO): Promise<Partial<IUser>> {
    const doc = await UserModel.create(userData);
    return this.toIUser(doc)!;
  }

  async findById(id: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findById(id).exec();
    return this.toIUser(doc);
  }
}
