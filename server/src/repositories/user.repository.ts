import { UserModel } from '../models/User';
import { IUser, IOAuth, IUserProfileUpdate } from '../interfaces/user.interface';
import { ISignupDTO } from '../interfaces/auth.interface';
import { IUserDocument } from '../models/user.model.types';

export interface IUserRepository {
  create(user: ISignupDTO): Promise<Partial<IUser>>;
  findByEmail(email: string): Promise<Partial<IUser> | null>;
  findByUsername(username: string): Promise<Partial<IUser> | null>;
  findById(id: string): Promise<Partial<IUser> | null>;
  findByOAuthProvider(oauth: IOAuth): Promise<Partial<IUser> | null>;
  createOauthUser(oauthData: Partial<IUser>): Promise<Partial<IUser>>;
  linkOAuthAccount(userId: string, oauth: IOAuth): Promise<Partial<IUser> | null>;
  findUsernamesByPattern(pattern: string): Promise<string[]>;
}

export class UserRepository {
  private toIUser(doc: IUserDocument | null): Partial<IUser> | null {
    if (!doc) return null;
    const user: Partial<IUser> = {
      _id: doc._id.toString(),
      username: doc.username,
      email: doc.email ?? undefined,
      firstName: doc.firstName,
      lastName: doc.lastName,
      avatarUrl: doc.avatarUrl,
      createdAt: doc.createdAt,
      password: doc.password,
      isActive: doc.isActive,
    };

    const oauthValue = doc.get('oauth') as { provider: 'google' | 'fortytwo'; id: string } | undefined;
    if (oauthValue !== undefined) {
      user.oauth = oauthValue;
    }

    return user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ username }).exec();
    return count > 0;
  }
  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email }).exec();
    return count > 0;
  }

  async findById(id: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findById(id).exec();
    return this.toIUser(doc);
  }
  async findByOtherId(id: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findById(id).select('-email').exec();
    return this.toIUser(doc);
  }
  async findByIdWithOauth(id: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findById(id).select('+oauth').exec();
    return this.toIUser(doc);
  }
  async findByUsername(username: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({ username }).exec();
    return this.toIUser(doc);
  }
  async findByOtherUsername(username: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({ username }).select('-email').exec();
    return this.toIUser(doc);
  }
  async findByEmail(email: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({ email }).exec();
    return this.toIUser(doc);
  }
  async findByOauth(oauth: IOAuth): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({
      'oauth.provider': oauth.provider,
      'oauth.id': oauth.id
    }).exec();
    return this.toIUser(doc);
  }

  async findByUsernameLogin(username: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({ username }).select('+password').exec();
    return this.toIUser(doc);
  }
  async findByEmailLogin(email: string): Promise<Partial<IUser>  | null> {
    const doc = await UserModel.findOne({ email }).select('+password +oauth').exec();
    return this.toIUser(doc);
  }
  async findByEmailWithOauth(email: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({ email }).select('+oauth').exec();
    return this.toIUser(doc);
  }
  async findByUsernameWithOauth(username: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({ username }).select('+oauth').exec();
    return this.toIUser(doc);
  }

  async findAll(filter: Partial<IUser>, options: { skip?: number; limit?: number } = {}): Promise<Partial<IUser>[]> {
    const query = UserModel.find(filter).select('-email');
    if (options.skip !== undefined) {
      query.skip(options.skip);
    }
    if (options.limit !== undefined) {
      query.limit(options.limit);
    }
    const docs = await query.exec();
    return docs
      .map(doc => this.toIUser(doc))
      .filter((user): user is Partial<IUser> => user !== null);
  }

  async countDocuments(filter: Partial<IUser>): Promise<number> {
    return UserModel.countDocuments(filter).exec();
  }

  async linkOAuthAccount(userId: string, oauth: IOAuth): Promise<Partial<IUser> | null> {
    const existingUser = await UserModel.findById(userId).select('+password').exec();
    if (!existingUser) {
      return null;
    }

    // If user has a password, they can use password reset even with OAuth linked
    const hasPassword = !!existingUser.password;

    const doc = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          'oauth.provider': oauth.provider,
          'oauth.id': oauth.id,
          'oauth.isPasswordSet': hasPassword,
          'isActive': true
        }
      },
      { new: true, runValidators: true }
    ).exec();

    if (!doc) return null;
    return this.toIUser(doc);
  }

  async create(userData: ISignupDTO): Promise<Partial<IUser>> {
    const doc = await UserModel.create(userData);
    if (!doc || !doc._id) {
      throw new Error('Failed to create user');
    }
    return this.toIUser(doc)!;
  }

  async createOauthUser(oauthData: Partial<IUser>): Promise<Partial<IUser>> {
    const doc = await UserModel.create(oauthData);
    if (!doc || !doc._id) {
      throw new Error('Failed to create OAuth user');
    }
    return this.toIUser(doc)!;
  }

  async findUsernamesByPattern(pattern: string): Promise<string[]> {
    const docs = await UserModel.find(
      { username: { $regex: `^${pattern}`, $options: 'i' } },
      { username: 1, _id: 0 }
    ).exec();
    return docs.map(doc => doc.username);
  }

  async updateByUsername(username: string, updateData: IUserProfileUpdate): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOneAndUpdate(
      { username },
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
    return this.toIUser(doc);
  }

  async update(userId: string, updateData: Partial<IUser>): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
    return this.toIUser(doc);
  }
}
