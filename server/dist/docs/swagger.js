"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const path_1 = __importDefault(require("path"));
const options = {
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'Hypertube API',
            version: '0.1.0',
            description: 'API for Hypertube streaming platform',
        },
        security: [{ bearerAuth: [] }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Auth: {
                    type: 'object',
                    properties: {
                        token: { type: 'string' },
                    },
                },
                Movie: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        imdbId: { type: 'string' },
                        title: { type: 'string' },
                        year: { type: 'integer' },
                        rating: { type: 'number' },
                        duration: { type: 'number' },
                        summary: { type: 'string' },
                        largeCoverImage: { type: 'string' },
                        mediumCoverImage: { type: 'string' },
                        image: {
                            type: 'object',
                            properties: {
                                thumbnail: { type: 'string' },
                                poster: { type: 'string' },
                                backdrop: { type: 'string' },
                            },
                        },
                        genres: { type: 'array', items: { type: 'string' } },
                        language: { type: 'string' },
                        torrents: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    quality: { type: 'string' },
                                    hash: { type: 'string' },
                                    seeds: { type: 'integer' },
                                    peers: { type: 'integer' },
                                    size: { type: 'string' },
                                    url: { type: 'string' },
                                    source: { type: 'string' },
                                },
                            },
                        },
                        downloadStatus: {
                            type: 'string',
                            enum: ['not_downloaded', 'downloading', 'downloaded'],
                        },
                        lastWatched: { type: 'string', format: 'date-time' },
                        localPath: { type: 'string' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        profilePicture: { type: 'string' },
                        language: { type: 'string' },
                        oauth: {
                            type: 'object',
                            properties: {
                                fortytwoId: { type: 'string' },
                                googleId: { type: 'string' },
                            },
                        },
                        watchedMovies: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    movieId: { type: 'string' },
                                    date: { type: 'string', format: 'date-time' },
                                },
                            },
                        },
                    },
                },
                Comment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        userId: { type: 'string' },
                        movieId: { type: 'string' },
                        content: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                PaginatedMovie: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/Movie' } },
                        page: { type: 'integer', minimum: 1 },
                        limit: { type: 'integer', minimum: 1 },
                        total: { type: 'integer', minimum: 0 },
                        totalPages: { type: 'integer', minimum: 0 },
                    },
                },
                PaginatedUser: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                        page: { type: 'integer', minimum: 1 },
                        limit: { type: 'integer', minimum: 1 },
                        total: { type: 'integer', minimum: 0 },
                        totalPages: { type: 'integer', minimum: 0 },
                    },
                },
                PaginatedComment: {
                    type: 'object',
                    properties: {
                        data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
                        page: { type: 'integer', minimum: 1 },
                        limit: { type: 'integer', minimum: 1 },
                        total: { type: 'integer', minimum: 0 },
                        totalPages: { type: 'integer', minimum: 0 },
                    },
                },
            },
        },
    },
    // Load both YAML file and JSDoc annotations from route files
    apis: [
        path_1.default.join(__dirname, 'swagger.yaml'),
        'src/routes/v1/*.routes.ts',
        'src/controllers/*.controller.ts',
    ],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
