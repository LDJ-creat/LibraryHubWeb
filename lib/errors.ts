export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', data?: unknown) {
    super(message, 401, data);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', data?: unknown) {
    super(message, 404, data);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ServerError extends ApiError {
  constructor(message = 'Internal server error', data?: unknown) {
    super(message, 500, data);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}
