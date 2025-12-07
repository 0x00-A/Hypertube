import { UserModel } from '../models/User';
import { IUser, ISignupDTO } from '../interfaces/user.interface';
import { IUserDocument } from '../models/user.model.types';

// Interface for the Repository (Good for testing/mocking)
export interface IUserRepository {
  create(user: ISignupDTO): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  findById(id: string): Promise<IUser | null>;
}

export class UserRepository {
  private toIUser(doc: IUserDocument | null): IUser | null {
    if (!doc) return null;
    return {
      _id: doc._id.toString(),
      username: doc.username,
      email: doc.email,
      password: doc.password,
      firstName: doc.firstName,
      lastName: doc.lastName,
      createdAt: doc.createdAt,
    };
  }

  async findByUsername(username: string): Promise<IUser | null> {
    const doc = await UserModel.findOne({ username }).exec();
    return this.toIUser(doc);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const doc = await UserModel.findOne({ email }).exec();
    return this.toIUser(doc);
  }

  async create(userData: ISignupDTO): Promise<IUser> {
    const doc = await UserModel.create(userData);
    return this.toIUser(doc)!;
  }

  async findById(id: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findById(id).exec();
    return this.toIUser(doc);
  }
}
