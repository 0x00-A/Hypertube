import mongoose from 'mongoose';
import { UserModel } from '../models/User';
import { IUser, ICreateUserDTO } from '../interfaces/user.interface';
import { IPaginationOptions, IPaginatedResponse } from '../interfaces/pagination.interface';


export class UserRepository {
  async findAll(options?: IPaginationOptions): Promise<IPaginatedResponse<IUser>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    if (mongoose.connection.readyState !== 1) {
      return { data: [], page, limit, total: 0 };
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      UserModel.find().skip(skip).limit(limit),
      UserModel.countDocuments(),
    ]);
    return {
      data: data as any,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return UserModel.findOne({ username }) as IUser | null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }) as IUser | null;
  }

  async create(userData: ICreateUserDTO): Promise<IUser> {
    const user = new UserModel(userData);
    await user.save();
    return user as IUser;
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id) as any;
  }
  async updatePartial(id: string, patch: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, patch, { new: true }) as any;
  }
}
