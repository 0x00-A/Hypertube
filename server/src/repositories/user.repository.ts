import mongoose from 'mongoose';
import { UserModel } from '../models/User';
import { IUser, ICreateUserDTO } from '../interfaces/user.interface';
import { IPaginationOptions, IPaginatedResponse } from '../interfaces/pagination.interface';
import { IUserDocument } from '../models/user.model.types';

export class UserRepository {
  private toIUser(doc: IUserDocument | null): IUser | null {
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      username: doc.username,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      password: doc.password,
      profilePicture: doc.profilePicture,
      language: doc.language,
      watchedMovies: doc.watchedMovies,
    };
  }

  async findAll(options?: IPaginationOptions): Promise<IPaginatedResponse<IUser>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    if (mongoose.connection.readyState !== 1) {
      return { data: [], page, limit, total: 0, totalPages: 0 };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      UserModel.find().skip(skip).limit(limit).exec(),
      UserModel.countDocuments(),
    ]);
    return {
      data: data.map((doc) => this.toIUser(doc)!),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
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

  async create(userData: ICreateUserDTO): Promise<IUser> {
    const user = new UserModel(userData);
    const doc = await user.save();
    return this.toIUser(doc)!;
  }

  async findById(id: string): Promise<IUser | null> {
    const doc = await UserModel.findById(id).exec();
    return this.toIUser(doc);
  }

  async updatePartial(id: string, patch: Partial<IUser>): Promise<IUser | null> {
    const doc = await UserModel.findByIdAndUpdate(id, patch, { new: true }).exec();
    return this.toIUser(doc);
  }
}
