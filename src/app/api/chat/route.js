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

  // Save user message
  await prisma.chatMessage.create({
    data: { userId, role: 'user', content: message },
  });

  // Get API key
  const setting = await prisma.systemSettings.findUnique({ where: { key: 'GEMINI_API_KEY' } });
  if (!setting?.value) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Robust Stream Parsing
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
                  text: `Sen SalesCRM yordamchisiz. O'zbek tilida qisqa va aniq javob ber. Markdown formatidan foydalan.
USER: ${message}`
                }]
              }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
            })
          }
        );

        if (!response.ok) throw new Error('Gemini API error');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let jsonBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          jsonBuffer += decoder.decode(value, { stream: true });
          
          let match;
          const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
          let lastIndex = 0;
          
          while ((match = textRegex.exec(jsonBuffer)) !== null) {
            const foundText = match[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
              
            fullText += foundText;
            controller.enqueue(encoder.encode(foundText));
            lastIndex = textRegex.lastIndex;
          }
          
          jsonBuffer = jsonBuffer.substring(lastIndex);
        }

        // Save AI message
        if (fullText) {
          await prisma.chatMessage.create({
            data: { userId, role: 'assistant', content: fullText },
          });
        }

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
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    }
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.chatMessage.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
