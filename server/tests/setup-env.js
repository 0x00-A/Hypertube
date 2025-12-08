"use strict";
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.ENABLE_REQUEST_LOGGING = 'false';
process.env.YTS_BASE_API_URL = 'https://yts.mx/api/v2';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-change-in-production';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-change-in-production';
process.env.JWT_ACCESS_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
