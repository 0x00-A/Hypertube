import { UserRepository } from "../repositories/user.repository";
import { Profile as GoogleProfile } from "passport-google-oauth20";
import { ConflictError } from '../core/errors/customErrors';
import { FortyTwoProfile } from "../types/oauth.type";
import { PasswordService } from "./password.service";
import { IUser } from "../interfaces/user.interface";


export class OAuthService {
    constructor(
        private _userRepo: UserRepository,
        private _passwordService: PasswordService,
    ) {}

    async handleGoogleOAuth(profile: GoogleProfile): Promise<Partial<IUser>> {
        const googleId = profile._json.sub;
        const email = profile._json.email;

        if (!googleId) {
            throw new ConflictError('Google account must have an identifier');
        }
        let user: Partial<IUser> | null = await this._userRepo.findByOAuthProvider({provider: 'google', id: googleId});
        if (!user) {
            if (!email) {
                throw new ConflictError('Google account must have an email address');
            }
            const existingUser = await this._userRepo.findByEmail(email);
            if (existingUser) {
                const linkedUser = await this._userRepo.linkOAuthAccount(existingUser._id!, {provider: 'google', id: googleId});
                if (!linkedUser) {
                    throw new ConflictError('Failed to link Google account');
                }
                user = linkedUser;
            } else {
                user = await this._userRepo.createOauthUser({
                    email: email,
                    username: email.split('@')[0],
                    firstName: profile._json.given_name || 'User',
                    lastName: profile._json.family_name || 'Google',
                    password: await this._passwordService.generateOAuthPassword(),
                    oauth: {
                        provider: 'google',
                        id: googleId
                    }
                });
            }
        }
        return user;
    }

    async handleFortyTwoOAuth(profile: FortyTwoProfile): Promise<Partial<IUser>> {
        const fortyTwoId = profile.id;
        const email = profile._json.email;

        // Email is required by schema, throw error if missing
        if (!email) {
            throw new ConflictError('42 account must have an email address');
        }

        let user: Partial<IUser> | null = await this._userRepo.findByOAuthProvider({provider: 'fortytwo', id: fortyTwoId});
        if (!user) {
            const existingUser = await this._userRepo.findByEmail(email);
            if (existingUser) {
                const linkedUser = await this._userRepo.linkOAuthAccount(existingUser._id!, {provider: 'fortytwo', id: fortyTwoId});
                if (!linkedUser) {
                    throw new ConflictError('Failed to link 42 account');
                }
                user = linkedUser;
            }
        }
        if (!user) {
            user = await this._userRepo.createOauthUser({
                email: email,
                username: profile._json.login || `fortytwo_${fortyTwoId}`,
                firstName: profile.name.givenName || profile._json.first_name || 'User',
                lastName: profile.name.familyName || profile._json.last_name || 'FortyTwo',
                password: await this._passwordService.generateOAuthPassword(),
                oauth: {
                    provider: 'fortytwo',
                    id: fortyTwoId
                }
            });
            if (!user._id) {
                throw new ConflictError('Failed to create user with 42 OAuth');
            }
        }
        if (!user) {
            throw new ConflictError('Failed to get or create user');
        }
        return user;
    }

}