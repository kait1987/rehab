import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
  console.log("🔄 Syncing users from Clerk to Database...");

  // 1. Clerk에서 사용자 목록 가져오기
  const clerkUsers = await clerk.users.getUserList({
    limit: 100,
  });

  console.log(`📡 Found ${clerkUsers.data.length} users in Clerk.`);

  for (const user of clerkUsers.data) {
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    )?.emailAddress;

    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") || "User";

    console.log(`Processing: ${displayName} (${primaryEmail}) - ${user.id}`);

    // 2. DB에 Upsert (없으면 생성, 있으면 업데이트)
    await prisma.user.upsert({
      where: { clerkId: user.id },
      update: {
        email: primaryEmail,
        name: displayName,
        displayName: displayName,
      },
      create: {
        clerkId: user.id,
        email: primaryEmail,
        name: displayName,
        displayName: displayName,
        isActive: true,
      },
    });
  }

  console.log("✅ Sync completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Sync failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
