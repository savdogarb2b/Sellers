import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
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
  if (!session || session.user.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) return NextResponse.json({ error: 'Foydalanuvchi topilmadi. Logout qilib qayta kiring.' }, { status: 401 });

  const { message, organizationId, test } = await request.json();

  const apiKeySetting = await prisma.systemSettings.findUnique({ where: { key: 'DEEPSEEK_API_KEY' } });
  const apiKey = apiKeySetting?.value;
  if (!apiKey) return NextResponse.json({ error: 'DeepSeek API kaliti topilmadi' }, { status: 500 });

  // Organization context
  let orgContext = '';
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: { users: { include: { kpis: true } }, funnelStages: true }
    });
    if (org) orgContext = `=== TASHKILOT: ${org.name} ===\nXodimlar soni: ${org.users.length}\n`;
  }

  const systemPrompt = `Sen SalesCRM yordamchisiz. O'zbek tilida, markdown formatida javob ber. Grafik (chart) kerak bo'lsa \`\`\`chart {"type":"bar","title":"...","data":[{"name":"...","value":0}]} \`\`\` formatidan foydalan.\n${orgContext}`;

  // Test mode: just check if API key works, don't save to DB
  if (test) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: 'hi' }],
              stream: true,
              max_tokens: 5
            })
          });
          if (!response.ok) throw new Error('API error');
          controller.enqueue(encoder.encode('ok'));
          controller.close();
        } catch {
          controller.error(new Error('failed'));
        }
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  if (!test) {
    await prisma.chatMessage.create({ data: { userId, role: 'user', content: message } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = '';
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
            stream: true, temperature: 0.5
          })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) { fullText += content; controller.enqueue(encoder.encode(content)); }
              } catch (e) {}
            }
          }
        }

        if (fullText) {
          await prisma.chatMessage.create({ data: { userId, role: 'assistant', content: fullText } });
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.chatMessage.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
