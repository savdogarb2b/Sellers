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

  // Build org context
  let orgContext = '';
  if (organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          include: {
            kpis: true,
            penaltyRecords: { take: 20, orderBy: { date: 'desc' } },
            bonusRecords: { take: 20, orderBy: { date: 'desc' } },
            dailyReports: { take: 30, orderBy: { date: 'desc' } },
            attendances: { take: 30, orderBy: { date: 'desc' } },
          },
        },
        salesStrategies: { include: { months: true }, take: 1, orderBy: { createdAt: 'desc' } },
        funnelStages: true,
      },
    });

    if (org) {
      const employees = org.users.filter(u => u.role === 'EMPLOYEE');
      const admins = org.users.filter(u => u.role === 'ADMIN');
      const allKpis = employees.flatMap(e => e.kpis);
      const allReports = employees.flatMap(e => e.dailyReports);
      const allAttendances = employees.flatMap(e => e.attendances);
      const totalPenalties = employees.reduce((s, e) => s + e.penaltyRecords.reduce((ps, p) => ps + p.amount, 0), 0);
      const totalBonuses = employees.reduce((s, e) => s + e.bonusRecords.reduce((bs, b) => bs + b.amount, 0), 0);
      const avgKpi = allKpis.length > 0
        ? Math.round(allKpis.reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / allKpis.length)
        : 0;
      const totalCalls = allReports.reduce((s, r) => s + r.totalCalls, 0);
      const qualityLeads = allReports.reduce((s, r) => s + r.qualityLeads, 0);
      const lateCount = allAttendances.filter(a => a.isLate).length;
      const salaryFund = employees.reduce((s, e) => s + (e.fixedSalary || 0), 0);

      orgContext = `
=== TASHKILOT MA'LUMOTLARI ===
Tashkilot nomi: ${org.name}
Xodimlar: ${employees.length}
Adminlar: ${admins.length}
Ish haqi fondi: ${salaryFund.toLocaleString()} so'm/oy

--- KPI ---
O'rtacha bajarilish: ${avgKpi}%
Muvaffaqiyatli KPIlar: ${allKpis.filter(k => k.currentValue >= k.targetValue).length}/${allKpis.length}

--- MOLIYA ---
Jami jarimalar: ${totalPenalties.toLocaleString()} so'm
Jami bonuslar: ${totalBonuses.toLocaleString()} so'm

--- SOTUV ---
Jami qo'ng'iroqlar: ${totalCalls}, Sifatli lidlar: ${qualityLeads}
`;
    }
  }

  // Set up streaming
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
                  text: `Sen SalesCRM tizimining strategik AI maslahatchisisiz.
FAQAT O'ZBEK TILIDA, professional va do'stona ruhda javob ber.
Markdown formatidan foydalan (**bold**, *italic*, jadvallar).

MUHIM: Agar ma'lumotlarni grafikda ko'rsatish so'ralsa yoki tahlil uchun grafik mos bo'lsa, javobingda quyidagi JSON blokni ham qo'sh:
\`\`\`json:chart
{
  "type": "bar", // bar, line, pie
  "title": "Grafik nomi",
  "data": [
    {"name": "Yanvar", "value": 400},
    {"name": "Fevral", "value": 300}
  ]
}
\`\`\`

${orgContext}

SUPERADMIN SAVOLI: ${message}`
                }]
              }]
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
                // Gemini returns an array of objects in streaming
                const jsonStr = line.trim().replace(/^\[|,|\]$/g, '');
                if (!jsonStr) continue;
                
                const data = JSON.parse(jsonStr);
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                  fullContent += text;
                  controller.enqueue(encoder.encode(text));
                }
              } catch (e) {
                // Potential partial JSON or other formatting
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
