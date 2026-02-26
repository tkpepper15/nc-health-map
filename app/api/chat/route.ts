import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
  }

  const { message, county } = await request.json();
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const systemPrompt = county
    ? `You are a helpful assistant specializing in North Carolina healthcare policy and data.
The user is asking about ${county} County, NC.
Answer questions about healthcare access, Medicaid, hospital availability, rural health challenges,
and related topics for this county. Keep responses concise and factual.
Do not use markdown formatting — no asterisks, no hashtags, no bullet dashes. Use plain sentences and line breaks only.`
    : `You are a helpful assistant specializing in North Carolina healthcare policy and data.
Answer questions about NC healthcare access, Medicaid, rural hospitals, and health policy.
Keep responses concise and factual.
Do not use markdown formatting — no asterisks, no hashtags, no bullet dashes. Use plain sentences and line breaks only.`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser question: ${message}` }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  };

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini error:', err);
    return NextResponse.json({ error: 'Failed to get response from Gemini' }, { status: 502 });
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';

  return NextResponse.json({ response: text });
}
