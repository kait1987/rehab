/**
 * ExerciseDB API 테스트 스크립트
 */

require("dotenv").config({ path: ".env.local" });

const https = require("https");

const EXERCISE_DB_API_KEY = process.env.EXERCISE_DB_API_KEY;
const EXERCISE_DB_API_HOST = process.env.EXERCISE_DB_API_HOST || "exercisedb.p.rapidapi.com";

console.log("API Key:", EXERCISE_DB_API_KEY ? EXERCISE_DB_API_KEY.substring(0, 15) + "..." : "NOT SET");
console.log("API Host:", EXERCISE_DB_API_HOST);

async function testSearch(query) {
  const url = `https://${EXERCISE_DB_API_HOST}/exercises/name/${encodeURIComponent(query)}?limit=3`;

  console.log(`\n검색 중: "${query}"`);
  console.log(`URL: ${url}`);

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": EXERCISE_DB_API_KEY,
      "X-RapidAPI-Host": EXERCISE_DB_API_HOST
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      console.log(`Status: ${res.statusCode}`);

      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          console.log(`결과 수: ${Array.isArray(json) ? json.length : 'N/A'}`);

          if (Array.isArray(json) && json.length > 0) {
            console.log("\n첫 번째 결과:");
            console.log(`  이름: ${json[0].name}`);
            console.log(`  부위: ${json[0].bodyPart}`);
            console.log(`  타겟: ${json[0].target}`);
            console.log(`  GIF URL: ${json[0].gifUrl}`);
          }

          resolve(json);
        } catch (e) {
          console.error("JSON 파싱 오류:", data.substring(0, 300));
          reject(e);
        }
      });
    });

    req.on("error", (e) => {
      console.error("요청 오류:", e.message);
      reject(e);
    });

    req.end();
  });
}

async function main() {
  console.log("\n=== ExerciseDB API 테스트 ===\n");

  // 테스트 검색어들
  const testQueries = ["plank", "squat", "push up"];

  for (const query of testQueries) {
    try {
      await testSearch(query);
    } catch (error) {
      console.error(`오류: ${error.message}`);
    }
    console.log("\n" + "=".repeat(50));
  }
}

main();
