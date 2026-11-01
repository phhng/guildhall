import type { z } from 'zod';
import messages from '@/messages/message.json';

export type ErrorCode = 'VALIDATION' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'RATE_LIMITED';

export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public details?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

export function parse<T extends z.ZodTypeAny>(schema: T, data: unknown): z.output<T> {
  const r = schema.safeParse(data);
  if (!r.success) throw new AppError('VALIDATION', r.error.issues[0]?.message ?? 'Invalid input.', r.error.issues);
  return r.data;
}

export const errorMessage = (e: unknown) => (e instanceof AppError ? e.message : messages.errors.unexpected);
