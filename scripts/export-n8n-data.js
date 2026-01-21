const fs = require("fs");
const path = require("path");

// 1. Read Template Files
const templateDir = path.join(__dirname, "../templates");
const templateFiles = [
  "exercise-templates-real.json",
  "exercise-templates-additional.json",
];

let allExercises = [];

try {
  templateFiles.forEach((file) => {
    const filePath = path.join(templateDir, file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      allExercises = [...allExercises, ...data];
    }
  });
} catch (e) {
  // If template files are missing, fallback to empty or handle error
  console.log("Error reading templates, using empty list");
}

// Remove duplicates
const uniqueExercises = Array.from(
  new Map(allExercises.map((ex) => [ex.name, ex])).values(),
);

// 2. Define Prompt Logic
function getPrompt(name) {
  const n = name.toLowerCase();

  if (n.includes("스쿼트"))
    return `Minimalist vector illustration of a person doing a Squat, knees bent, back straight, side view, clean lines, white background, medical rehabilitation style`;
  if (n.includes("플랭크"))
    return `Minimalist vector illustration of a person doing a Plank, straight body line, forearm support, side view, clean lines, white background`;
  if (n.includes("런지"))
    return `Minimalist vector illustration of a person doing a Lunge, one knee down, side view, clean lines, white background`;
  if (n.includes("스트레칭"))
    return `Minimalist vector illustration of a person stretching (${name}), gentle pose, clean lines, white background`;
  if (n.includes("브릿지") || n.includes("힙 레이즈"))
    return `Minimalist vector illustration of a Glute Bridge exercise, lifting hips while lying on back, side view, clean lines, white background`;
  if (n.includes("푸쉬업") || n.includes("푸시업"))
    return `Minimalist vector illustration of a Push-up, straight body, side view, clean lines, white background`;
  if (n.includes("덤벨"))
    return `Minimalist vector illustration of a person exercising with dumbbells (${name}), clean lines, white background`;
  if (n.includes("밴드"))
    return `Minimalist vector illustration of a person exercising with a resistance band (${name}), clean lines, white background`;

  return `Minimalist vector illustration of a person performing ${name} exercise, simple, clean lines, white background, medical rehabilitation style`;
}

// 3. Prepare Data
const exercisesData = uniqueExercises.map((ex) => ({
  name: ex.name,
  filename:
    ex.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9가-힣_]/g, "") + ".png",
  prompt: getPrompt(ex.name),
}));

// 4. Generate the JS Code String for user
const jsCodeContent = `
// ------------------------------------------------------------------
// 👇 아래 코드를 n8n 'Code' 노드에 복사해서 붙여넣으세요! 👇
// ------------------------------------------------------------------

const exercises = ${JSON.stringify(exercisesData, null, 2)};

return exercises.map(ex => ({ json: ex }));
`;

// 5. Write to File
const outputPath = path.resolve(
  "C:\\coding\\REHAP_APP\\nextjs-supabase-boilerplate-main\\n8n_exercises.js",
);
fs.writeFileSync(outputPath, jsCodeContent);
console.log(`Code generated at: ${outputPath}`);
