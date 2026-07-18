import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Fast + free-tier friendly model on Groq. Swap here if you need a
// different one later — nothing else in the codebase needs to change.
const MODEL = "llama-3.3-70b-versatile";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

/**
 * AI Document Intelligence feature: takes the extracted paper text and
 * returns a summary + bullet key points as structured JSON.
 */
export async function generatePaperSummary(paperText: string): Promise<SummaryResult> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an academic research assistant. Given the text of a research paper, " +
          "respond ONLY with JSON in this exact shape: " +
          `{"summary": "a clear 3-4 sentence summary of the paper", "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"]}. ` +
          "Key points should be concrete findings, methods, or conclusions — not generic statements.",
      },
      {
        role: "user",
        content: paperText,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);

  return {
    summary: parsed.summary || "",
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
  };
}

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * AI Chat Assistant feature: answers a follow-up question about a specific
 * paper, grounded in that paper's extracted text + prior conversation turns.
 */
export async function chatAboutPaper(
  paperText: string,
  history: ChatTurn[],
  question: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are ScholarAI's research assistant. Answer questions ONLY using the paper text " +
          "provided below. If the answer isn't in the paper, say so honestly instead of guessing. " +
          "Keep answers concise and cite specific sections/findings when possible.\n\n" +
          `PAPER TEXT:\n${paperText}`,
      },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: question },
    ],
  });

  return completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}
