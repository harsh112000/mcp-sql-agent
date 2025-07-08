const axios = require("axios");
const { Sequelize } = require("sequelize");
require("dotenv").config();

// Setup Sequelize with SSL support (required for Azure MySQL)
const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: "mysql",
  dialectOptions: {
    ssl: {
      require: true,
    },
  },
  logging: false, // Set to true if you want SQL logs
});

// Validate unsafe queries like DELETE/UPDATE
function isSafeQuery(sql) {
  const unsafe = /drop|delete|truncate|update|insert|alter|create/i;
  return !unsafe.test(sql);
}

// Convert natural language to SQL using OpenAI API
// async function getSQLFromPrompt(prompt) {
//   try {
//     const res = await axios.post(
//       "https://api.openai.com/v1/completions",
//       {
//         model: "gpt-3.5-turbo-instruct", // upgraded model
//         prompt: `Convert this to a safe SQL query:\n${prompt}\nOnly give the SQL query.`,
//         max_tokens: 150,
//         temperature: 0,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//         },
//       }
//     );

//     const sql = res.data.choices[0].text.trim();

//     if (!isSafeQuery(sql)) {
//       throw new Error("⚠️ Unsafe SQL detected. Operation blocked.");
//     }

//     return sql;
//   } catch (err) {
//     console.error("Error generating SQL:", err.message);
//     throw err;
//   }
// }
// async function getSQLFromPrompt(prompt) {
//   try {
//     const res = await axios.post(
//       "https://api.openai.com/v1/chat/completions",
//       {
//         model: "gpt-3.5-turbo",
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are an expert SQL generator. Only return the SQL query without explanation.",
//           },
//           {
//             role: "user",
//             content: `Convert this into a SQL query for a MySQL database with only a 'banner' table:\n${prompt}`,
//           },
//         ],
//         temperature: 0,
//         max_tokens: 150,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//         },
//       }
//     );

//     const sql = res.data.choices[0].message.content.trim();

//     if (!isSafeQuery(sql)) {
//       throw new Error("⚠️ Unsafe SQL detected. Operation blocked.");
//     }

//     return sql;
//   } catch (err) {
//     console.error("Error generating SQL:", err.message);
//     throw err;
//   }
// }

async function getSQLFromPrompt(prompt) {
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        // model: "mixtral-8x7b-32768", // or "llama3-70b-8192"
          model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that writes MySQL SQL queries. Return ONLY the SQL query.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0,
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const sql = res.data.choices[0].message.content.trim();

    if (!isSafeQuery(sql)) {
      throw new Error("⚠️ Unsafe SQL detected. Operation blocked.");
    }

    return sql;
  } catch (err) {
    if (err.response) {
      console.error("Error from Groq:", err.response.data);
    }
    console.error("Error generating SQL from Groq:", err.message);
    throw err;
  }
}



// Run the generated SQL on the connected DB
async function runQuery(sql) {
  try {
    const [results] = await sequelize.query(sql);
    return results;
  } catch (err) {
    console.error("Error executing SQL:", err.message);
    throw err;
  }
}

module.exports = {
  getSQLFromPrompt,
  runQuery,
};
