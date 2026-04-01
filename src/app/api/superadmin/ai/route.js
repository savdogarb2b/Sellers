import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
Holat: ${org.status}
Manzil: ${org.address || 'ko\'rsatilmagan'}
Telefon: ${org.phone || 'ko\'rsatilmagan'}
Yaratilgan: ${new Date(org.createdAt).toLocaleDateString('uz')}

--- XODIMLAR ---
Jami xodimlar: ${employees.length}
Adminlar: ${admins.length}
Ish haqi fondi: ${salaryFund.toLocaleString()} so'm/oy

--- XODIMLAR RO'YXATI ---
${employees.map(e => {
  const empKpis = e.kpis.map(k => `${k.name}: ${k.currentValue}/${k.targetValue} (${k.targetValue > 0 ? Math.round(k.currentValue / k.targetValue * 100) : 0}%)`).join(', ');
  return `• ${e.name} — Maosh: ${e.fixedSalary?.toLocaleString()} so'm, KPI: ${empKpis || 'belgilanmagan'}`;
}).join('\n')}

--- KPI ---
Jami faol KPI: ${allKpis.length}
O'rtacha bajarilish: ${avgKpi}%
Maqsadga yetganlar: ${allKpis.filter(k => k.currentValue >= k.targetValue).length}

--- MOLIYA ---
Jami jarimalar (oy): ${totalPenalties.toLocaleString()} so'm
Jami bonuslar (oy): ${totalBonuses.toLocaleString()} so'm
Bonus/Jarima nisbati: ${totalPenalties > 0 ? (totalBonuses / totalPenalties).toFixed(1) : '∞'}

--- SOTUV ---
Jami qo'ng'iroqlar: ${totalCalls}
Sifatli lidlar: ${qualityLeads}
${org.salesStrategies[0] ? `Yillik sotuv maqsadi: ${org.salesStrategies[0].targetSales}, Konversiya maqsadi: ${org.salesStrategies[0].targetConversion}%` : 'Sotuv strategiyasi belgilanmagan'}

--- DAVOMAT ---
Jami kelishlar: ${allAttendances.length}
Kechikishlar: ${lateCount} (${allAttendances.length > 0 ? Math.round(lateCount / allAttendances.length * 100) : 0}%)

--- VORONKA ---
${org.funnelStages.map(s => `${s.order}. ${s.name}`).join('\n')}
`;
    }
  } else {
    // All orgs summary
    const orgs = await prisma.organization.findMany({
      include: {
        _count: { select: { users: true } },
        users: { include: { kpis: true } },
      },
    });
    orgContext = `
=== BARCHA TASHKILOTLAR UMUMIY ===
Jami tashkilotlar: ${orgs.length}
Faol: ${orgs.filter(o => o.status === 'ACTIVE').length}
Muzlatilgan: ${orgs.filter(o => o.status === 'FROZEN').length}
Jami foydalanuvchilar: ${orgs.reduce((s, o) => s + (o._count?.users || 0), 0)}

