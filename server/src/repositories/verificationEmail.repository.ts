import { VerificationEmailModel } from '../models/VerificationEmail.model';
import { IVerificationEmail } from '../interfaces/auth.interface';

export class VerificationEmailRepository {
    private toIVerificationEmail(doc: any): IVerificationEmail {
        return {
            userId: doc.userId,
            token: doc.token,
            type: doc.type,
        };
    }

  async findByToken(token: string) {
    return VerificationEmailModel.findOne({ token });
  }

  async deleteByToken(token: string) {
    await VerificationEmailModel.deleteOne({ token });
  }

  async deleteByUserId(userId: string) {
    await VerificationEmailModel.deleteOne({ userId });
  }

  async deleteByUserIdAndType(userId: string, type: 'verification' | 'password_reset'): Promise<void> {
    await VerificationEmailModel.deleteOne({ userId, type });
  }

  async findByUserIdAndType(userId: string, type: 'verification' | 'password_reset'): Promise<IVerificationEmail | null> {
    const doc = await VerificationEmailModel.findOne({ userId, type });
    if (!doc) {
      return null;
    }
    return this.toIVerificationEmail(doc);
  }

  async create(data: IVerificationEmail): Promise<IVerificationEmail> {
    const doc = await VerificationEmailModel.create(data);
    if (!doc) {
      throw new Error('Failed to create verification email record');
    }
    return this.toIVerificationEmail(doc);
  }
}