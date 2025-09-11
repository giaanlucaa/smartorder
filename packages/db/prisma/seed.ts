import { prisma } from "../src";
import { hashPassword } from "../../auth/src";
import { randomBytes } from "crypto";

async function main() {
  console.log("🌱 Seeding database with complete demo setup...");

  // Check if test user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@demo.com" },
  });

  if (existingUser) {
    console.log("✅ Test account already exists");
    console.log("📧 Email: admin@demo.com");
    console.log("🔑 Password: demo123");
    return;
  }

  // Hash password for test user
  const hashedPassword = await hashPassword("demo123");

  // Create complete demo setup in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create test user
    const user = await tx.user.create({
      data: {
        email: "admin@demo.com",
        name: "Demo Admin",
        password: hashedPassword,
      },
    });

    // Create demo venue
    const venue = await tx.venue.create({
      data: {
        name: "Demo Restaurant",
        vatRates: { normal: 8.1 },
        currency: "CHF",
        themeColor: "#3B82F6",
      },
    });

    // Create owner role
    await tx.userVenueRole.create({
      data: {
        userId: user.id,
        venueId: venue.id,
        role: "OWNER",
      },
    });

    // Create areas
    const saal = await tx.area.create({
      data: {
        name: "Saal",
        venueId: venue.id,
      },
    });

    const terrasse = await tx.area.create({
      data: {
        name: "Terrasse",
        venueId: venue.id,
      },
    });

    // Create tables with QR tokens
    const table1 = await tx.table.create({
      data: {
        label: "T1",
        areaId: saal.id,
        venueId: venue.id,
        qrToken: randomBytes(32).toString('hex'),
      },
    });

    const table2 = await tx.table.create({
      data: {
        label: "T2",
        areaId: saal.id,
        venueId: venue.id,
        qrToken: randomBytes(32).toString('hex'),
      },
    });

    const table3 = await tx.table.create({
      data: {
        label: "T3",
        areaId: saal.id,
        venueId: venue.id,
        qrToken: randomBytes(32).toString('hex'),
      },
    });

    const table4 = await tx.table.create({
      data: {
        label: "T4",
        areaId: terrasse.id,
        venueId: venue.id,
        qrToken: randomBytes(32).toString('hex'),
      },
    });

    const table5 = await tx.table.create({
      data: {
        label: "T5",
        areaId: terrasse.id,
        venueId: venue.id,
        qrToken: randomBytes(32).toString('hex'),
      },
    });

    // Create menu categories
    const burgers = await tx.menuCategory.create({
      data: {
        name: "Burgers",
        venueId: venue.id,
        position: 1,
      },
    });

    const pizza = await tx.menuCategory.create({
      data: {
        name: "Pizza",
        venueId: venue.id,
        position: 2,
      },
    });

    const getraenke = await tx.menuCategory.create({
      data: {
        name: "Getränke",
        venueId: venue.id,
        position: 3,
      },
    });

    // Create menu items
    await tx.menuItem.createMany({
      data: [
        // Burgers
        {
          name: "Classic Burger",
          description: "Rindfleisch-Patty, Salat, Tomate, Zwiebel, Sauce",
          price: 18.50,
          taxRate: 8.1,
          categoryId: burgers.id,
          allergens: [],
        },
        {
          name: "Chicken Burger",
          description: "Hähnchenbrust, Salat, Tomate, Mayo",
          price: 16.90,
          taxRate: 8.1,
          categoryId: burgers.id,
          allergens: [],
        },
        {
          name: "Veggie Burger",
          description: "Gemüse-Patty, Salat, Tomate, Avocado",
          price: 17.50,
          taxRate: 8.1,
          categoryId: burgers.id,
          allergens: [],
        },
        // Pizza
        {
          name: "Margherita",
          description: "Tomaten, Mozzarella, Basilikum",
          price: 22.00,
          taxRate: 8.1,
          categoryId: pizza.id,
          allergens: [],
        },
        {
          name: "Prosciutto",
          description: "Tomaten, Mozzarella, Schinken",
          price: 26.50,
          taxRate: 8.1,
          categoryId: pizza.id,
          allergens: [],
        },
        {
          name: "Quattro Stagioni",
          description: "Tomaten, Mozzarella, Schinken, Pilze, Artischocken, Oliven",
          price: 28.00,
          taxRate: 8.1,
          categoryId: pizza.id,
          allergens: [],
        },
        // Getränke
        {
          name: "Coca Cola",
          description: "0.33L",
          price: 4.50,
          taxRate: 8.1,
          categoryId: getraenke.id,
          allergens: [],
        },
        {
          name: "Bier",
          description: "0.5L Helles",
          price: 5.50,
          taxRate: 8.1,
          categoryId: getraenke.id,
          allergens: [],
        },
      ],
    });

    return { user, venue, tables: [table1, table2, table3, table4, table5] };
  });

  console.log("✅ Complete demo setup created successfully!");
  console.log("📧 Email: admin@demo.com");
  console.log("🔑 Password: demo123");
  console.log("🏪 Restaurant: Demo Restaurant");
  console.log("🔗 Login at: http://localhost:3000/admin/auth/login");
  console.log("\n🍽️ Demo Menu URLs:");
  console.log(`Tisch 1: http://localhost:3000/t/${result.venue.id}/${result.tables[0].qrToken}`);
  console.log(`Tisch 2: http://localhost:3000/t/${result.venue.id}/${result.tables[1].qrToken}`);
  console.log(`Tisch 3: http://localhost:3000/t/${result.venue.id}/${result.tables[2].qrToken}`);
  console.log(`Tisch 4: http://localhost:3000/t/${result.venue.id}/${result.tables[3].qrToken}`);
  console.log(`Tisch 5: http://localhost:3000/t/${result.venue.id}/${result.tables[4].qrToken}`);
}

main().then(() => process.exit(0));
