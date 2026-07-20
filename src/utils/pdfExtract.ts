// pdf-parse doesn't ship types that play well with strict TS + require(),
// so we require it directly.
const pdfParse = require("pdf-parse");

/**
 * Extracts raw text from a PDF buffer. This text is stored on the Paper doc
 * and reused for both AI summarization and the chat assistant, so we only
 * parse the PDF once (at upload time).
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return typeof data?.text === "string" ? data.text.trim() : "";
  } catch (error) {
    console.warn("PDF text extraction failed; continuing with empty text.", error);
    return "";
  }
}

/**
 * LLM context windows aren't infinite, and long papers can be 20+ pages.
 * This trims text to a safe character budget while keeping it word-safe.
 */
export function trimForContext(text: string, maxChars = 12000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n\n[...paper truncated for context length...]";
}