${orgs.map(o => {
  const emps = o.users.filter(u => u.role === 'EMPLOYEE');
  const avgKpi = emps.flatMap(e => e.kpis).length > 0
    ? Math.round(emps.flatMap(e => e.kpis).reduce((s, k) => s + (k.targetValue > 0 ? (k.currentValue / k.targetValue) * 100 : 0), 0) / emps.flatMap(e => e.kpis).length)
    : 0;
  return `• ${o.name} [${o.status}] — ${emps.length} xodim, O'rtacha KPI: ${avgKpi}%`;
}).join('\n')}
`;
  }

  let aiResponse;

  if (apiKeySetting?.value) {
    // Use Gemini API
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeySetting.value}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Sen SalesCRM tizimining strategik AI maslahatchisisiz. Superadmin senga tashkilot haqida savol beryapti.

FAQAT O'ZBEK TILIDA javob ber.
Strategik, aniq, professional va qisqa javob ber.
Raqamlar va foizlar bilan tahlil qil.
Tavsiyalarni nuqta-nuqta qilib yoz.
Agar muammo bo'lsa, aniq yechim taklif qil.

${orgContext}

SUPERADMIN SAVOLI: ${message}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      const geminiData = await geminiRes.json();
      if (geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = geminiData.candidates[0].content.parts[0].text;
      } else {
        aiResponse = 'AI javob bera olmadi. Iltimos qaytadan urinib ko\'ring yoki API kalitni tekshiring.';
      }
    } catch (err) {
      aiResponse = `AI xatosi: ${err.message}. Sozlamalirdagi API kalitni tekshiring.`;
    }
  } else {
    // Fallback: smart response without API
    aiResponse = generateLocalResponse(message, orgContext);
  }

  // Save AI response
  await prisma.chatMessage.create({
    data: { userId, role: 'assistant', content: aiResponse },
  });

  return NextResponse.json({ role: 'assistant', content: aiResponse });
}

function generateLocalResponse(message, context) {
  const msg = message.toLowerCase();

  if (msg.includes('xodim') || msg.includes('hodim') || msg.includes('ishchi')) {
    return `📊 Xodimlar Tahlili\n\n${context ? 'Tashkilot ma\'lumotlari asosida quyidagi xulosalarga keldim:\n\n' + context.split('--- XODIMLAR RO\'YXATI ---')[1]?.split('---')[0] || 'Ma\'lumot topilmadi' : 'Avval tashkilot tanlang'}\n\n💡 Tavsiyalar:\n• KPI ko'rsatkichlari past bo'lgan xodimlarga individual reja tuzing\n• Eng yaxshi xodimlarni rag'batlantirish dasturi ishlab chiqing\n• Haftalik 1:1 uchrashuvlar o'tkazing`;
  }

  if (msg.includes('kpi') || msg.includes('samaradorlik') || msg.includes('natija')) {
    return `📈 KPI Tahlili\n\nKPI ko'rsatkichlari haqida strategik maslahat:\n\n1. SMART tamoyili bo'yicha KPI belgilang\n2. Har hafta progress tekshiring\n3. KPI bajarilishi 70% dan past bo'lsa — sabab tahlil qiling\n4. Eng yaxshi natijalarni jamoaga ko'rsating\n5. Oylik interim review olib boring\n\n⚠️ Muhim: AI maslahatlar to'liq ishlashi uchun Sozlamalar sahifasidan Gemini API tokenni kiriting.`;
  }

  if (msg.includes('moliya') || msg.includes('maosh') || msg.includes('jarima') || msg.includes('bonus')) {
    return `💰 Moliyaviy Tahlil\n\nMoliyaviy strategiya bo'yicha maslahatlar:\n\n1. Bonus/Jarima nisbati kamida 3:1 bo'lishi kerak\n2. Jarimalar adolatli va shaffof bo'lishi lozim\n3. Bonus tizimini KPI ga bog'lang\n4. Ish haqi fondini optimizatsiya qiling\n5. Top-performer'larga maxsus ragbatlantirish dasturi yarating\n\n⚠️ To'liq tahlil uchun Gemini API tokenni sozlamalardan kiriting.`;
  }

  if (msg.includes('sotuv') || msg.includes('savdo') || msg.includes('lid') || msg.includes('konversiya')) {
    return `📞 Sotuv Strategiyasi\n\nSotuvlarni oshirish uchun:\n\n1. Har bir menejerga kunlik 20+ qo'ng'iroq normasini belgilang\n2. Sifatli lid mezonlarini aniq belgilang\n3. Voronka bosqichlarini haftalik tahlil qiling\n4. Konversiyani oshirish uchun script tayyorlang\n5. A/B test o'tkazing\n\n⚠️ Aniqroq tahlil uchun tashkilot tanlang va Gemini API tokenni kiriting.`;
  }

  return `🤖 SalesCRM AI Strategik Maslahatchi\n\nSalom! Men strategik maslahat berishga tayyorman.\n\nQuyidagi mavzularda yordam bera olaman:\n\n• Xodimlar tahlili — "xodimlar holati"\n• KPI monitoring — "kpi tahlil"\n• Moliyaviy tahlil — "moliya holati"\n• Sotuv strategiyasi — "sotuv tahlil"\n• Tashkilot umumiy holati — "umumiy holat"\n\n💡 To'liq AI imkoniyatlaridan foydalanish uchun:\n1. Yuqoridagi dropdown'dan tashkilot tanlang\n2. Sozlamalar sahifasidan Gemini API token kiriting\n\nQanday savol bor?`;
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
