"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const comment_repository_1 = require("../repositories/comment.repository");
const repo = new comment_repository_1.CommentRepository();
class CommentService {
    async list(page = 1, limit = 10) {
        return repo.findAll({ page, limit });
    }
    async create(input) {
        return repo.create(input);
    }
    async delete(id) {
        return repo.delete(id);
    }
}
exports.CommentService = CommentService;
