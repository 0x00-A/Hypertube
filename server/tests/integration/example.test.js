"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../src/app");
describe('Example integration placeholder', () => {
    const app = (0, app_1.createApp)();
    it('GET /v1/movies returns 200', async () => {
        const res = await (0, supertest_1.default)(app).get('/v1/movies');
        expect(res.status).toBe(200);
    });
    // TODO: add more tests once business logic implemented
});
