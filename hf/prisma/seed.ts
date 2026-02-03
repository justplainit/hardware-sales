import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Welcome123!", 10);
  const [admin, sales, tech, accounts] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@hardwareflow.local" },
      update: {},
      create: {
        name: "Dietrich Admin",
        email: "admin@hardwareflow.local",
        role: "ADMIN",
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "sales@hardwareflow.local" },
      update: {},
      create: {
        name: "Sam Sales",
        email: "sales@hardwareflow.local",
        role: "SALES",
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "tech@hardwareflow.local" },
      update: {},
      create: {
        name: "Terry Tech",
        email: "tech@hardwareflow.local",
        role: "TECH",
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "accounts@hardwareflow.local" },
      update: {},
      create: {
        name: "Alex Accounts",
        email: "accounts@hardwareflow.local",
        role: "ACCOUNTS",
        passwordHash,
      },
    }),
  ]);

  await prisma.appSetting.upsert({
    where: { key: "min_margin_pct" },
    update: { value: "15" },
    create: { key: "min_margin_pct", value: "15" },
  });
  await prisma.appSetting.upsert({
    where: { key: "notify_admin_on_grn" },
    update: { value: "true" },
    create: { key: "notify_admin_on_grn", value: "true" },
  });
  await prisma.appSetting.upsert({
    where: { key: "vat_rate" },
    update: { value: "0.15" },
    create: { key: "vat_rate", value: "0.15" },
  });

  const existingClient = await prisma.client.findFirst({
    where: { name: "Acme Mining" },
  });
  const client =
    existingClient ??
    (await prisma.client.create({
      data: {
        name: "Acme Mining",
        billingEmail: "billing@acmemining.example",
        deliveryAddress: "14 Industrial Way, Cape Town",
        isPrivileged: true,
        paymentTerms: "EOM",
      },
    }));

  const existingSupplier = await prisma.supplier.findFirst({
    where: { name: "ComputeHub Distributors" },
  });
  const supplier =
    existingSupplier ??
    (await prisma.supplier.create({
      data: {
        name: "ComputeHub Distributors",
        contactEmail: "orders@computehub.example",
        defaultLeadDays: 5,
      },
    }));

  const existingQuote = await prisma.quote.findFirst();
  if (!existingQuote) {
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: `Q-${new Date().getFullYear()}-0001`,
        clientId: client.id,
        createdByUserId: tech.id,
        assignedSalesUserId: sales.id,
        status: "DRAFT",
        clientContactName: "Jamie Client",
        clientContactEmail: "jamie.client@example.com",
      },
    });

    await prisma.quoteItem.createMany({
      data: [
        {
          quoteId: quote.id,
          description: "Dell Latitude 5440",
          qty: 2,
          supplierId: supplier.id,
          costPrice: 1500,
          sellPrice: 2200,
          marginPct: 31.8,
          assignedTechnicianUserId: tech.id,
        },
        {
          quoteId: quote.id,
          description: "Docking station + 2 monitors bundle",
          qty: 2,
          supplierId: supplier.id,
          costPrice: 600,
          sellPrice: 950,
          marginPct: 36.8,
          assignedTechnicianUserId: tech.id,
        },
      ],
    });
  }

  console.info("Seed complete:", {
    admin: admin.email,
    sales: sales.email,
    tech: tech.email,
    accounts: accounts.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
