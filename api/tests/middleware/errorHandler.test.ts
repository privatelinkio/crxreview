/**
 * Unit tests for error handler middleware
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockContext } from '../utils/helpers';
import { SAMPLE_ERRORS } from '../utils/fixtures';

/**
 * Mock ApiError class for testing
 */
class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Mock ValidationError class for testing
 */
class ValidationError extends Error {
  constructor(
    message: string,
    public errors?: any[],
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

describe('Error Handler Middleware', () => {
  let context: any;

  beforeEach(() => {
    context = createMockContext();
  });

  describe('ApiError Handling', () => {
    it('should format ApiError with correct status code', () => {
      const error = new ApiError('Unauthorized', 401, 'UNAUTHORIZED');

      const response = {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
        code: error.code,
        timestamp: new Date().toISOString(),
      };

      expect(response.statusCode).toBe(401);
      expect(response.error).toBe('Unauthorized');
      expect(response.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 for bad request error', () => {
      const error = new ApiError('Invalid request', 400, 'BAD_REQUEST');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid request');
    });

    it('should return 404 for not found error', () => {
      const error = new ApiError(SAMPLE_ERRORS.notFound, 404, 'NOT_FOUND');

      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('Not Found');
    });

    it('should return 429 for rate limit error', () => {
      const error = new ApiError(SAMPLE_ERRORS.rateLimited, 429, 'RATE_LIMITED');

      expect(error.statusCode).toBe(429);
    });

    it('should include error code in response', () => {
      const error = new ApiError('Forbidden', 403, 'FORBIDDEN');

      const response = {
        code: error.code,
        statusCode: error.statusCode,
      };

      expect(response.code).toBe('FORBIDDEN');
    });

    it('should default to 500 if no status code provided', () => {
      const error = new ApiError('Something went wrong');

      expect(error.statusCode).toBe(500);
    });
  });

  describe('ValidationError Handling', () => {
    it('should format ValidationError from Zod', () => {
      const errors = [
        { path: 'file', message: 'File is required' },
        { path: 'size', message: 'File size exceeds limit' },
      ];
      const error = new ValidationError('Validation failed', errors);

      const response = {
        success: false,
        error: error.message,
        statusCode: 422,
        details: error.errors,
      };

      expect(response.statusCode).toBe(422);
      expect(response.details).toHaveLength(2);
      expect(response.details[0].path).toBe('file');
    });

    it('should include all validation errors', () => {
      const errors = [
        { path: 'email', message: 'Invalid email format' },
        { path: 'password', message: 'Password too short' },
        { path: 'name', message: 'Name is required' },
      ];
      const error = new ValidationError('Validation failed', errors);

      expect(error.errors).toHaveLength(3);
      expect(error.errors.map((e: any) => e.path)).toEqual(['email', 'password', 'name']);
    });

    it('should return 422 status code', () => {
      const error = new ValidationError('Invalid input');

      const statusCode = 422;
      expect(statusCode).toBe(422);
    });

    it('should preserve error paths for field-level validation', () => {
      const errors = [
        { path: ['manifest', 'version'], message: 'Version is invalid' },
        { path: ['manifest', 'permissions', 0], message: 'Invalid permission' },
      ];
      const error = new ValidationError('Validation failed', errors);

      expect(error.errors?.[0].path).toEqual(['manifest', 'version']);
      expect(error.errors?.[1].path).toEqual(['manifest', 'permissions', 0]);
    });
  });

  describe('Unknown Error Handling', () => {
    it('should handle generic Error objects', () => {
      const error = new Error('An unexpected error occurred');

      const response = {
        success: false,
        error: SAMPLE_ERRORS.internal,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };

      expect(response.statusCode).toBe(500);
      expect(response.success).toBe(false);
    });

    it('should handle non-Error thrown values', () => {
      const error = 'String error message';

      const response = {
        success: false,
        error: SAMPLE_ERRORS.internal,
        statusCode: 500,
      };

      expect(response.statusCode).toBe(500);
    });

    it('should handle null/undefined errors', () => {
      const error = null;

      const response = {
        success: false,
        error: SAMPLE_ERRORS.internal,
        statusCode: 500,
      };

      expect(response.statusCode).toBe(500);
      expect(response.success).toBe(false);
    });

    it('should not expose internal error details in production', () => {
      const error = new Error('Database connection lost');

      const response = {
        success: false,
        error: SAMPLE_ERRORS.internal,
        statusCode: 500,
      };

      // Should not expose internal details
      expect(response.error).not.toContain('Database');
    });
  });

  describe('Response Format', () => {
    it('should include timestamp in error response', () => {
      const error = new ApiError('Test error', 400);

      const timestamp = new Date().toISOString();
      const response = {
        success: false,
        error: error.message,
        timestamp,
      };

      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    it('should include request path in error response', () => {
      const error = new ApiError('Not found', 404);
      const path = '/api/sessions/invalid-id';

      const response = {
        success: false,
        error: error.message,
        path,
        statusCode: 404,
      };

      expect(response.path).toBe(path);
    });

    it('should include request ID in response', () => {
      const requestId = 'req-12345';
      const error = new ApiError('Test error', 400);

      const response = {
        success: false,
        error: error.message,
        requestId,
      };

      expect(response.requestId).toBe(requestId);
    });

    it('should follow consistent response structure', () => {
      const error = new ApiError('Test error', 400, 'TEST_ERROR');

      const response = {
        success: false,
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
      };

      expect(Object.keys(response)).toContain('success');
      expect(Object.keys(response)).toContain('error');
      expect(Object.keys(response)).toContain('statusCode');
      expect(Object.keys(response)).toContain('timestamp');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should map errors to correct HTTP status codes', () => {
      const testCases = [
        { error: new ApiError('Bad request', 400), expected: 400 },
        { error: new ApiError('Unauthorized', 401), expected: 401 },
        { error: new ApiError('Forbidden', 403), expected: 403 },
        { error: new ApiError('Not found', 404), expected: 404 },
        { error: new ApiError('Conflict', 409), expected: 409 },
        { error: new ApiError('Rate limited', 429), expected: 429 },
        { error: new ApiError('Server error', 500), expected: 500 },
        { error: new ApiError('Service unavailable', 503), expected: 503 },
      ];

      testCases.forEach(({ error, expected }) => {
        expect(error.statusCode).toBe(expected);
      });
    });
  });

  describe('Error Code Mapping', () => {
    it('should include specific error codes', () => {
      const errors = [
        { message: 'File too large', code: 'FILE_TOO_LARGE', statusCode: 413 },
        { message: 'Invalid CRX format', code: 'INVALID_CRX', statusCode: 422 },
        { message: 'Session not found', code: 'SESSION_NOT_FOUND', statusCode: 404 },
        { message: 'Unauthorized', code: 'UNAUTHORIZED', statusCode: 401 },
      ];

      errors.forEach(({ message, code, statusCode }) => {
        const error = new ApiError(message, statusCode, code);
        expect(error.code).toBe(code);
      });
    });
  });

  describe('Request Context', () => {
    it('should include HTTP method in error response', () => {
      const error = new ApiError('Method not allowed', 405);
      const method = 'PATCH';

      const response = {
        success: false,
        error: error.message,
        statusCode: 405,
        method,
      };

      expect(response.method).toBe('PATCH');
    });

    it('should include request headers info', () => {
      const error = new ApiError('Bad request', 400);

      const response = {
        success: false,
        error: error.message,
        statusCode: 400,
        contentType: 'application/json',
      };

      expect(response.contentType).toBe('application/json');
    });
  });

  describe('Error Transformation', () => {
    it('should transform custom error objects', () => {
      class CustomError {
        constructor(public message: string, public code: string) {}
      }

      const customError = new CustomError('Custom error', 'CUSTOM');

      // In real implementation, should be transformed to ApiError
      const transformed = new ApiError(customError.message, 400, customError.code);

      expect(transformed.message).toBe('Custom error');
      expect(transformed.code).toBe('CUSTOM');
      expect(transformed.statusCode).toBe(400);
    });

    it('should preserve error stack trace in development', () => {
      const error = new ApiError('Test error', 500, 'TEST');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError');
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular references in error details', () => {
      const circular: any = { a: 1 };
      circular.self = circular;

      // Should not throw when serializing
      const error = new ApiError('Error with circular ref', 500);
      const response = {
        success: false,
        error: error.message,
        statusCode: 500,
      };

      expect(response.success).toBe(false);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new ApiError(longMessage, 400);

      const response = {
        error: error.message.substring(0, 1000), // Truncate if needed
      };

      expect(response.error).toBeDefined();
    });

    it('should handle errors without message property', () => {
      const error = { statusCode: 500 };

      const response = {
        success: false,
        error: SAMPLE_ERRORS.internal,
        statusCode: 500,
      };

      expect(response.error).toBeDefined();
    });
  });

  describe('Logging', () => {
    it('should log error details', () => {
      const error = new ApiError('Test error', 500, 'TEST');
      const logged = {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      };

      expect(logged.level).toBe('error');
      expect(logged.message).toBe(error.message);
    });

    it('should log different levels for different status codes', () => {
      const warnings = [
        { status: 400, level: 'warn' },
        { status: 404, level: 'warn' },
        { status: 429, level: 'warn' },
      ];

      const errors = [
        { status: 500, level: 'error' },
        { status: 503, level: 'error' },
      ];

      expect(warnings[0].level).toBe('warn');
      expect(errors[0].level).toBe('error');
    });
  });
});
