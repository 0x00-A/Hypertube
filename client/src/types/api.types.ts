// ============================================================================
// API Error Types
// ============================================================================

export interface ApiError {
    message: string;
    statusCode?: number;
    validationErrors?: Array<{
        path: string;
        message: string;
    }>;
    path?: string;
}
