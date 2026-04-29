import { NextResponse } from "next/server";
import { PERSONAS } from "@/lib/personas";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { personaId, messages } = body ?? {};

    if (!personaId || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const persona = PERSONAS.find((item) => item.id === personaId);
    if (!persona) {
      return NextResponse.json({ error: "Unknown persona." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing API credentials." },
        { status: 500 }
      );
    }

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          { role: "system", content: persona.systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: payload?.error?.message || "Upstream API error." },
        { status: response.status }
      );
    }

    const payload = await response.json();
    const message = payload?.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      message: message || "No response returned.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process the request." },
      { status: 500 }
    );
  }
}
