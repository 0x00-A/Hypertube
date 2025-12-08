"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
        return res.status(400).json({
            errors: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
    }
    const parsed = result.data;
    // Avoid mutating Express request getters; attach parsed values for controllers to opt-in use
    req.validated = parsed;
    next();
};
exports.validate = validate;
