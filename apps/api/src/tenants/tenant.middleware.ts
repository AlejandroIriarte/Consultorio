import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from './tenants.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenantsService: TenantsService) {}

  async use(req: Request & { tenant?: unknown }, _res: Response, next: NextFunction) {
    const host = req.hostname; // e.g. "clinica-xyz.consultorio.app"
    const slug = host.split('.')[0];

    if (!slug || slug === 'www' || slug === 'api') {
      return next();
    }

    const tenant = await this.tenantsService.findBySlug(slug);
    if (!tenant) throw new NotFoundException(`Consultorio "${slug}" no encontrado`);

    req.tenant = tenant;
    next();
  }
}
