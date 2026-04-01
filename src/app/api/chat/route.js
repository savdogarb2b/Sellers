import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  return NextResponse.json(messages);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message } = await request.json();
  const userId = session.user.id;
  const orgId = session.user.organizationId;

  // Save user message
  await prisma.chatMessage.create({
    data: { userId, role: 'user', content: message },
  });

  // Check for Gemini API Key
  const setting = await prisma.systemSettings.findUnique({ where: { key: 'GEMINI_API_KEY' } });
  if (!setting?.value) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Set up streaming
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:streamGenerateContent?key=${setting.value}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Sen SalesCRM tizimi yordamchisiz.
FAQAT O'ZBEK TILIDA javob ber. Markdown formatidan foydalan.
Foydalanuvchi savoli: ${message}`
                }]
              }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
            })
          }
        );

        if (!response.ok) {
          throw new Error('Gemini API error');
        }

        const reader = response.body.getReader();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim().startsWith('{') || line.trim().startsWith('[')) {
              try {
                const jsonStr = line.trim().replace(/^\[|,|\]$/g, '');
                if (!jsonStr) continue;
                
                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  fullContent += text;
                  controller.enqueue(encoder.encode(text));
                }
              } catch (e) {
              }
            }
          }
        }

        // Save AI message once completed
        await prisma.chatMessage.create({
          data: { userId, role: 'assistant', content: fullContent },
        });

        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode('Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.chatMessage.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
