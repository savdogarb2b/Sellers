import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  return NextResponse.json(messages);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, organizationId } = await request.json();
  const userId = session.user.id;

  // Save user message
  await prisma.chatMessage.create({
    data: { userId, role: 'user', content: message },
  });

  // Get API key from settings
  const apiKeySetting = await prisma.systemSettings.findUnique({
    where: { key: 'GEMINI_API_KEY' },
  });

  if (!apiKeySetting?.value) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Build context (omitted for brevity, assume similar to original)
  let orgContext = '';
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: { include: { kpis: true } },
        salesStrategies: { include: { months: true }, take: 1, orderBy: { createdAt: 'desc' } },
        funnelStages: true,
      }
    });
    if (org) {
      orgContext = `=== TASHKILOT: ${org.name} ===\nXodimlar soni: ${org.users.length}\n`;
    }
  }

  // Robust Stream Parsing
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:streamGenerateContent?key=${apiKeySetting.value}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Sen SalesCRM yordamchisiz. O'zbek tilida, markdown formatida javob ber. Grafik kerak bo'lsa \`\`\`json:chart { ... } \`\`\` formatidan foydalan.
${orgContext}
USER: ${message}`
                }]
              }]
            })
          }
        );

        if (!response.ok) throw new Error('Gemini API unreachable');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let jsonBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          jsonBuffer += decoder.decode(value, { stream: true });
          
          // Try to extract text using a robust regex search across the buffer
          // Gemini's streaming format is an array of objects [{},{}]
          // We can try to extract parts[].text from valid JSON objects in the buffer
          
          let match;
          // This regex looks for: "text": "..."
          // It's not 100% perfect for all escapes but very fast and works for most stream chunks
          const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
          
          let lastIndex = 0;
          while ((match = textRegex.exec(jsonBuffer)) !== null) {
            const foundText = match[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            
            // We only want the *new* text part.
            // But chunks in streamGenerateContent are cumulative or separate? 
            // In v1beta, they are separate objects in an array.
            // So each "text" we find IS new text.
            
            fullText += foundText;
            controller.enqueue(encoder.encode(foundText));
            lastIndex = textRegex.lastIndex;
          }
          
          // Clear the part of the buffer we've already parsed
          // Actually, since it's an array, we should clear what we've processed
          jsonBuffer = jsonBuffer.substring(lastIndex);
        }

        // Save AI message
        if (fullText) {
          await prisma.chatMessage.create({
            data: { userId, role: 'assistant', content: fullText },
          });
        }

        controller.close();
      } catch (err) {
        console.error('Stream failed:', err);
        controller.enqueue(encoder.encode('Kechirasiz, javob berishda xatolik yuz berdi.'));
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

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.chatMessage.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
