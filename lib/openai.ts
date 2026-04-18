import OpenAI from "openai";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

type CallOpenAIParams = {
  system?: string;
  user: string;
  temperature?: number;
  model?: string;
};

export async function callOpenAI({
  system,
  user,
  temperature = 0.2,
  model = "gpt-4o-mini",
}: CallOpenAIParams): Promise<string> {
  const openai = getOpenAI();

  const messages: Array<{ role: "system" | "user"; content: string }> = [];

  if (system?.trim()) {
    messages.push({
      role: "system",
      content: system.trim(),
    });
  }

  messages.push({
    role: "user",
    content: user,
  });

  const response = await openai.chat.completions.create({
    model,
    temperature,
    messages,
  });

  return response.choices?.[0]?.message?.content || "";
}