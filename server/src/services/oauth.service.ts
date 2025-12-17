import { UserRepository } from "../repositories/user.repository";
import { Profile as GoogleProfile } from "passport-google-oauth20";
import { BadRequestError } from '../core/errors/customErrors';
import { FortyTwoProfile } from "../types/oauth.type";
import { PasswordService } from "./password.service";
import { IUser } from "../interfaces/user.interface";
import { generateUniqueUsername } from "../utils/usernameGenerator";


export class OAuthService {
    constructor(
        private _userRepo: UserRepository,
        private _passwordService: PasswordService,
    ) {}

    async handleGoogleOAuth(profile: GoogleProfile): Promise<Partial<IUser>> {
        const googleId = profile._json.sub;
        const email = profile._json.email;

        if (!googleId) throw new BadRequestError('Google account must have an identifier');

        let user: Partial<IUser> | null = await this._userRepo.findByOAuthProvider({provider: 'google', id: googleId});
        if (!user) {
            if (!email) throw new BadRequestError('Google account must have an email address');

            const existingUser = await this._userRepo.findByEmail(email);
            if (existingUser) {
                if (!existingUser._id) throw new BadRequestError('Existing user has no ID');

                const linkedUser = await this._userRepo.linkOAuthAccount(existingUser._id!, {provider: 'google', id: googleId});
                if (!linkedUser) throw new BadRequestError('Failed to link Google account');

                return linkedUser;
            } else {
                const uniqueUsername = await generateUniqueUsername(email.split('@')[0], this._userRepo);

                user = await this._userRepo.createOauthUser({
                    email: email,
                    username: uniqueUsername,
                    firstName: profile._json.given_name || 'User',
                    lastName: profile._json.family_name || 'Google',
                    password: await this._passwordService.generateOAuthPassword(),
                    isActive: true,
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

        if (!fortyTwoId) throw new BadRequestError('42 account must have an identifier');

        let user: Partial<IUser> | null = await this._userRepo.findByOAuthProvider({provider: 'fortytwo', id: fortyTwoId});
        if (!user) {
            if (!email) throw new BadRequestError('42 account must have an email address');

            const existingUser = await this._userRepo.findByEmail(email);
            if (existingUser) {
                if (!existingUser._id) throw new BadRequestError('Existing user has no ID');

                const linkedUser = await this._userRepo.linkOAuthAccount(existingUser._id!, {provider: 'fortytwo', id: fortyTwoId});
                if (!linkedUser) throw new BadRequestError('Failed to link 42 account');

                return linkedUser;
            } else {
                const uniqueUsername = await generateUniqueUsername(profile._json.login || email.split('@')[0], this._userRepo);

                user = await this._userRepo.createOauthUser({
                    email: email,
                    username: uniqueUsername,
                    firstName: profile.name.givenName || profile._json.first_name || 'User',
                    lastName: profile.name.familyName || profile._json.last_name || 'FortyTwo',
                    password: await this._passwordService.generateOAuthPassword(),
                    isActive: true,
                    oauth: {
                        provider: 'fortytwo',
                        id: fortyTwoId
                    }
                });
            }
        }
        return user;
    }

}