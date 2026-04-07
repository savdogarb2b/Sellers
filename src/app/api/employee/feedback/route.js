import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyReports: {
          orderBy: { date: 'desc' },
          take: 3
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 3
        },
        penaltyRecords: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const setting = await prisma.systemSettings.findUnique({ where: { key: 'DEEPSEEK_API_KEY' } });
    const apiKey = setting?.value;
    
    if (!apiKey) {
      return NextResponse.json({ feedback: "Hozircha tizimda AI sozlamalari ulanmagan. Kuningiz barakali o'tsin!" });
    }

    // Bugungi sana
    const today = new Date().toLocaleDateString('uz-UZ');
    
    // Kechagi hisobotlar va davomat
    let recentStatsText = "";
    if (user.dailyReports && user.dailyReports.length > 0) {
      const r = user.dailyReports[0];
      recentStatsText += `So'nggi hisobot (${new Date(r.date).toLocaleDateString('uz-UZ')}): \n`;
      recentStatsText += `- Jami qo'ng'iroqlar: ${r.totalCalls}\n`;
      recentStatsText += `- Sifatli lidlar: ${r.qualityLeads}\n`;
      recentStatsText += `- Sotuvlar (yopilgan savdolar): ${r.sales}\n`;
      recentStatsText += `- Tushum: ${r.revenue} so'm\n`;
    } else {
      recentStatsText += "Foydalanuvchida hali hech qanday hisobot yo'q. Bugun uning birinchi kunlaridan biri bo'lishi mumkin.\n";
    }

    let attendanceText = "";
    if (user.attendances && user.attendances.length > 0) {
      const a = user.attendances[0];
      attendanceText += `So'nggi davomat (${new Date(a.date).toLocaleDateString('uz-UZ')}): \n`;
      attendanceText += `- Holati: ${a.status}\n`;
      if (a.isLate) attendanceText += `- Diqqat: Xodim ishga kech qolgan!\n`;
    }

    let penaltyText = "";
    if (user.penaltyRecords && user.penaltyRecords.length > 0) {
      const p = user.penaltyRecords[0];
      penaltyText += `So'nggi jarima: ${p.amount} so'm. Sabab: ${p.reason}\n`;
    }

    const systemPrompt = `Sen "Executive AI" - SalesCRM ning tahlilchi va motivatori hisoblanasan.
Sening vazifang tashkilotning sotuvchi xodimlariga (menejerlarga) har kuni ertalab ular tizimga kirganlarida O'ZBEK TILIDA qisqa, ta'sirchan va shaxsiy motivatsion "Feedback" (Fikr-mulohaza) xabarini berish.

MAQSADING:
1. Xodimni ruhlantirish va bugungi savdolarga (sotuvlarga) katta ishtiyoq uyg'otish.
2. Xodimning so'nggi natijalarini (agar yaxshi bo'lsa) maqtab qo'yish.
3. Agar xodimning natijalari past bo'lsa, xatolikni aytish (masalan: "kecha ko'p mijoz bilan gaplashgansiz, lekin sotuv kam bo'libdi", yoki "oxirgi kunlarda kech qolyapsiz").
4. Kamchiliklarni qattiq emas, balki g'amxo'rlik va dalda berish ohangida aytish.
5. Juda katta xatboshilarsiz, qisqa, лo'nda (max 4-5 jumla) va chiroyli emojilar bilan yozish.

Xodimning ismi: ${user.name}
Bugungi sana: ${today}

Xodimning so'nggi natijalari tahlili uchun ma'lumotlar:
${recentStatsText}
${attendanceText}
${penaltyText}

Ushbu ma'lumotlarga asoslanib, faqat xodimning o'ziga qaratilgan, Markdown formatida chiroyli xabar yozib ber.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      console.error('DeepSeek error fetching daily feedback:', await response.text());
      return NextResponse.json({ feedback: `Salom ${user.name}! Bugungi savdolaringiz barakali bo'lsin. Omad!` });
    }

    const data = await response.json();
    const feedback = data.choices[0]?.message?.content || `Salom ${user.name}! Bugungi kuningiz omadli va savdolarga boy bo'lsin!`;

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ feedback: "Bugungi kuningiz barakali o'tsin!" });
  }
}
