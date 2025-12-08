"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
class JWTService {
    accessSecretKey = env_1.env.JWT_ACCESS_SECRET;
    accessExpiresIn = env_1.env.JWT_ACCESS_EXPIRES_IN;
    refreshSecretKey = env_1.env.JWT_REFRESH_SECRET;
    refreshExpiresIn = env_1.env.JWT_REFRESH_EXPIRES_IN;
    generateTokens(payload) {
        return {
            access_token: jsonwebtoken_1.default.sign(payload, this.accessSecretKey, { expiresIn: this.accessExpiresIn }),
            refresh_token: jsonwebtoken_1.default.sign(payload, this.refreshSecretKey, { expiresIn: this.refreshExpiresIn }),
        };
    }
}
exports.JWTService = JWTService;
