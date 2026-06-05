import { BadRequestException } from '@nestjs/common';
import { SanitizeMiddleware } from '../sanitize.middleware';
import { Request, Response } from 'express';

function makeReq(body: unknown, query: Record<string, string> = {}): Request {
  return { body, query } as unknown as Request;
}

describe('SanitizeMiddleware', () => {
  let middleware: SanitizeMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new SanitizeMiddleware();
    next = jest.fn();
  });

  it('should pass clean input through', () => {
    const req = makeReq({ email: 'user@example.com', password: 'Segura123!' });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body.email).toBe('user@example.com');
  });

  it('should strip null bytes', () => {
    const req = makeReq({ email: 'user\0@example.com' });
    middleware.use(req, {} as Response, next);
    expect(req.body.email).toBe('user@example.com');
  });

  it('should throw on SQL injection attempt — SELECT', () => {
    const req = makeReq({ email: "' OR SELECT * FROM users--" });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
  });

  it('should throw on SQL injection attempt — UNION', () => {
    const req = makeReq({ name: "' UNION SELECT password FROM users--" });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
  });

  it('should throw on SQL injection attempt — comment sequence', () => {
    const req = makeReq({ email: "admin'--" });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
  });

  it('should throw on NoSQL injection — $where operator', () => {
    const req = makeReq({ filter: { $where: 'this.password === "secret"' } });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
  });

  it('should throw on NoSQL injection — $ key prefix', () => {
    const req = makeReq({ '$gt': '' });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
  });

  it('should throw if string exceeds max length', () => {
    const req = makeReq({ email: 'a'.repeat(1001) });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
  });

  it('should sanitize array elements', () => {
    const req = makeReq({ tags: ['normal', 'also-normal'] });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should throw on SQL injection inside array element', () => {
    const req = makeReq({ tags: ['normal', "'; DROP TABLE users;--"] });
    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
  });
});
