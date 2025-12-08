"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogInSchema = exports.SignUpSchema = void 0;
const zod_1 = require("zod");
exports.SignUpSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string().trim().min(3, 'Username must be at least 3 characters long'),
        firstName: zod_1.z.string().trim().min(2, 'First name is required'),
        lastName: zod_1.z.string().trim().min(2, 'Last name is required'),
        email: zod_1.z.string().trim().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    }),
});
exports.LogInSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z.string().trim().min(1, 'Username or email is required').refine((val) => val.includes('@') ? zod_1.z.string().email().safeParse(val).success : val.length >= 3, { message: 'Must be a valid email or username (min 3 characters)' }),
        password: zod_1.z.string().min(1, 'Password is required'),
    })
});
