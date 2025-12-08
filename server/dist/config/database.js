"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.dbHealth = dbHealth;
const mongoose_1 = __importDefault(require("mongoose"));
const pino_1 = __importDefault(require("pino"));
const env_1 = require("./env");
const logger = (0, pino_1.default)();
let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            autoIndex: env_1.env.isDev,
            maxPoolSize: 20,
        });
        logger.info({ state: mongoose_1.default.connection.readyState }, 'MongoDB connected');
    }
    catch (err) {
        connectionAttempts++;
        logger.error({ err, attempts: connectionAttempts }, 'MongoDB connection error');
        if (connectionAttempts < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * connectionAttempts));
            return connectDatabase();
        }
        throw err;
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.connection.close();
    logger.info('MongoDB disconnected');
}
function dbHealth() {
    return { readyState: mongoose_1.default.connection.readyState };
}
