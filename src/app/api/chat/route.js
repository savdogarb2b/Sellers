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

  const userId = session.user.id;
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) {
    return NextResponse.json({ error: 'Foydalanuvchi topilmadi. Iltimos, tizimdan chiqib qayta kiring (Logout/Login).' }, { status: 401 });
  }

  const { message } = await request.json();

  const setting = await prisma.systemSettings.findUnique({ where: { key: 'DEEPSEEK_API_KEY' } });
  const apiKey = setting?.value;
  if (!apiKey) {
    return NextResponse.json({ error: 'DeepSeek API kaliti kiritilmagan. Superadmin sozlamalaridan kiriting.' }, { status: 500 });
  }

  await prisma.chatMessage.create({
    data: { userId, role: 'user', content: message },
  });

  const systemPrompt = "Sen SalesCRM yordamchisiz. O'zbek tilida, markdown formatida javob ber.";
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
            stream: true,
            temperature: 0.5
          })
        });

        if (!response.ok) throw new Error('DeepSeek API error');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
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
      } catch (error) {
        console.error('Streaming error:', error);
        controller.enqueue(encoder.encode('Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.'));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.chatMessage.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
