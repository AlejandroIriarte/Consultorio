import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Patterns that indicate SQL injection attempts
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE)\b)/i,
  /(--|;|\/\*|\*\/|xp_)/i,
  /(\bOR\b\s+\d+=\d+|\bAND\b\s+\d+=\d+)/i,
  /(['"])\s*OR\s*\1/i,
];

// NoSQL injection patterns
const NOSQL_INJECTION_PATTERNS = [/\$where/, /\$gt/, /\$lt/, /\$ne/, /\$in/, /\$regex/];

const MAX_STRING_LENGTH = 1000;
const MAX_BODY_DEPTH = 5;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_BODY_DEPTH) return '[too deep]';

  if (typeof value === 'string') {
    // Strip null bytes (common in SQL injection payloads)
    const cleaned = value.replace(/\0/g, '').trim();

    if (cleaned.length > MAX_STRING_LENGTH) {
      throw new BadRequestException('Entrada demasiado larga');
    }

    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(cleaned)) {
        throw new BadRequestException('Entrada inválida detectada');
      }
    }

    for (const pattern of NOSQL_INJECTION_PATTERNS) {
      if (pattern.test(cleaned)) {
        throw new BadRequestException('Entrada inválida detectada');
      }
    }

    return cleaned;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Reject keys that start with $ (NoSQL operators)
      if (k.startsWith('$')) {
        throw new BadRequestException('Entrada inválida detectada');
      }
      sanitized[k] = sanitizeValue(v, depth + 1);
    }
    return sanitized;
  }

  return value;
}

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
      }

      if (req.query) {
        for (const [key, val] of Object.entries(req.query)) {
          req.query[key] = sanitizeValue(val) as string;
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  }
}
