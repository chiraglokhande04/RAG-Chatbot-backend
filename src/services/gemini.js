// // backend/src/services/gemini.js
// const axios = require("axios");
// require("dotenv").config();

// const GEMINI_API_URL = process.env.GEMINI_API_URL || null;
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;
// //const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;

// // Fallback OpenAI client (if you don't have Gemini configured)
// //const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// /**
//  * generateAnswer(prompt)
//  * Returns a string result from LLM.
//  */
// async function generateAnswer(prompt) {
//   // 1) If Gemini env is configured, call it.
//   if (GEMINI_API_URL && GEMINI_API_KEY) {
//     try {
//       const res = await axios.post(
//          `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
//        {
//           contents: [
//             {
//               role: "user",
//               parts: [{ text: prompt }],
//             },
//           ],
//         }, // NOTE: customize according to Gemini REST shape if needed
//         {
//           headers: { "Content-Type": "application/json" },
//           timeout: 60000,
//         }
//       );
//       // assume the API returns { answer: "..." } - adapt as required by the real API
//       if (res.data?.answer) return res.data.answer;
//       // fallback: try common fields
//       if (res.data?.output_text) return res.data.output_text;
//       if (typeof res.data === "string") return res.data;
//       return JSON.stringify(res.data).slice(0, 2000);
//     } catch (err) {
//       console.error("Gemini API error:", err.response?.data || err.message);
//       // fall through to fallback
//     }
//   }

//   // 2) Fallback to OpenAI Chat (if available)
// //   if (openai) {
// //     try {
// //       const completion = await openai.chat.completions.create({
// //         model: "gpt-4o-mini", // change to the model you can access; or "gpt-4o" etc.
// //         messages: [
// //           { role: "system", content: "You are a helpful assistant." },
// //           { role: "user", content: prompt },
// //         ],
// //         max_tokens: 700,
// //       });
// //       const text = completion.choices?.[0]?.message?.content;
// //       if (text) return text;
// //     } catch (err) {
// //       console.error("OpenAI chat error:", err);
// //     }
// //   }

//   throw new Error("No LLM provider configured (set GEMINI_API_URL+GEMINI_API_KEY or OPENAI_API_KEY).");
// }

// module.exports = { generateAnswer };


// backend/src/services/gemini.js
const axios = require("axios");
require("dotenv").config();

const GEMINI_API_URL = process.env.GEMINI_API_URL || null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null;

async function generateAnswer(prompt) {
  if (GEMINI_API_URL && GEMINI_API_KEY) {
    try {
      const res = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 60000,
        }
      );

      const data = res.data;

      // ✅ Gemini returns text here:
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.output_text ||
        null;

      if (text) return text;

      // fallback (debugging only)
      return JSON.stringify(data).slice(0, 2000);
    } catch (err) {
      console.error("Gemini API error:", err.response?.data || err.message);
    }
  }

  throw new Error(
    "No LLM provider configured (set GEMINI_API_URL+GEMINI_API_KEY)."
  );
}

module.exports = { generateAnswer };
