import { VerificationEmailModel } from '../models/VerificationEmail';
import { IVerificationEmail } from '../interfaces/auth.interface';

export class VerificationEmailRepository {
    private toIVerificationEmail(doc: any): IVerificationEmail {
        return {
            userId: doc.userId,
            token: doc.token,
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

  async create(data: IVerificationEmail): Promise<IVerificationEmail> {
    const doc = await VerificationEmailModel.create(data);
    if (!doc) {
      throw new Error('Failed to create verification email record');
    }
    return this.toIVerificationEmail(doc);
  }
}