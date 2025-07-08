const express = require("express");
const { getSQLFromPrompt, runQuery } = require("./queryEngine");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3200;

app.use(express.json());

app.post("/ask", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const sql = await getSQLFromPrompt(prompt);
    console.log("🧠 Generated SQL:", sql);

    const result = await runQuery(sql);
    res.json({ sql, result });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
