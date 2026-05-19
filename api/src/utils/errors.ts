export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Token tidak valid atau sudah kedaluwarsa') {
    super(401, message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak') {
    super(403, message)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors?: unknown) {
    super(422, message, errors)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errors?: unknown) {
    super(400, message, errors)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Data tidak ditemukan') {
    super(404, message)
  }
}
