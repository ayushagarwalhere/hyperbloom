import { NextResponse } from 'next/server';

export async function POST(request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'The Harborline guide is not configured yet. Please use the verified resources above or call 988 for immediate mental-health support.' }, { status: 503 });
  }

  const { question } = await request.json();
  if (typeof question !== 'string' || question.trim().length < 2 || question.length > 500) {
    return NextResponse.json({ error: 'Please ask a short question, up to 500 characters.' }, { status: 400 });
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'Harborline',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 280,
      messages: [
        {
          role: 'system',
          content: 'You are Harborline, a calm crisis-resource navigation assistant. Give brief, practical guidance. Never diagnose, never claim to know live availability, and never replace emergency services. If someone may be in immediate danger, tell them to call local emergency services now. For US mental-health crisis support, mention 988. Encourage using the verified resource cards on the page. Do not ask for names, addresses, or other sensitive personal data.',
        },
        { role: 'user', content: question.trim() },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'The guide is temporarily unavailable. Please use the verified resources above.' }, { status: 502 });
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content;
  if (!answer) {
    return NextResponse.json({ error: 'The guide returned no answer. Please use the verified resources above.' }, { status: 502 });
  }
  return NextResponse.json({ answer });
}
