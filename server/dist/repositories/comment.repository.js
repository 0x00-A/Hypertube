"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentRepository = void 0;
const Comment_1 = require("../models/Comment");
const mongoose_1 = __importDefault(require("mongoose"));
class CommentRepository {
    async findAll(options) {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        if (mongoose_1.default.connection.readyState !== 1) {
            return { data: [], page, limit, total: 0, totalPages: 0 };
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Comment_1.CommentModel.find().skip(skip).limit(limit),
            Comment_1.CommentModel.countDocuments(),
        ]);
        return {
            data: data,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async create(comment) {
        return Comment_1.CommentModel.create(comment);
    }
    async delete(id) {
        await Comment_1.CommentModel.findByIdAndDelete(id);
    }
}
exports.CommentRepository = CommentRepository;
