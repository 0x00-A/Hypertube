"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieIdParamSchema = exports.MovieListQuerySchema = void 0;
const zod_1 = require("zod");
exports.MovieListQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z
            .string()
            .optional()
            .transform((v) => (v ? parseInt(v, 10) : undefined)),
        limit: zod_1.z
            .string()
            .optional()
            .transform((v) => (v ? parseInt(v, 10) : undefined)),
    }),
});
exports.MovieIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format') }),
});
