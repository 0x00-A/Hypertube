"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listComments = listComments;
exports.createComment = createComment;
exports.deleteComment = deleteComment;
const comment_service_1 = require("../services/comment.service");
const service = new comment_service_1.CommentService();
async function listComments(req, res, next) {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '10', 10);
        const result = await service.list(page, limit);
        res.json({
            data: result.data,
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        });
    }
    catch (err) {
        next(err);
    }
}
async function createComment(req, res, next) {
    try {
        const created = await service.create(req.body);
        res.status(201).json(created);
    }
    catch (err) {
        next(err);
    }
}
async function deleteComment(req, res, next) {
    try {
        await service.delete(req.params.id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
}
