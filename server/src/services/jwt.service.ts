import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from "../config/env";

export class JWTService {
    private readonly accessSecretKey: string = env.JWT_ACCESS_SECRET;
    private readonly accessExpiresIn: string = env.JWT_ACCESS_EXPIRES_IN;
    private readonly refreshSecretKey: string = env.JWT_REFRESH_SECRET;
    private readonly refreshExpiresIn: string = env.JWT_REFRESH_EXPIRES_IN;

    generateTokens(payload: object): { access_token: string, refresh_token: string } {
        const accessOptions: SignOptions = { expiresIn: this.accessExpiresIn as unknown as SignOptions['expiresIn'] };
        const refreshOptions: SignOptions = { expiresIn: this.refreshExpiresIn as unknown as SignOptions['expiresIn'] };

        return {
            access_token: jwt.sign(payload, this.accessSecretKey, accessOptions),
            refresh_token: jwt.sign(payload, this.refreshSecretKey, refreshOptions),
        }
    }
}