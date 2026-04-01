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

  // Get org context for AI
  const employees = await prisma.user.findMany({
    where: session.user.role === 'EMPLOYEE' 
      ? { id: userId } 
      : { organizationId: orgId, role: 'EMPLOYEE' },
    include: { 
      kpis: true, 
      dailyReports: { take: 5, orderBy: { date: 'desc' } },
      penaltyRecords: { take: 5, orderBy: { date: 'desc' } },
      bonusRecords: { take: 5, orderBy: { date: 'desc' } },
      attendances: { take: 5, orderBy: { date: 'desc' } },
    },
  });

  const strategy = await prisma.salesStrategy.findFirst({
    where: { organizationId: orgId },
    include: { months: true },
    orderBy: { createdAt: 'desc' },
  });

  const penalties = await prisma.penaltyRecord.findMany({
    where: session.user.role === 'EMPLOYEE' ? { userId } : { user: { organizationId: orgId } },
    take: 10,
    orderBy: { date: 'desc' },
  });

  // Check for Gemini API Key
  let apiKey = null;
  try {
    const setting = await prisma.systemSettings.findUnique({ where: { key: 'GEMINI_API_KEY' } });
    if (setting && setting.value && setting.value.trim().length > 10) {
      apiKey = setting.value.trim();
    }
  } catch (e) { /* no settings table yet */ }

  let aiResponse;

  if (apiKey) {
    // ===== GEMINI API =====
    try {
      const context = buildContext(employees, strategy, penalties, session.user);

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${context}\n\nFoydalanuvchi savoli: ${message}\n\nFaqat o'zbek tilida javob ber. Aniq, professional va strategik javob ber. Raqamlar va ko'rsatkichlarga asoslanib maslahat ber. Agar sotuv texnikasi so'ralsa, aniq skriptlar va misollar ber.` }]
            }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || generateSimpleResponse(message, employees, strategy);
      } else {
        aiResponse = generateSimpleResponse(message, employees, strategy);
      }
    } catch (e) {
      aiResponse = generateSimpleResponse(message, employees, strategy);
    }
  } else {
    // ===== LOKAL JAVOBLAR =====
    aiResponse = generateSimpleResponse(message, employees, strategy);
  }

  // Save AI response
  await prisma.chatMessage.create({
    data: { userId, role: 'assistant', content: aiResponse },
  });

  return NextResponse.json({ role: 'assistant', content: aiResponse });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.chatMessage.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}

function buildContext(employees, strategy, penalties, user) {
  const totalSales = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + r.qualityLeads, 0), 0);
  const totalCalls = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + r.totalCalls, 0), 0);
  const totalBonuses = employees.reduce((sum, e) => sum + e.bonusRecords.reduce((s, r) => s + r.amount, 0), 0);
  const totalPenalties = employees.reduce((sum, e) => sum + e.penaltyRecords.reduce((s, r) => s + r.amount, 0), 0);
  
  return `Sen SalesCRM tizimining AI strategik maslahatchi yordamchisisiz. 
Rol: ${user.role}
Tashkilot: ${user.organizationName || 'Noma\'lum'}

Tizim ma'lumotlari:
- Xodimlar soni: ${employees.length}
- Xodimlar: ${employees.map(e => `${e.name} (Maosh: ${e.fixedSalary?.toLocaleString() || 0} so'm, KPI: ${e.kpis.map(k => `${k.name}: ${k.currentValue}/${k.targetValue} (${k.targetValue > 0 ? Math.round(k.currentValue/k.targetValue*100) : 0}%)`).join(', ') || 'yo\'q'})`).join('; ')}
- So'nggi sotuvlar: Jami ${totalSales} ta sifatli lid, ${totalCalls} ta qo'ng'iroq
- Jami bonuslar: ${totalBonuses.toLocaleString()} so'm
- Jami jarimalar: ${totalPenalties.toLocaleString()} so'm
- Sotuv strategiyasi: ${strategy ? `Yillik maqsad: ${strategy.targetSales} ta sotuv, Konversiya: ${strategy.targetConversion}%, Oylik taqsimot: ${strategy.months.map(m => `${m.month}-oy: ${m.actualSales}/${m.targetSales}`).join(', ')}` : 'belgilanmagan'}
- So'nggi jarimalar: ${penalties.length} ta

Vazifalar:
1. Faqat o'zbek tilida javob ber
2. CRM ma'lumotlariga asoslanib maslahat ber
3. Sotuv texnikalari, mijoz bilan ishlash, xodim motivatsiyasi haqida yordam ber
4. Kerak bo'lsa aniq skriptlar, telefondan gaplashish namunalari ber
5. Raqamlarga asoslanib strategik tahlil qil`;
}

