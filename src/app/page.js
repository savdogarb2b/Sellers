'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardPath = () => {
    if (!session) return '/login';
    if (session.user.role === 'SUPERADMIN') return '/superadmin';
    if (session.user.role === 'ADMIN') return '/admin';
    return '/employee';
  };

  if (status === 'loading') {
    return (
      <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const navLinkStyle = {
    color: 'var(--text-secondary)',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    letterSpacing: '0.5px',
    transition: 'color 0.3s ease',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)', overflowX: 'hidden', position: 'relative' }}>
      <main>
      
      {/* Background Animated Spheres */}
      <div className="landing-glow-sphere" style={{ top: '-10%', left: '-10%' }} />
      <div className="landing-glow-sphere secondary" style={{ top: '30%', right: '-15%' }} />
      <div className="landing-glow-sphere" style={{ bottom: '10%', left: '20%', filter: 'blur(100px)' }} />

      {/* Navigation */}
      <nav aria-label="Asosiy navigatsiya" style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, height: '70px', 
        background: scrolled ? 'var(--bg-navbar)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '0 5%', zIndex: 1000,
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-logo" style={{ background: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))', color: '#000' }} aria-hidden="true">S</div>
          <span style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '2px', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Nur<span style={{ color: 'var(--primary-500)' }}>Seles</span></span>
        </div>
        
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="desktop-menu">
          <a href="#home" title="Bosh sahifaga o'tish" style={navLinkStyle} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Bosh Sahifa</a>
          <a href="#features" title="CRM tizimi xususiyatlari" style={navLinkStyle} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Xususiyatlar</a>
          <a href="#how-it-works" title="Tizim qanday ishlaydi" style={navLinkStyle} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Qanday Ishlaydi</a>
          <a href="#benefits" title="CRM afzalliklari" style={navLinkStyle} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Afzalliklar</a>
          <a href="#contact" title="Biz bilan bog'lanish" style={navLinkStyle} onMouseEnter={(e) => e.target.style.color = 'white'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Aloqa</a>
        </div>

        <div>
           <Link href={getDashboardPath()} className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)' }}>
             {session ? "Boshqaruviga O’tish" : "Tizimga Kirish"}
           </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="home" role="banner" aria-label="Bosh sahifa" style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 5% 60px 5%', position: 'relative'
      }}>
        <div className="animate-slide-up" style={{ display: 'inline-block', padding: '6px 16px', background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          Versiya 2.0: Sun’iy Intellekt Bilan SaaS
        </div>
        
        <h1 className="animate-slide-up delay-100" style={{ 
          fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 950, lineHeight: 1.1, 
          letterSpacing: '-1px', marginBottom: '24px', maxWidth: '1000px' 
        }}>
          NurSeles — Sotuvlarni Oddiy Daftardan Emas, <br/>
          <span style={{ background: 'linear-gradient(90deg, var(--primary-400), var(--accent-teal), var(--accent-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Sun’iy Intellekt Bilan Boshqaring</span>
        </h1>
        
        <p className="animate-slide-up delay-200" style={{ 
          fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-secondary)', 
          maxWidth: '800px', marginBottom: '40px', lineHeight: 1.6, fontWeight: 500 
        }}>
          Xodimlaringiz qanday sotayotganini, kompaniyangizdagi lidlar qayerga ketayotganini bitta oynada ko’ring. Barcha tahlillar AI tomonidan boshqariladigan Premium SaaS tizimi. Bugun ro’yxatdan o’ting va savdolaringizni avtomatlashtiring.
        </p>
        
        <div className="animate-slide-up delay-300" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href={getDashboardPath()} className="btn btn-primary btn-lg" style={{ borderRadius: 'var(--radius-full)', padding: '16px 36px', fontSize: '15px' }}>
            Hozir Boshlang
          </Link>
          <a href="#features" className="btn btn-secondary btn-lg" style={{ borderRadius: 'var(--radius-full)', padding: '16px 36px', fontSize: '15px', background: 'var(--bg-card)' }}>
            Imkoniyatlar
          </a>
        </div>

        {/* Dashboard Mockup Card */}
        <div className="glass-panel animate-slide-up delay-400" style={{ 
          marginTop: '80px', width: '100%', maxWidth: '1100px', height: '400px', 
          background: 'linear-gradient(180deg, rgba(15, 15, 17, 0.9) 0%, rgba(10, 10, 10, 0.95) 100%)', 
          border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
          borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
          boxShadow: '0 -20px 80px rgba(16, 185, 129, 0.08)',
          position: 'relative', overflow: 'hidden', padding: '2px'
        }}>
          {/* Mockup Top Bar */}
          <div style={{ height: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '8px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.5)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(217, 119, 6, 0.5)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.5)' }} />
          </div>
          {/* Mockup UI Elements generated purely via CSS sizes to mimic the re-charts logic */}
          <div style={{ padding: '30px', display: 'flex', gap: '20px' }}>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ height: '60px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                <div style={{ height: '200px', borderRadius: '12px', background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}></div>
             </div>
             <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div style={{ height: '130px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212, 175, 55, 0.1)' }}></div>
               <div style={{ height: '130px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(14, 165, 233, 0.1)' }}></div>
             </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" aria-labelledby="features-title" style={{ padding: '100px 5%', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span style={{ fontSize: '13px', color: 'var(--primary-500)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, marginBottom: '16px', display: 'block' }}>Bizning Ustunligimiz</span>
          <h2 id="features-title" style={{ fontSize: 'clamp(32px, 4vw, 42px)', fontWeight: 900, marginBottom: '20px' }}>Nima Uchun NurSeles CRM?</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>Bozordagi murakkab va eskirgan tizimlarni unuting. Eng Premium dark-rejimi, va inqilobiy yondashuv bu yerda.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <FeatureCard 
            title="SaaS Ekosistema" 
            desc="Sizga alohida server kerak emas. Barcha kompaniyalar bitta joyda qat’iy himoyalangan va o’zaro izolyatsiyada ishlaydi. Hech qanday ma’lumotlar aralashuvi yo’q."
            color="var(--accent-teal)"
          />
          <FeatureCard 
            title="Premium Recharts Grafika" 
            desc="Miyani charchatuvchi mayda sonlar o’rniga, Apple Watch kabi neon halqali vizual indikatorlar, Donut Chartlar va Area Chartlar. Tizimli biznes holatini tez tushunasiz."
            color="var(--primary-400)"
          />
          <FeatureCard 
            title="Gemini AI (Sun’iy Intellekt)" 
            desc="Ichkarida sizning kompaniyangiz statistikasini tahlil qilib, eng optimal sotuv strategiyasini beruvchi virtual maslahatchi o’rnatilgan."
            color="var(--accent-blue)"
          />
          <FeatureCard 
            title="Dinamik Voronka" 
            desc="Siz xohlagancha bosqich (stage) yarating va mijozlarning yo’qotilish nuqtalarini kashf eting. Voronka o’zi foizli o’tish ko’rsatkichlarini tuzadi."
            color="#8b5cf6"
          />
          <FeatureCard 
            title="Bonuslar va Jarimalar" 
            desc="Intizom markaziyatli tizim! Xodim kechiksa yoki plan bajara olmasa xisbot qilib avto-jarima yoki maoshiga bonus belgilaysiz. Konkurensiya sharoiti!"
            color="var(--danger-400)"
          />
          <FeatureCard 
            title="Expensive Dark Dizayn" 
            desc="Ko’zni o’yuvchi oq fon o’rniga faqat to’q tundagi (Matte Black) fonlar va shishasimon (Glassmorphism) ko’rinish. Haqiqiy ishbilarmonlar muhiti."
            color="var(--text-primary)"
          />
        </div>
      </section>

      {/* Deep Dive / Benefits Section */}
      <section id="benefits" aria-labelledby="benefits-title" style={{ padding: '100px 5%', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
         <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '60px', alignItems: 'center' }}>
            <div style={{ flex: '1 1 500px' }}>
               <h2 id="benefits-title" style={{ fontSize: 'clamp(28px, 3vw, 36px)', fontWeight: 900, marginBottom: '24px', lineHeight: 1.2 }}>Raqqobatda Orqada Qolmang, Ma’lumotlarni Boshqaring.</h2>
               <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px', fontSize: '16px' }}>
                 Katta korxonalarning sirli quroli nima ekanini bilasizmi? Ular qog’ozda hisob-kitob qilishmaydi. Ular raqamlarni aniq vaqtda (Real-Time) ko’rib qaror qabul qilishadi. 
               </p>
               <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '32px', fontSize: '16px' }}>
                 NurSeles sizga menejerlarning qayerda xato qilayotganini, kunlik yo’qolgan summalar hajmini bir tugma orqali ilg’ab olish qulayligini yaratadi. Shunchaki logindan kiring va qolgan og’ir hisoblarni AI siz uchun olib boradi!
               </p>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <CheckListItem text="Shikoyat va Lidlar To’liq Analizlanadi" />
                 <CheckListItem text="Admin uchun Barcha Moliyaviy Yo’qotishlar (Teshiklar) yopiladi" />
                 <CheckListItem text="Maosh va Oylik daromaddagi noaniqliklarga chek qo’yiladi" />
               </div>
            </div>
            
            <div style={{ flex: '1 1 400px' }}>
               {/* Decorative Side Element */}
               <div className="glass-panel" style={{ padding: '40px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(10, 10, 10, 0.95) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', position: 'relative' }}>
                  <div className="landing-glow-sphere" style={{ width: 200, height: 200, top: '10%', right: '10%', filter: 'blur(40px)' }} />
                  <h4 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', color: 'var(--accent-teal)' }}>+300%</h4>
                  <p style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '10px' }}>Sotuvdagi Samaradorlik</p>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Tizim orqali ishni raqamlashtirgan kompaniyalar birinchi oydanoq isrofgarchilik va noto’g’ri tahlillardan butunlay arigani aniqlandi.</p>
               </div>
            </div>
         </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" aria-labelledby="how-it-works-title" style={{ padding: '100px 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span style={{ fontSize: '13px', color: 'var(--accent-teal)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, marginBottom: '16px', display: 'block' }}>Ishlash Jarayoni</span>
          <h2 id="how-it-works-title" style={{ fontSize: 'clamp(32px, 4vw, 42px)', fontWeight: 900 }}>Barchasi 3 Qadamda Ishlaydi</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '800px', margin: '0 auto' }}>
          <StepRow number="01" title="Tashkilot Yarating (Superadmin)" desc="Loyiha egalari tomonidan yagona serveringizda Tashkilot ro’yxatdan o’tkazilib, Admin (kompaniya egasi) huquqi yaratiladi." />
          <StepRow number="02" title="Xodimlarni Biriktirish (Admin)" desc="Admin tizimga o’zining mutlaqo izolatsiyalangan darchasidan kiradi. Hamda boshlang’ich strategiya va xodimlarni shtatga ulaydi." />
          <StepRow number="03" title="G’alaba Va Tahlil (Barcha)" desc="Xodimlar kunlik hisobotini yozishni boshlaydi. Tizim avtomat ravishda barcha raqamlar bo’yicha vizual chartlar va AI analizi qurib beradi." />
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" aria-labelledby="contact-title" style={{ padding: '100px 5%', position: 'relative' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
             <h2 style={{ fontSize: '13px', color: 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800, marginBottom: '16px' }}>Bog’lanish</h2>
             <h2 id="contact-title" style={{ fontSize: 'clamp(32px, 4vw, 42px)', fontWeight: 900, marginBottom: '20px' }}>Biz Bilan Aloqaga Chiqing</h2>
             <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>Sizning korxonangiz uchun individual narx va sozlamalar haqida gaplashamiz. Tizimga ulanish bepul sinov bilan boshlanadi.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
             {/* Contact Info */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div className="card glass-panel" style={{ padding: '30px' }}>
                   <div style={{ width: 40, height: 40, background: 'var(--primary-ghost)', color: 'var(--primary-400)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, marginBottom: 16 }}>@</div>
                   <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Elektron Pochta</h4>
                   <p style={{ color: 'var(--text-secondary)' }}>info@salescrm.uz</p>
                </div>
                <div className="card glass-panel" style={{ padding: '30px' }}>
                   <div style={{ width: 40, height: 40, background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20, marginBottom: 16 }}>#</div>
                   <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Telefon Raqam</h4>
                   <p style={{ color: 'var(--text-secondary)' }}>+998 (90) 123-45-67</p>
                </div>
             </div>

             {/* Contact Form */}
             <div className="glass-panel" style={{ padding: '40px', position: 'relative' }}>
               <h4 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>Xabar yuborish</h4>
               <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 150px' }}>
                       <label className="form-label">Ismingiz</label>
                       <input type="text" className="form-input" placeholder="Ali Valiyev" />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                       <label className="form-label">Telefoningiz</label>
                       <input type="text" className="form-input" placeholder="+998 90 000 00 00" />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Tashkilot nomi</label>
                    <input type="text" className="form-input" placeholder="Sizning kompaniyangiz" />
                  </div>
                  <div>
                    <label className="form-label">Xabar matni</label>
                    <textarea className="form-input" rows={4} placeholder="Qanday yordam bera olamiz?..." style={{ resize: 'vertical' }}></textarea>
                  </div>
                  <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '14px', borderRadius: 'var(--radius-md)' }}>So’rov Yuborish</button>
               </form>
             </div>
          </div>
        </div>
      </section>

      </main>
      {/* Footer */}
      <footer role="contentinfo" style={{ padding: '60px 5%', borderTop: '1px solid var(--border-color)', background: '#050505' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px' }}>
           <div style={{ maxWidth: '300px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div className="brand-logo" style={{ width: 32, height: 32, fontSize: '14px', background: 'var(--primary-500)', color: '#000' }} aria-hidden="true">N</div>
                <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1.5px', color: 'var(--text-primary)' }}>NURSELES</span>
             </div>
             <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6 }}>Eng so’nggi va tezyurar texnologiyalar ustiga qurilgan, Premium darajadagi boshqaruv markazi va CRM tizimi.</p>
           </div>
           
           <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sahifalar</h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <li><a href="#home" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Bosh Sahifa</a></li>
                   <li><a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Xususiyatlar</a></li>
                   <li><a href="#how-it-works" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Qo’llanma</a></li>
                </ul>
              </div>
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Qonuniy</h5>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Maxfiylik Siyosati</a></li>
                   <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Foydalanish shartlari</a></li>
                </ul>
              </div>
           </div>
        </div>
        
        <div style={{ maxWidth: '1200px', margin: '40px auto 0 auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
          &copy; {new Date().getFullYear()} NurSeles CRM. Barcha huquqlar himoyalangan. O'zbekistonda ishlab chiqilgan.
        </div>
      </footer>
      
      {/* Inline styles for desktop menu utility */}
      <style dangerouslySetInnerHTML={{__html: `
         @media (max-width: 768px) {
           .desktop-menu { display: none !important; }
         }
      `}} />
    </div>
  );
}

// ---------------- Helper Components ---------------- //

function FeatureCard({ title, desc, color }) {
  return (
    <div className="glass-panel" style={{ 
      padding: '36px', position: 'relative', overflow: 'hidden', 
      transition: 'transform 0.3s ease, border-color 0.3s ease',
      cursor: 'default',
      background: 'rgba(255,255,255,0.02)'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.8 }} />
      <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color, letterSpacing: '0.5px' }}>{title}</h4>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>{desc}</p>
    </div>
  );
}

function StepRow({ number, title, desc }) {
  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <div style={{ 
        width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: 900, color: 'var(--primary-400)',
        boxShadow: 'inset 0 0 20px rgba(212, 175, 55, 0.05)'
      }}>
        {number}
      </div>
      <div style={{ paddingTop: '8px' }}>
        <h4 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>{title}</h4>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

function CheckListItem({ text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-teal-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)' }} />
      </div>
      <span style={{ fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>{text}</span>
    </div>
  );
}
