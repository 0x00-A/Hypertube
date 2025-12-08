import jwt, { SignOptions, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';
import { env } from "../config/env";
import { IJWTPayload } from '../interfaces/auth.interface';
import { th } from 'zod/v4/locales';

export enum JWTErrorType {
    EXPIRED = 'EXPIRED',
    INVALID = 'INVALID',
    NOT_BEFORE = 'NOT_BEFORE',
}

export interface JWTVerifyResult {
    success: boolean;
    payload?: IJWTPayload;
    error?: {
        type: JWTErrorType;
        message: string;
    };
}

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

    refreshAccessToken(refreshToken: string): JWTVerifyResult {
        const refreshVerification = this.verifyRefreshToken(refreshToken);
        if (!refreshVerification.success) {
            return refreshVerification;
        }
        const newAccessToken = this.generateTokens({ userId: refreshVerification.payload!.userId }).access_token;
        return {
            success: true,
            payload: { userId: refreshVerification.payload!.userId },
        };
    }

    verifyAccessToken(token: string): JWTVerifyResult {
        try {
            const payload = jwt.verify(token, this.accessSecretKey) as IJWTPayload;
            return {
                success: true,
                payload,
            };
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                return {
                    success: false,
                    error: {
                        type: JWTErrorType.EXPIRED,
                        message: 'Access token has expired',
                    },
                };
            }
            if (error instanceof NotBeforeError) {
                return {
                    success: false,
                    error: {
                        type: JWTErrorType.NOT_BEFORE,
                        message: 'Access token is not yet valid',
                    },
                };
            }
            return {
                success: false,
                error: {
                    type: JWTErrorType.INVALID,
                    message: 'Invalid access token',
                },
            };
        }
    }

    verifyRefreshToken(token: string): JWTVerifyResult {
        try {
            const payload = jwt.verify(token, this.refreshSecretKey) as IJWTPayload;
            return {
                success: true,
                payload,
            };
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                return {
                    success: false,
                    error: {
                        type: JWTErrorType.EXPIRED,
                        message: 'Refresh token has expired',
                    },
                };
            }
            if (error instanceof NotBeforeError) {
                return {
                    success: false,
                    error: {
                        type: JWTErrorType.NOT_BEFORE,
                        message: 'Refresh token is not yet valid',
                    },
                };
            }
            return {
                success: false,
                error: {
                    type: JWTErrorType.INVALID,
                    message: 'Invalid refresh token',
                },
            };
        }
    }
}
