import jwt from 'jsonwebtoken';
import { env } from "../config/env";


export class JWTService {

    private accessSecretKey: string = env.JWT_ACCESS_SECRET;
    private accessExpiresIn: string | number = env.JWT_ACCESS_EXPIRES_IN;
    private refreshSecretKey: string = env.JWT_REFRESH_SECRET;
    private refreshExpiresIn: string | number = env.JWT_REFRESH_EXPIRES_IN;

    generateTokens(payload: object): {access_token:string, refresh_token:string} {
        return {
            access_token: jwt.sign(payload, this.accessSecretKey, { expiresIn: this.accessExpiresIn as any }),
            refresh_token: jwt.sign(payload, this.refreshSecretKey, { expiresIn: this.refreshExpiresIn as any }),
        }
    }

    // verifyToken(token: string): object | null {
    //     try {
    //         return jwt.verify(token, this.secretKey) as object;
    //     } catch (error) {
    //         return null;
    //     }
    // }
}