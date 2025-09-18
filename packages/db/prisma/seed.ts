import { prisma } from "../src";
import { hashPassword } from "../../auth/src";

async function main() {
  console.log("🌱 Seeding database with multitenant demo accounts...");

  // Demo tenants data
  const demoTenants = [
    {
      name: "Bella Vista Restaurant",
      slug: "bella-vista",
      themeColor: "#3B82F6",
      currency: "CHF",
      vatRates: { normal: 8.1, reduced: 2.5 },
      address: "Bahnhofstrasse 1, 8001 Zürich",
      user: {
        email: "admin@bellavista.com",
        name: "Marco Rossi",
        password: "demo123",
        role: "OWNER"
      }
    },
    {
      name: "Sushi Zen",
      slug: "sushi-zen",
      themeColor: "#EF4444",
      currency: "CHF",
      vatRates: { normal: 8.1 },
      address: "Niederdorfstrasse 15, 8001 Zürich",
      user: {
        email: "admin@sushizen.com",
        name: "Yuki Tanaka",
        password: "demo123",
        role: "OWNER"
      }
    },
    {
      name: "Café Central",
      slug: "cafe-central",
      themeColor: "#10B981",
      currency: "CHF",
      vatRates: { normal: 8.1, reduced: 2.5 },
      address: "Paradeplatz 8, 8001 Zürich",
      user: {
        email: "admin@cafecentral.com",
        name: "Anna Müller",
        password: "demo123",
        role: "OWNER"
      }
    }
  ];

  // Super admin account that can access all tenants
  const superAdmin = {
    email: "superadmin@demo.com",
    name: "Super Admin",
    password: "demo123"
  };

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdmin.email },
  });

  if (existingSuperAdmin) {
    console.log("✅ Demo accounts already exist");
    console.log("\n🔐 Super Admin (access to all tenants):");
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Password: ${superAdmin.password}`);
    console.log("\n🏪 Demo Tenants:");
    demoTenants.forEach(tenant => {
      console.log(`📧 ${tenant.user.email} | 🔑 ${tenant.user.password} | 🏪 ${tenant.name}`);
    });
    console.log("\n🔗 Login at: http://localhost:3000/admin/auth/login");
    return;
  }

  // Hash passwords
  const hashedSuperAdminPassword = await hashPassword(superAdmin.password);
  const hashedTenantPasswords = await Promise.all(
    demoTenants.map(tenant => hashPassword(tenant.user.password))
  );

  // Create all demo data in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create super admin user
    const superAdminUser = await tx.user.create({
      data: {
        email: superAdmin.email,
        name: superAdmin.name,
        password: hashedSuperAdminPassword,
      },
    });

    const createdTenants: Array<{ user: any; venue: any }> = [];

    // Create demo tenants
    for (let i = 0; i < demoTenants.length; i++) {
      const tenant = demoTenants[i];
      
      // Create tenant user
      const user = await tx.user.create({
        data: {
          email: tenant.user.email,
          name: tenant.user.name,
          password: hashedTenantPasswords[i],
        },
      });

      // Create venue
      const venue = await tx.venue.create({
        data: {
          name: tenant.name,
          vatRates: tenant.vatRates,
          currency: tenant.currency,
          themeColor: tenant.themeColor,
          address: tenant.address,
        },
      });

      // Create owner role for tenant user
      await tx.userVenueRole.create({
        data: {
          userId: user.id,
          venueId: venue.id,
          role: tenant.user.role,
        },
      });

      // Super admin gets access to all tenants (for demo purposes)
      await tx.userVenueRole.create({
        data: {
          userId: superAdminUser.id,
          venueId: venue.id,
          role: "OWNER",
        },
      });

      createdTenants.push({ user, venue });
    }

    return { superAdminUser, tenants: createdTenants };
  });

  console.log("✅ Multitenant demo accounts created successfully!");
  console.log("\n🔐 Super Admin (access to all tenants):");
  console.log(`📧 Email: ${superAdmin.email}`);
  console.log(`🔑 Password: ${superAdmin.password}`);
  console.log("\n🏪 Demo Tenants:");
  demoTenants.forEach(tenant => {
    console.log(`📧 ${tenant.user.email} | 🔑 ${tenant.user.password} | 🏪 ${tenant.name}`);
  });
  console.log("\n🔗 Login at: http://localhost:3000/admin/auth/login");
}

main().then(() => process.exit(0));
