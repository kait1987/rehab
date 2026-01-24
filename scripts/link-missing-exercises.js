const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IMAGES_DIR = path.join(__dirname, "../public/images/exercises");

// JSON name -> DB name mappings (manually identified)
const NAME_MAPPINGS = {
  "시티드 로우 (Seated Row)": "시티드 로우",
  "차일드 포즈 (Child's Pose)": "등 스트레칭 (차일드 포즈)",
  "어깨 스트레칭 (Shoulder Stretch)": "가슴 스트레칭", // 실제로는 Chest stretch
  "힙 플렉서 런지 (Hip Flexor Lunge)": "힙 플렉서 스트레칭",
  "발목 스트레칭 (Ankle Stretch)": "카프 스트레칭", // 실제로는 Calf stretch
  "손목 스트레칭 (Wrist Stretch)": "전완 스트레칭", // Forearm stretch
};

// JSON name -> filename (from n8n_exercises.json)
const FILENAMES = {
  "시티드 로우 (Seated Row)": "시티드_로우_(Seated_Row).png",
  "차일드 포즈 (Child's Pose)": "등_스트레칭_차일드_포즈.png",
  "어깨 스트레칭 (Shoulder Stretch)": "어깨_스트레칭_Shoulder_Stretch.png",
  "힙 플렉서 런지 (Hip Flexor Lunge)": "힙_플렉서_런지_(Hip_Flexor_Lunge).png",
  "발목 스트레칭 (Ankle Stretch)": "발목_스트레칭_Ankle_Stretch.png",
  "손목 스트레칭 (Wrist Stretch)": "손목_스트레칭_Wrist_Stretch.png",
};

async function main() {
  console.log("🔗 Linking 6 missing exercise images...\n");

  for (const [jsonName, dbName] of Object.entries(NAME_MAPPINGS)) {
    const filename = FILENAMES[jsonName];

    // Find actual file
    let targetFilename = null;
    const potentialPaths = [filename, filename + ".jpg"];
    for (const p of potentialPaths) {
      if (fs.existsSync(path.join(IMAGES_DIR, p))) {
        targetFilename = p;
        break;
      }
    }

    if (!targetFilename) {
      console.log(`❌ File not found: ${filename}`);
      continue;
    }

    // Find DB record
    const dbExercise = await prisma.exerciseTemplate.findFirst({
      where: { name: dbName },
    });

    if (!dbExercise) {
      console.log(`❌ DB record not found: ${dbName}`);
      continue;
    }

    // Update
    const imageUrl = `/images/exercises/${targetFilename}`;
    await prisma.exerciseTemplate.update({
      where: { id: dbExercise.id },
      data: { imageUrl },
    });

    console.log(`✅ ${dbName} -> ${imageUrl}`);
  }

  console.log("\n📊 Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
