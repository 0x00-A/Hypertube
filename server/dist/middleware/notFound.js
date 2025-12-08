"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
function notFoundHandler(req, res, _next) {
    res.status(404).json({ message: 'Route not found', path: req.originalUrl });
}
