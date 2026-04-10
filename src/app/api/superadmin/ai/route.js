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

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const messages = await prisma.chatMessage.findMany({
    where: { 
      userId: session.user.id,
      createdAt: { gte: weekAgo }
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) return NextResponse.json({ error: 'Foydalanuvchi topilmadi. Logout qilib qayta kiring.' }, { status: 401 });

  const { message, organizationId, test, sessionId } = await request.json();

  if (sessionId) {
    const sessionExists = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (sessionExists && sessionExists.title === 'Yangi Suhbat') {
      try { await prisma.chatSession.update({ where: { id: sessionId }, data: { title: message.slice(0, 30) + '...' } }); } catch(e) {}
    }
  }

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
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          stream: false,
          max_tokens: 5
        })
      });
      if (!response.ok) {
        return NextResponse.json({ success: false, error: 'API kalit ishlamayapti' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'API kalit ishlayapti' });
    } catch {
      return NextResponse.json({ success: false, error: 'API ga ulanib bo\'lmadi' }, { status: 500 });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = '';
      let isClosed = false;
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
            stream: true, temperature: 0.5
          })
        });

        if (!response.ok) throw new Error(`DeepSeek API xato: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content || '';
                if (content) { fullText += content; if (!isClosed) controller.enqueue(encoder.encode(content)); }
              } catch (_parseErr) { /* incomplete JSON chunk */ }
            }
          }
        }
        if (!isClosed) { controller.close(); isClosed = true; }
      } catch (err) {
        if (!isClosed) {
          try { controller.enqueue(encoder.encode('\n\n[Xatolik yuz berdi]')); } catch(_e) {}
          try { controller.close(); } catch(_e) {}
          isClosed = true;
        }
      } finally {
        if (fullText) {
          try {
            await prisma.chatMessage.create({ data: { userId, role: 'user', content: message, sessionId: sessionId || undefined } });
            await prisma.chatMessage.create({ data: { userId, role: 'assistant', content: fullText, sessionId: sessionId || undefined } });
          } catch(dbErr) {
            console.error('Chat message saqlashda xatolik:', dbErr.message);
          }
        }
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
