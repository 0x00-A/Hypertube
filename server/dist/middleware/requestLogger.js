"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ transport: { target: 'pino-pretty' } });
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        logger.info({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            ms: Date.now() - start,
        });
    });
    next();
}
