"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const env_1 = require("../config/env");
class AuthController {
    _service;
    constructor(service) {
        this._service = service;
    }
    async signUp(req, res, next) {
        try {
            const { body } = req.validated;
            const newUser = await this._service.signUp(body);
            return res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: newUser,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async logIn(req, res, next) {
        try {
            const { body } = req.validated;
            const result = await this._service.logIn(body);
            if (!result) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid identifier or password',
                });
            }
            // Set tokens in httpOnly cookies
            res.cookie('accessToken', result.access_token, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: parseInt(env_1.env.JWT_ACCESS_EXPIRES_IN) * 1000, // 1 hour
            });
            res.cookie('refreshToken', result.refresh_token, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: parseInt(env_1.env.JWT_REFRESH_EXPIRES_IN) * 24 * 60 * 60 * 1000, // 30 days
            });
            return res.status(200).json({
                status: 'success',
                message: 'Login successful',
                data: {
                    userId: result.user._id,
                    username: result.user.username,
                    email: result.user.email,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
