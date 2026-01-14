const { distributeTime } = require("../src/lib/utils/distribute-time");

// Mock exercises
const mockExercise = {
  exerciseTemplateId: "ex1",
  exerciseTemplateName: "Test Exercise",
  bodyPartIds: ["bp1"],
  priorityScore: 10,
  section: "warmup",
  orderInSection: 0,
  durationMinutes: 5, // Original duration
  sets: 3,
  reps: 10,
  intensityLevel: 2,
  difficultyScore: 1,
};

const exercises = {
  warmup: [mockExercise],
  main: [],
  cooldown: [],
};

console.log("--- Test 1: 90 min course (Target Warmup: 12 min) ---");
const result90 = distributeTime(exercises, 90);
const warmup90 = result90.filter((e) => e.section === "warmup");
const totalWarmup90 = warmup90.reduce((sum, e) => sum + e.durationMinutes, 0);

console.log(`Total Warmup Time: ${totalWarmup90} min`);
console.log(`Exercise Count: ${warmup90.length}`);
warmup90.forEach((e, i) => {
  console.log(`  Ex ${i + 1}: ${e.durationMinutes} min`);
});

if (totalWarmup90 > 15) {
  console.log("❌ FAIL: Warmup time exceeds 15 minutes");
} else {
  console.log("✅ PASS: Warmup time is within limit");
}
