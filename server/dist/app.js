"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = require("express-rate-limit");
const movies_routes_1 = require("./routes/v1/movies.routes");
const comments_routes_1 = require("./routes/v1/comments.routes");
const auth_routes_1 = require("./routes/v1/auth.routes");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const requestLogger_1 = require("./middleware/requestLogger");
const env_1 = require("./config/env");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./docs/swagger");
const database_1 = require("./config/database");
// Contrellers
const auth_controller_1 = require("./controllers/auth.controller");
const auth_service_1 = require("./services/auth.service");
// Services
const password_service_1 = require("./services/password.service");
const jwt_service_1 = require("./services/jwt.service");
// Repositories
const user_repository_1 = require("./repositories/user.repository");
const createApp = () => {
    const app = (0, express_1.default)();
    app.disable('x-powered-by');
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    // Basic rate limit placeholder (adjust for write/auth routes later)
    app.use((0, express_rate_limit_1.rateLimit)({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
    }));
    if (env_1.env.isDev) {
        app.use(requestLogger_1.requestLogger);
    }
    // Docs endpoints
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
    app.get('/api-docs.json', (_req, res) => res.json(swagger_1.swaggerSpec));
    // Versioned domain routes
    app.use('/v1/movies', movies_routes_1.router);
    // app.use('/v1/users', usersRouter);
    app.use('/v1/comments', comments_routes_1.router);
    // Health check
    app.get('/health', (_req, res) => {
        const dbStatus = (0, database_1.dbHealth)();
        res.json({ status: 'ok', db: dbStatus });
    });
    // authentication and authorization routes
    const authService = new auth_service_1.AuthService(new user_repository_1.UserRepository(), new password_service_1.PasswordService(), new jwt_service_1.JWTService());
    const authController = new auth_controller_1.AuthController(authService);
    app.use('/v1/auth', (0, auth_routes_1.createAuthRoutes)(authController));
    // accounts routes
    // app.use('/v1/accounts', usersRouter);
    app.use(notFound_1.notFoundHandler);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
