const readline = require("readline");
const { getSQLFromPrompt, runQuery } = require("./queryEngine");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Ask your question: ", async (input) => {
  try {
    const sql = await getSQLFromPrompt(input);
    console.log("\n🧠 Generated SQL:\n", sql);

    const result = await runQuery(sql);
    console.log("\n📦 Query Result:\n", result);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    rl.close();
  }
});
