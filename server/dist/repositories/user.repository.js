"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = require("../models/User");
class UserRepository {
    toIUser(doc) {
        if (!doc)
            return null;
        return {
            _id: doc._id.toString(),
            username: doc.username,
            email: doc.email,
            password: doc.password,
            firstName: doc.firstName,
            lastName: doc.lastName,
            createdAt: doc.createdAt,
        };
    }
    async findByUsername(username) {
        const doc = await User_1.UserModel.findOne({ username }).exec();
        return this.toIUser(doc);
    }
    async findByEmail(email) {
        const doc = await User_1.UserModel.findOne({ email }).exec();
        return this.toIUser(doc);
    }
    async create(userData) {
        const doc = await User_1.UserModel.create(userData);
        return this.toIUser(doc);
    }
    async findById(id) {
        const doc = await User_1.UserModel.findById(id).exec();
        return this.toIUser(doc);
    }
}
exports.UserRepository = UserRepository;
