import { UserModel } from '../models/User';
import { IUser, IOAuth } from '../interfaces/user.interface';
import { ISignupDTO } from '../interfaces/auth.interface';
import { IUserDocument } from '../models/user.model.types';

// Interface for the Repository (Good for testing/mocking)
export interface IUserRepository {
  create(user: ISignupDTO): Promise<Partial<IUser>>;
  findByEmail(email: string): Promise<Partial<IUser> | null>;
  findByUsername(username: string): Promise<Partial<IUser> | null>;
  findById(id: string): Promise<Partial<IUser> | null>;
  findByOAuthProvider(oauth: IOAuth): Promise<Partial<IUser> | null>;
  createOauthUser(oauthData: Partial<IUser>): Promise<Partial<IUser>>;
  linkOAuthAccount(userId: string, oauth: IOAuth): Promise<Partial<IUser> | null>;
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
      password: doc.password,
      oauth: doc.get('oauth') as { provider: 'google' | 'fortytwo'; id: string } | undefined
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

  async findById(id: string): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findById(id).exec();
    return this.toIUser(doc);
  }

  async findByOAuthProvider(oauth: IOAuth): Promise<Partial<IUser> | null> {
    const doc = await UserModel.findOne({
      'oauth.provider': oauth.provider,
      'oauth.id': oauth.id
    }).select('+oauth').exec();
    if (!doc) return null;
    return this.toIUser(doc);
  }

  async linkOAuthAccount(userId: string, oauth: IOAuth): Promise<Partial<IUser> | null> {
    const existingUser = await UserModel.findById(userId).exec();
    if (!existingUser) {
      return null;
    }

    const doc = await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          'oauth.provider': oauth.provider,
          'oauth.id': oauth.id
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
}
