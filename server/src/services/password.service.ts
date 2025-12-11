import argon2 from "argon2";
import crypto from "crypto";


export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async generateOAuthPassword(): Promise<string> {
    const randomPassword = crypto.randomBytes(32).toString('hex');
    return await argon2.hash(randomPassword);
  }

}
