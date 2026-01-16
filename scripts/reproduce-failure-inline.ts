import { PrismaClient } from "@prisma/client";
import { calculatePriorityScore } from "@/lib/utils/calculate-priority";
import { deduplicateExercises } from "@/lib/utils/deduplicate-exercises";
import { filterContraindications } from "@/lib/utils/filter-contraindications";
import { classifyBySection } from "@/lib/utils/classify-by-section";
import { distributeTime } from "@/lib/utils/distribute-time";
import { adjustDifficultyForUser } from "@/lib/algorithms/adjust-difficulty";
import { filterByDifficultyRange } from "@/lib/utils/filter-by-difficulty";
import { mapExperienceLevel } from "@/lib/utils/map-experience-level";

const prisma = new PrismaClient();

// Types
type ExperienceLevel = "beginner" | "intermediate" | "advanced";
interface MergeRequest {
  bodyParts: { bodyPartId: string; bodyPartName: string; painLevel: number }[];
  equipmentAvailable: string[];
  painLevel: number;
  experienceLevel: ExperienceLevel;
  totalDurationMinutes: 60 | 90 | 120 | undefined;
}

// Inline Logic
async function mergeBodyParts(
  request: MergeRequest,
  intensityAdjustment: number = 0,
) {
  console.log("!!! INLINE FUNCTION CALLED !!!");
  const warnings: string[] = [];
  const bodyPartIds = request.bodyParts.map((bp) => bp.bodyPartId);

  const mappings = await prisma.bodyPartExerciseMapping.findMany({
    where: {
      bodyPartId: { in: bodyPartIds },
      isActive: true,
    },
    include: {
      exerciseTemplate: {
        include: {
          exerciseEquipmentMappings: {
            include: { equipmentType: true },
          },
        },
      },
      bodyPart: true,
    },
    orderBy: [{ bodyPartId: "asc" }, { priority: "asc" }],
  });

  const exercisesWithScores: any[] = []; // Use any for brevity in inline script

  for (const mapping of mappings) {
    const bodyPart = request.bodyParts.find(
      (bp) => bp.bodyPartId === mapping.bodyPartId,
    );
    if (!bodyPart) continue;
    if (!mapping.exerciseTemplate.isActive) continue;

    // Skip pain check logic for brevity, assuming standard matching for now or simplified

    // Equipment Check
    console.log(`[CHECK] Candidate: ${mapping.exerciseTemplate.name}`);
    const exerciseEquipment =
      mapping.exerciseTemplate.exerciseEquipmentMappings.map(
        (e) => e.equipmentType.name,
      );

    const userEquipmentSet = new Set(request.equipmentAvailable || []);

    if (mapping.exerciseTemplate.name.includes("Glute Bridge")) {
      console.log(
        `[GLUTE DEBUG] Eqs: ${JSON.stringify(
          exerciseEquipment,
        )}, User: ${JSON.stringify(Array.from(userEquipmentSet))}`,
      );
    }
    const isNoEquipmentExercise =
      exerciseEquipment.length === 1 && exerciseEquipment[0] === "없음";
    const hasAllRequiredEquipment = exerciseEquipment.every(
      (eq) => eq === "없음" || userEquipmentSet.has(eq),
    );

    if (!isNoEquipmentExercise && !hasAllRequiredEquipment) {
      console.log(
        `  [SKIP] Equipment mismatch. Req: ${exerciseEquipment.join(
          ",",
        )}, UserHas: ${Array.from(userEquipmentSet).join(",")}`,
      );
      continue;
    }

    const priorityScore = calculatePriorityScore(
      bodyPart as any,
      mapping.priority,
      mapping.intensityLevel || 2,
    );

    exercisesWithScores.push({
      exerciseTemplateId: mapping.exerciseTemplateId,
      exerciseTemplateName: mapping.exerciseTemplate.name,
      bodyPartIds: [mapping.bodyPartId],
      priorityScore,
      section: "main",
      intensityLevel:
        mapping.intensityLevel || mapping.exerciseTemplate.intensityLevel,
      difficultyScore: mapping.exerciseTemplate.difficultyScore,
      // ... minimal fields
    });
  }

  // Difficulty Filtering Logic with Logging
  let filteredByDifficulty = exercisesWithScores;
  if (request.experienceLevel) {
    const experienceLevel = mapExperienceLevel(request.experienceLevel);
    const difficultyAdjustment = adjustDifficultyForUser({
      experienceLevel,
      painLevel: request.painLevel,
    });

    console.log(
      `[DEBUG] Pain: ${request.painLevel}, Range: ${JSON.stringify(
        difficultyAdjustment.allowedRange,
      )}`,
    );

    filteredByDifficulty = filterByDifficultyRange(
      exercisesWithScores,
      difficultyAdjustment.allowedRange,
    );

    console.log(
      `[DEBUG] Filtered: ${exercisesWithScores.length} -> ${filteredByDifficulty.length}`,
    );
    filteredByDifficulty.forEach((ex) =>
      console.log(
        ` - ${ex.exerciseTemplateName} (Diff: ${ex.difficultyScore}, Int: ${ex.intensityLevel})`,
      ),
    );
  }

  // Contraindications
  // ... skipped for brevity unless needed

  // Classification
  const classified = classifyBySection(filteredByDifficulty);
  console.log(
    `[DEBUG] Classified: Main=${classified.main.length}, Warmup=${classified.warmup.length}`,
  );

  return { exercises: [], warnings: [] }; // Mock return
}

async function main() {
  const pelvis = await prisma.bodyPart.findFirst({ where: { name: "골반" } });
  const bodyweight = await prisma.equipmentType.findFirst({
    where: { name: "맨몸" },
  });

  if (!pelvis || !bodyweight) return;

  console.log("Starting inline test...");

  await mergeBodyParts({
    bodyParts: [
      { bodyPartId: pelvis.id, bodyPartName: pelvis.name, painLevel: 5 },
    ],
    equipmentAvailable: [bodyweight.name],
    painLevel: 5,
    experienceLevel: "beginner",
    totalDurationMinutes: 90,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
