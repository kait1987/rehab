const fs = require("fs");
const path = require("path");

// 1. Read n8n_exercises.json file
const exercisesJsonPath = path.join(__dirname, "..", "n8n_exercises.json");

if (!fs.existsSync(exercisesJsonPath)) {
  console.error(`Error: n8n_exercises.json not found at ${exercisesJsonPath}`);
  process.exit(1);
}

let exercisesData = [];

try {
  const fileContent = fs.readFileSync(exercisesJsonPath, "utf8");
  exercisesData = JSON.parse(fileContent);
  console.log(`Loaded ${exercisesData.length} exercises from n8n_exercises.json`);
} catch (e) {
  console.error("Error reading n8n_exercises.json:", e);
  process.exit(1);
}

// Validate data structure
if (!Array.isArray(exercisesData) || exercisesData.length === 0) {
  console.error("Error: n8n_exercises.json must contain a non-empty array");
  process.exit(1);
}

// Validate each exercise has required fields
for (const ex of exercisesData) {
  if (!ex.name || !ex.filename || !ex.prompt) {
    console.error("Error: Each exercise must have name, filename, and prompt fields");
    process.exit(1);
  }
}

// 4. Construct n8n Workflow JSON
const workflow = {
  name: "Nano Banana Image Gen (Gemini)",
  nodes: [
    {
      parameters: {},
      id: "trigger-node",
      name: 'When clicking "Execute Workflow"',
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [460, 460],
    },
    {
      parameters: {
        jsCode: `return ${JSON.stringify(exercisesData)};`,
      },
      id: "set-data-node",
      name: "Set Exercise List",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [680, 460],
    },
    {
      parameters: {
        batchSize: 1,
        options: {},
      },
      id: "split-node",
      name: "Split In Batches",
      type: "n8n-nodes-base.splitInBatches",
      typeVersion: 3,
      position: [900, 460],
    },
    {
      parameters: {
        method: "POST",
        url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
        authentication: "none",
        sendQuery: true,
        queryParameters: {
          key: "YOUR_GEMINI_API_KEY_HERE",
        },
        sendBody: true,
        contentType: "json",
        bodyParameters: {
          parameters: [
            {
              name: "contents",
              value:
                '={{ [ { "parts": [ { "text": "Generate an image based on this prompt: " + $json.prompt } ] } ] }}',
            },
          ],
        },
        options: {},
      },
      id: "api-request-node",
      name: "Gemini API Call",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.1,
      position: [1140, 460],
      notes:
        "Replace YOUR_GEMINI_API_KEY_HERE with your actual Gemini API key. This calls Gemini 2.0 Flash Experimental model for image generation.",
    },
    {
      parameters: {
        jsCode: `// Extract base64 image from Gemini API response
const response = $input.item.json;

// Gemini API response structure:
// response.candidates[0].content.parts[0].inlineData.data (base64)
// response.candidates[0].content.parts[0].inlineData.mimeType

let base64Data = null;
let mimeType = 'image/png';

try {
  if (response.candidates && response.candidates[0]) {
    const candidate = response.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
      const part = candidate.content.parts[0];
      if (part.inlineData) {
        base64Data = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
      }
    }
  }
  
  if (!base64Data) {
    throw new Error('No image data found in Gemini API response');
  }
  
  // Get original exercise data from Split In Batches node
  const exerciseData = $node['Split In Batches'].json;
  
  return [{
    json: {
      name: exerciseData.name,
      filename: exerciseData.filename,
      prompt: exerciseData.prompt,
      mimeType: mimeType
    },
    binary: {
      data: {
        data: base64Data,
        mimeType: mimeType,
        fileName: exerciseData.filename
      }
    }
  }];
} catch (error) {
  throw new Error(\`Failed to extract image from Gemini response: \${error.message}\`);
}`,
      },
      id: "extract-image-node",
      name: "Extract Base64 Image",
      type: "n8n-nodes-base.code",
      typeVersion: 2,
      position: [1360, 460],
      notes: "Extracts base64 image data from Gemini API response and converts it to binary format.",
    },
    {
      parameters: {
        amount: 2,
        unit: "seconds",
      },
      id: "wait-node",
      name: "Wait (Rate Limit)",
      type: "n8n-nodes-base.wait",
      typeVersion: 1,
      position: [1580, 460],
    },
    {
      parameters: {
        fileName:
          "={{ 'public/images/exercises/' + $node['Split In Batches'].json.filename }}",
        options: {},
      },
      id: "save-file-node",
      name: "Save to Disk",
      type: "n8n-nodes-base.writeBinaryFile",
      typeVersion: 1,
      position: [1800, 460],
    },
  ],
  connections: {
    'When clicking "Execute Workflow"': {
      main: [[{ node: "Set Exercise List", type: "main", index: 0 }]],
    },
    "Set Exercise List": {
      main: [[{ node: "Split In Batches", type: "main", index: 0 }]],
    },
    "Split In Batches": {
      main: [[{ node: "Nano Banana (Gemini API)", type: "main", index: 0 }]],
    },
    "Gemini API Call": {
      main: [[{ node: "Extract Base64 Image", type: "main", index: 0 }]],
    },
    "Extract Base64 Image": {
      main: [[{ node: "Wait (Rate Limit)", type: "main", index: 0 }]],
    },
    "Wait (Rate Limit)": {
      main: [[{ node: "Save to Disk", type: "main", index: 0 }]],
    },
    "Save to Disk": {
      main: [[{ node: "Split In Batches", type: "main", index: 0 }]],
    },
  },
};

// 5. Write to Artifact
// 프로젝트 루트에 파일 생성
const outputPath = path.join(__dirname, "..", "n8n_nano_banana_workflow.json");
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
console.log(`Workflow created at: ${outputPath}`);