function generateSimpleResponse(message, employees, strategy) {
  const msg = message.toLowerCase();
  
  if (msg.includes('xodim') || msg.includes('hodim')) {
    const empInfo = employees.map((e, i) => 
      `${i + 1}. ${e.name} — KPI: ${e.kpis.map(k => `${k.name}: ${k.currentValue}/${k.targetValue} (${Math.round((k.currentValue||0)/(k.targetValue||1)*100)}%)`).join(', ') || 'belgilanmagan'}`
    ).join('\n');
    return `Xodimlar va ularning KPI ko'rsatkichlari:\n\n${empInfo}\n\nMaslahat: KPI ko'rsatkichlari pastroq bo'lgan xodimlarga qo'shimcha trening yoki motivatsiya dasturi tavsiya etiladi.`;
  }

  if (msg.includes('sotuv') || msg.includes('savdo') || msg.includes('sales')) {
    const totalSales = employees.reduce((sum, e) => sum + e.dailyReports.reduce((s, r) => s + r.qualityLeads, 0), 0);
    return `Sotuv bo'yicha umumiy ma'lumot:\n\n- Jami sifatli lidlar: ${totalSales}\n- Maqsad: ${strategy?.targetSales || 'belgilanmagan'}\n- Bajarilish: ${strategy ? Math.round(totalSales / strategy.targetSales * 100) : 0}%\n\nMaslahat: Konversiyani oshirish uchun sifatli lidlar bilan ishlashga e'tibor qarating. Har bir menejer kuniga kamida 20 ta qo'ng'iroq qilishi kerak.`;
  }

  if (msg.includes('kpi')) {
    return `KPI bo'yicha maslahat:\n\n1. Har bir xodimga aniq va o'lchanadigan KPI belgilang\n2. Haftalik tekshiruvlar olib boring\n3. KPI bajarilishi past bo'lsa, sabab tahlil qiling\n4. Eng yaxshi natijalarni rag'batlantiring\n\nKPI belgilashda SMART tamoyilini qo'llang: Specific, Measurable, Achievable, Relevant, Time-bound.`;
  }

  if (msg.includes('jarima') || msg.includes('bonus')) {
    return `Jarima va bonus tizimi bo'yicha maslahat:\n\n- Jarimalar adolatli va shaffof bo'lishi kerak\n- Bonus tizimi xodimlarni rag'batlantirishi kerak\n- Jarima/bonus nisbati 1:3 bo'lishi tavsiya etiladi\n- Eng yaxshi xodimlarni ommaviy taqdirlang\n\nIzoh: Ortiqcha jarima xodim motivatsiyasini pasaytirishi mumkin. Avval ogohlantirish bering, keyin jarima qo'llang.`;
  }

  if (msg.includes('mijoz') || msg.includes('client') || msg.includes('orgatish') || msg.includes('skript')) {
    return `Mijoz bilan ishlash bo'yicha maslahat:\n\n1. BIRINCHI QADAM: Salomlashish\n   "Assalomu alaykum! [Kompaniya nomi]dan [ismingiz]. Sizga qanday yordam bera olaman?"\n\n2. EHTIYOJNI ANIQLASH:\n   "Hozirda qanday muammo/ehtiyojingiz bor?"\n   "Bu masala sizga qanchalik muhim?"\n\n3. TAKLIFNI TAQDIM ETISH:\n   "Sizning ehtiyojingizga eng mos keladigan yechim..."\n   "Bu mahsulot sizga [aniq foyda] beradi"\n\n4. E'TIROZLARNI HAL QILISH:\n   "Tushunaman, keling bu masalani birga ko'rib chiqamiz"\n   "Boshqa mijozlarimiz ham dastlab shunday o'ylagan, lekin natija..."\n\n5. SOTUVNI YAKUNLASH:\n   "Qachon boshlashimiz mumkin?"\n   "Qaysi variant sizga qulayroq?"\n\nQoida: Muvaffaqiyatli sotuv 80% tinglash va 20% gapirishdir.`;
  }

  return `Salom! Men SalesCRM AI yordamchisiman.\n\nMen quyidagi mavzularda yordam bera olaman:\n\n- Xodimlar — "xodimlar haqida" deb yozing\n- Sotuvlar — "sotuv holati" deb yozing\n- KPI — "kpi maslahat" deb yozing\n- Jarima/Bonus — "jarima tizimi" deb yozing\n- Mijozlar — "mijoz bilan ishlash" deb yozing\n- Skriptlar — "sotuv skripti" deb yozing\n\nQanday savol bor?`;
}
