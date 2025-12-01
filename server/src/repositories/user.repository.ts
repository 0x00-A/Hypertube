import mongoose from 'mongoose';
import { UserModel } from '../models/User';
import { IUser } from '../interfaces/user.interface';
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

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id) as any;
  }
  async updatePartial(id: string, patch: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, patch, { new: true }) as any;
  }
}
