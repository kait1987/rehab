const { distributeTime } = require("../src/lib/utils/distribute-time");

// Mock exercises
const mockExercise = {
  exerciseTemplateId: "ex1",
  exerciseTemplateName: "Test Exercise",
  bodyPartIds: ["bp1"],
  priorityScore: 10,
  section: "warmup",
  orderInSection: 0,
  durationMinutes: 5,
  sets: 3,
  reps: 10,
  intensityLevel: 2,
  difficultyScore: 1,
};

const exercises = {
  warmup: [
    {
      ...mockExercise,
      exerciseTemplateId: "w1",
      exerciseTemplateName: "Warmup 1",
    },
    {
      ...mockExercise,
      exerciseTemplateId: "w2",
      exerciseTemplateName: "Warmup 2",
    },
    {
      ...mockExercise,
      exerciseTemplateId: "w3",
      exerciseTemplateName: "Warmup 3",
    },
  ],
  main: [
    {
      ...mockExercise,
      exerciseTemplateId: "m1",
      exerciseTemplateName: "Main 1",
      section: "main",
    },
    {
      ...mockExercise,
      exerciseTemplateId: "m2",
      exerciseTemplateName: "Main 2",
      section: "main",
    },
  ],
  cooldown: [
    {
      ...mockExercise,
      exerciseTemplateId: "c1",
      exerciseTemplateName: "Cooldown 1",
      section: "cooldown",
    },
  ],
};

function testDuration(duration) {
  console.log(`\n=== Testing ${duration} min Course ===`);
  try {
    const result = distributeTime(exercises, duration);

    const warmup = result.filter((e) => e.section === "warmup");
    const main = result.filter((e) => e.section === "main");
    const cooldown = result.filter((e) => e.section === "cooldown");

    const warmupTime = warmup.reduce((s, e) => s + (e.durationMinutes || 0), 0);
    const cooldownTime = cooldown.reduce(
      (s, e) => s + (e.durationMinutes || 0),
      0,
    );

    console.log(`Warmup: ${warmupTime}m (${warmup.length} items)`);
    console.log(`Main: ${main.length} items`);
    console.log(`Cooldown: ${cooldownTime}m (${cooldown.length} items)`);

    // Verify Warmup
    if (warmupTime < 5 || warmupTime > 15) {
      console.error("❌ FAIL: Warmup time out of range (5-15m)");
    } else if (warmupTime === 20) {
      console.error("❌ FAIL: Warmup time is 20m (Forbidden)");
    } else {
      console.log("✅ PASS: Warmup time OK");
    }

    // Verify Cooldown
    if (cooldownTime < 5) {
      console.error("❌ FAIL: Cooldown time < 5m");
    } else {
      console.log("✅ PASS: Cooldown time OK");
    }

    // Verify Sets/Reps
    const maxSets = Math.max(...result.map((e) => e.sets || 0));
    const maxReps = Math.max(...result.map((e) => e.reps || 0));
    console.log(`Max Sets: ${maxSets}, Max Reps: ${maxReps}`);

    if (maxSets > 5) console.error("❌ FAIL: Sets > 5");
    if (maxReps > 20) console.error("❌ FAIL: Reps > 20");
  } catch (e) {
    console.error("❌ ERROR:", e.message);
  }
}

testDuration(60);
testDuration(90);
testDuration(120);
