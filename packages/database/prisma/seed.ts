import { PrismaClient, UserRole, Plan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding development database...');

  // Demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Clínica Demo',
      plan: Plan.PRO,
      config: {
        create: {
          address: 'Av. Arce 2345, La Paz',
          phone: '+591 2 2123456',
          email: 'contacto@clinicademo.bo',
          timezone: 'America/La_Paz',
          country: 'BO',
        },
      },
    },
    include: { config: true },
  });

  console.log(`Tenant: ${tenant.name} (slug: ${tenant.slug})`);

  const users: Array<{ role: UserRole; email: string; firstName: string; lastName: string }> = [
    { role: UserRole.OWNER, email: 'owner@demo.bo', firstName: 'Carlos', lastName: 'Mendoza' },
    { role: UserRole.ADMIN, email: 'admin@demo.bo', firstName: 'Ana', lastName: 'Torres' },
    { role: UserRole.DOCTOR, email: 'medico@demo.bo', firstName: 'Dr. Pablo', lastName: 'Quispe' },
    { role: UserRole.RECEPTIONIST, email: 'recepcion@demo.bo', firstName: 'María', lastName: 'Vargas' },
    { role: UserRole.PATIENT, email: 'paciente@demo.bo', firstName: 'Juan', lastName: 'Flores' },
  ];

  const PASSWORD = 'Demo123!';
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log(`  User [${user.role}]: ${user.email}`);
  }

  console.log(`\nAll seeded users have password: ${PASSWORD}`);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
