import jwt, { SignOptions, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { env } from '../config/env';
import { IJWTPayload, JWTVerifyResult } from '../interfaces/auth.interface';
import { UserRepository } from '../repositories/user.repository';
import { UnauthorizedError } from '../core/errors/customErrors';

export class JWTService {
  private readonly accessSecretKey: string = env.JWT_ACCESS_SECRET;
  private readonly accessExpiresIn: string = env.JWT_ACCESS_EXPIRES_IN;
  private readonly refreshSecretKey: string = env.JWT_REFRESH_SECRET;
  private readonly refreshExpiresIn: string = env.JWT_REFRESH_EXPIRES_IN;
  private _repo: UserRepository;

  constructor(repo: UserRepository) {
    this._repo = repo;
  }

  private generateAccessToken(payload: IJWTPayload): string {
    const options: SignOptions = {
      expiresIn: this.accessExpiresIn as unknown as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, this.accessSecretKey, options);
  }

  private generateRefreshToken(payload: IJWTPayload): string {
    const options: SignOptions = {
      expiresIn: this.refreshExpiresIn as unknown as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, this.refreshSecretKey, options);
  }

  generateTokens(payload: IJWTPayload): { access_token: string; refresh_token: string } {
    return {
      access_token: this.generateAccessToken(payload),
      refresh_token: this.generateRefreshToken(payload),
    };
  }

  async verifyToken(token: string, access: boolean, refresh: boolean): Promise<JWTVerifyResult> {
    const secretKey = access ? this.accessSecretKey : refresh ? this.refreshSecretKey : '';

    try {
      const decoded = jwt.verify(token, secretKey);
      const user = await this._repo.findById((decoded as IJWTPayload).userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      return {
        newAccessToken: access ? undefined : this.generateAccessToken({ userId: user._id! }),
        user: user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      } else if (error instanceof NotBeforeError) {
        throw new UnauthorizedError('Token is not yet valid');
      } else {
        throw new UnauthorizedError('Invalid token');
      }
    }
  }
}
