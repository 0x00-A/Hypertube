"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdParamSchema = exports.objectIdString = void 0;
const zod_1 = require("zod");
const objectIdString = () => zod_1.z
    .string()
    .min(1)
    .regex(/^[a-fA-F0-9]{24}$/i, 'Invalid ObjectId format');
exports.objectIdString = objectIdString;
exports.IdParamSchema = zod_1.z.object({
    params: zod_1.z.object({ id: (0, exports.objectIdString)() }),
});
