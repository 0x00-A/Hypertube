"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModel = void 0;
const mongoose_1 = require("mongoose");
const commentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    movieId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Movie', required: true },
    content: { type: String, required: true, maxlength: 500 }, // Security: prevent massive payloads
    createdAt: { type: Date, default: Date.now },
});
exports.CommentModel = (0, mongoose_1.model)('Comment', commentSchema);
