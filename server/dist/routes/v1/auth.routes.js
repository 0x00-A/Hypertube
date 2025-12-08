"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = void 0;
const express_1 = require("express");
const validate_1 = require("../../middleware/validate");
const auth_schema_1 = require("../../validators/auth.schema");
const createAuthRoutes = (controller) => {
    const router = (0, express_1.Router)();
    router.get('/', (_req, res) => {
        res.json({ message: 'Auth route is working' });
    });
    router.post('/signup', (0, validate_1.validate)(auth_schema_1.SignUpSchema), (req, res, next) => controller.signUp(req, res, next));
    router.post('/login', (0, validate_1.validate)(auth_schema_1.LogInSchema), (req, res, next) => controller.logIn(req, res, next));
    return router;
};
exports.createAuthRoutes = createAuthRoutes;
