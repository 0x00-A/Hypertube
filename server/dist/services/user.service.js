"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const repo = new user_repository_1.UserRepository();
class UserService {
    // async list(page = 1, limit = 10) {
    //   return repo.findAll({ page, limit });
    // }
    async get(id) {
        return repo.findById(id);
    }
}
exports.UserService = UserService;
