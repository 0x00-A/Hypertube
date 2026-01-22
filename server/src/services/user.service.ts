import { IUser, IUserProfileUpdate } from '../interfaces/user.interface';
import { UserRepository } from '../repositories/user.repository';


export class UserService {

  constructor(private _repo: UserRepository) {}

  async list(page: number, limit: number): Promise<{
    data: Partial<IUser>[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    // Ensure page and limit are positive integers to prevent negative skip values
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.max(1, Math.floor(limit));

    const skip = (safePage - 1) * safeLimit;
    const [data, total] = await Promise.all([
      this._repo.findAll({ isActive: true }, { skip, limit: safeLimit }),
      this._repo.countDocuments({ isActive: true }),
    ]);
    const totalPages = Math.ceil(total / safeLimit);
    return { data, page: safePage, limit: safeLimit, total, totalPages };
  }

  async getUser(identifier: string, me = false): Promise<Partial<IUser> | null> {
    // Check if identifier is a valid MongoDB ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    let user;
    if (isObjectId) {
      // Search by ID
      user = me
        ? await this._repo.findByIdWithOauth(identifier)
        : await this._repo.findByOtherId(identifier);
    } else {
      // Search by username
      user = me
        ? await this._repo.findByUsernameWithOauth(identifier)
        : await this._repo.findByOtherUsername(identifier);
    }

    if (!user) return null;
    return user;
  }

  async updateProfile(username: string, newData: IUserProfileUpdate): Promise<void> {
    await this._repo.updateByUsername(username, newData);
  }


}
