"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
class BaseProvider {
    api;
    name;
    constructor(name, baseUrl) {
        this.name = name;
        this.api = axios_1.default.create({
            baseURL: baseUrl,
            timeout: 10000,
        });
        // TODO: add retryCondition to respect ra (429 Too Many Requests)
        (0, axios_retry_1.default)(this.api, { retries: 3, retryDelay: axios_retry_1.default.exponentialDelay });
    }
}
exports.BaseProvider = BaseProvider;
// function parseRetryAfter(header?: string): number | null {
//   if (!header) return null;
//   const sec = Number(header);
//   if (!Number.isNaN(sec)) return sec * 1000; // seconds -> ms
//   // try parse HTTP date
//   const date = Date.parse(header);
//   if (!Number.isNaN(date)) {
//     const delay = date - Date.now();
//     return delay > 0 ? delay : 0;
//   }
//   return null;
// }
// axiosRetry(this.api, {
//   retries: 3,
//   retryCondition: (error) => {
//     // default network or idempotent request errors
//     const defaultCond = axiosRetry.isNetworkOrIdempotentRequestError(error);
//     // also consider 429 Too Many Requests
//     const is429 = !!(error.response && error.response.status === 429);
//     return defaultCond || is429;
//   },
//   retryDelay: (retryCount, error) => {
//     // Try to honor Retry-After header
//     const ra = (error?.response?.headers || {})['retry-after'] as string | undefined;
//     const delayFromHeader = parseRetryAfter(ra);
//     const maxDelayMs = 60_000; // cap to 60s for safety
//     if (delayFromHeader !== null) {
//       return Math.min(delayFromHeader, maxDelayMs);
//     }
//     // fallback to exponential backoff
//     return Math.min(axiosRetry.exponentialDelay(retryCount), maxDelayMs);
//   },
// });
