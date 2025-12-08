"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true }, // Private [cite: 49]
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String }, // Nullable if using OmniAuth only
    // Auth Provider Logic (42 + Secondary)
    // oauth: {
    //   fortytwoId: { type: String, select: false }, // Store ID, don't expose
    //   googleId: { type: String, select: false },
    // },
    // Track watched movies for the thumbnail UI [cite: 66]
    // watchedMovies: [
    //   {
    //     movieId: { type: Schema.Types.ObjectId, ref: 'Movie' },
    //     date: Date,
    //   },
    // ],
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
