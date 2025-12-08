"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)();
function errorHandler(err, _req, res, _next) {
    logger.error({ err }, 'Unhandled error');
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
}
