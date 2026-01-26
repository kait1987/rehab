import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking recent users...");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (users.length === 0) {
    console.log("No users found in database.");
  } else {
    console.log(`Found ${users.length} users:`);
    users.forEach((u) => {
      console.log(
        `- ${u.name} (${u.email}) [ClerkID: ${u.clerkId}] - Created: ${u.createdAt.toISOString()}`,
      );
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
