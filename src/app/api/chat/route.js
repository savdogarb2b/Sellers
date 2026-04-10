import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const messages = await prisma.chatMessage.findMany({
    where: { 
      userId,
      createdAt: { gte: weekAgo }
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
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

  const { message, sessionId } = await request.json();

  if (sessionId) {
    const sessionExists = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (sessionExists && sessionExists.title === 'Yangi Suhbat') {
      try { await prisma.chatSession.update({ where: { id: sessionId }, data: { title: message.slice(0, 30) + '...' } }); } catch(e) {}
    }
  }

  const setting = await prisma.systemSettings.findUnique({ where: { key: 'DEEPSEEK_API_KEY' } });
  const apiKey = setting?.value;
  if (!apiKey) {
    return NextResponse.json({ error: 'DeepSeek API kaliti kiritilmagan. Superadmin sozlamalaridan kiriting.' }, { status: 500 });
  }



  const systemPrompt = `Sen 'Executive AI' - SalesCRM tahlilchisisan. O'zbek tilida, markdown formatida qisqa va chiroyli javob ber.
Agar foydalanuvchi statistika, graf yoki chart so'rasa, albatta uni quyidagi formatda JSON kod blokida qaytar, chunki tizim uni chiroyli dashboard qilib chizadi.

\`\`\`chart
{
  "type": "bar", // yoki "line", "pie"
  "title": "Sotuvlar Statistikasi",
  "data": {
    "labels": ["Yanvar", "Fevral", "Mart"],
    "datasets": [
      { "label": "Sotuv", "data": [12, 19, 3] },
      { "label": "Lidlar", "data": [20, 30, 10] }
    ]
  }
}
\`\`\`
Sizning vazifangiz boshqaruvchilarga KPI va moliyaviy ma'lumotlarni tahlil qilish.`;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = '';
      let isClosed = false;
      try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          signal: request.signal,
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
            stream: true,
            temperature: 0.5
          })
        });

        if (!response.ok) throw new Error(`DeepSeek API error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
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
                if (content) { 
                  fullText += content; 
                  if (!isClosed) controller.enqueue(encoder.encode(content)); 
                }
              } catch (e) {
                // Ignore incomplete JSON
              }
            }
          }
        }
        
        if (buffer.startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
          try {
             const data = JSON.parse(buffer.slice(6));
             const content = data.choices[0]?.delta?.content || '';
             if (content) { 
               fullText += content; 
               if (!isClosed) controller.enqueue(encoder.encode(content)); 
             }
          } catch(e) {}
        }
        
        if (!isClosed) {
          controller.close();
          isClosed = true;
        }
      } catch (error) {
        if (!isClosed) {
          try {
            if (error.name !== 'AbortError' && !error.message?.includes('terminated') && !error.message?.includes('ECONNRESET')) {
               controller.enqueue(encoder.encode('\n\n[Ma\'lumot uzildi yoki xatolik yuz berdi]'));
            }
          } catch(e) {}
          try {
            controller.close();
          } catch(e) {}
          isClosed = true;
        }
      } finally {
        if (fullText) {
          try { 
            if (sessionId) {
              await prisma.chatMessage.create({ data: { userId, role: 'user', content: message, sessionId } });
              await prisma.chatMessage.create({ data: { userId, role: 'assistant', content: fullText, sessionId } }); 
            } else {
              await prisma.chatMessage.create({ data: { userId, role: 'user', content: message } });
              await prisma.chatMessage.create({ data: { userId, role: 'assistant', content: fullText } }); 
            }
          } catch(dbErr) {
            console.error('Chat xabar saqlashda xatolik:', dbErr.message);
          }
        }
      }
    }
  });

  return new Response(stream, {
    headers: { 
      'Content-Type': 'text/plain; charset=utf-8', 
      'Cache-Control': 'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.chatMessage.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
