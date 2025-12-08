"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
class AuthService {
    _repo;
    _passwordService;
    _jwtService;
    constructor(repo, passwordService, jwtService) {
        this._repo = repo;
        this._passwordService = passwordService;
        this._jwtService = jwtService;
    }
    async signUp(userData) {
        const exist_username = await this._repo.findByUsername(userData.username);
        const exist_email = await this._repo.findByEmail(userData.email);
        if (exist_username) {
            throw new Error('Username already taken');
        }
        if (exist_email) {
            throw new Error('An email with this address already exists');
        }
        const hashedPassword = await this._passwordService.hashPassword(userData.password);
        const newUser = {
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: hashedPassword,
        };
        const newUserCreated = await this._repo.create(newUser);
        // then you should send verification email
        return {
            userId: newUserCreated._id,
            username: newUserCreated.username,
            email: newUserCreated.email,
        };
    }
    async logIn(body) {
        const user = await this._repo.findByUsername(body.identifier) || await this._repo.findByEmail(body.identifier);
        if (!user) {
            return null;
        }
        const isPasswordValid = await this._passwordService.verifyPassword(user.password, body.password);
        if (!isPasswordValid) {
            return null;
        }
        const tokens = this._jwtService.generateTokens({ userId: user._id, email: user.email });
        return {
            ...tokens,
            user,
        };
    }
}
exports.AuthService = AuthService;
