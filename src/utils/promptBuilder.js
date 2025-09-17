// backend/src/utils/promptBuilder.js

/**
 * buildPrompt({ question, contexts, history })
 * - question: user question string
 * - contexts: [{ id, score, metadata:{title,url}, text }]
 * - history: [{role, text, ts}, ...]
 *
 * Returns a single string prompt you pass to your LLM.
 */
function buildPrompt({ question, contexts = [], history = [] }) {
  // 1) system instruction
  let prompt = "You are a helpful assistant answering questions using only the provided news passages. " +
    "Cite sources in square brackets like [1] and list URLs at the end. If the answer is not present in the passages, say you don't know.\n\n";

  // 2) conversational history (optional)
  if (history && history.length) {
    prompt += "Conversation history:\n";
    for (const h of history) {
      const who = h.role === "user" ? "User" : "Assistant";
      prompt += `${who}: ${h.text}\n`;
    }
    prompt += "\n";
  }

  // 3) contexts (number them)
  prompt += "Context passages:\n";
  for (let i = 0; i < contexts.length; i++) {
    const c = contexts[i];
    const title = c.metadata?.title || c.metadata?.source || `passage-${i+1}`;
    prompt += `[${i+1}] ${title}\n${(c.text || "").trim()}\n\n`;
  }

  // 4) user question
  prompt += `User question: ${question}\n\n`;
  prompt += "Answer concisely and cite passage numbers in square brackets (e.g., [2]). If not found, say 'I don't have that info in my sources.'\n";

  return prompt;
}


module.exports = { buildPrompt };