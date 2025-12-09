import jwt, { SignOptions, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { env } from "../config/env";
import { IJWTPayload, JWTVerifyResult } from '../interfaces/auth.interface';
import { UserRepository } from '../repositories/user.repository';


export class JWTService {
    private readonly accessSecretKey: string = env.JWT_ACCESS_SECRET;
    private readonly accessExpiresIn: string = env.JWT_ACCESS_EXPIRES_IN;
    private readonly refreshSecretKey: string = env.JWT_REFRESH_SECRET;
    private readonly refreshExpiresIn: string = env.JWT_REFRESH_EXPIRES_IN;

    private generateAccessToken(payload: IJWTPayload): string {
        const options: SignOptions = { expiresIn: this.accessExpiresIn as unknown as SignOptions['expiresIn'] };
        return jwt.sign(payload, this.accessSecretKey, options);
    }

    private generateRefreshToken(payload: IJWTPayload): string {
        const options: SignOptions = { expiresIn: this.refreshExpiresIn as unknown as SignOptions['expiresIn'] };
        return jwt.sign(payload, this.refreshSecretKey, options);
    }

    generateTokens(payload: IJWTPayload): { access_token: string, refresh_token: string } {
        return {
            access_token: this.generateAccessToken(payload),
            refresh_token: this.generateRefreshToken(payload),
        }
    }

    async verifyToken(token: string, access: boolean, refresh: boolean): Promise<JWTVerifyResult> {
        const secretKey = access ? this.accessSecretKey : refresh ? this.refreshSecretKey : '';

        try {
            const decoded = jwt.verify(token, secretKey);
            const repo = new UserRepository();
            const user = await repo.findById((decoded as IJWTPayload).userId);
            if (!user) {
                return {
                    success: false,
                    error: {
                        type: 'INVALID',
                        message: 'User not found',
                    },
                };
            }
            return {
                success: true,
                newAccessToken: access ? undefined : this.generateAccessToken({ userId: user._id! }),
                user: user,
            };
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                return ({
                    success: false,
                    error: {
                        type: 'EXPIRED',
                        message: 'Token has expired',
                    },
                });
            } else if (error instanceof NotBeforeError) {
                return ({
                    success: false,
                    error: {
                        type: 'NOT_BEFORE',
                        message: 'Token is not yet valid',
                    },
                });
            } else {
                return ({
                    success: false,
                    error: {
                        type: 'INVALID',
                        message: 'Invalid token',
                    },
                });
            }
        }
    }
}
