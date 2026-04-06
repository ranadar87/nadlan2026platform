import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Search, MessageSquare, BarChart3, Lock, Sparkles, ChevronDown, ArrowRight, Check, Play, MapPin, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(0);
  const [liveCount, setLiveCount] = useState(387);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStart = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) navigate("/dashboard");
    else base44.auth.redirectToLogin("/dashboard");
  };

  const features = [
    {
      icon: Search,
      title: "שאיבה אוטומטית של לידים",
      desc: "הגדר פרמטרים פעם אחת. המערכת שואבת מיד2 + מדלן אוטומטית.",
      stat: "150 לידים חדשים לשבוע — ב-3 דקות הגדרה"
    },
    {
      icon: MessageSquare,
      title: "קמפיין WhatsApp עם AI",
      desc: "AI כותב 3 וריאציות הודעה, המערכת שולחת בתזמון חכם.",
      stat: "74% שיעור פתיחה — לעומת 23% ב-Email"
    },
    {
      icon: BarChart3,
      title: "CRM מלא ומותאם",
      desc: "ניהול לידים, לקוחות, משימות ויומן — ממקום אחד.",
      stat: "40% עלייה בסגירות ב-60 יום ראשונים"
    },
    {
      icon: Sparkles,
      title: "AI לתוכן שיווקי",
      desc: "הזן תיאור נכס — AI כותב הודעה מושלמת בשניות.",
      stat: "חסוך 3 שעות כתיבה ביום"
    },
    {
      icon: BarChart3,
      title: "דוחות וביצועים בזמן אמת",
      desc: "ראה בדיוק מה עובד, קבל החלטות על בסיס נתונים.",
      stat: "מדדי ביצועים מלאים + A/B Testing"
    },
    {
      icon: Lock,
      title: "Multi-Vertical + White Label",
      desc: "נדל״ן, רכב, ביטוח — Zira מתאימה את עצמה בקליק.",
      stat: "כבר ב-3 ורטיקלים + עוד 5 בדרך"
    },
  ];

  const testimonials = [
    {
      quote: "לפני Zira הייתי עם Excel וWhatsApp. שבוע אחרי ההצטרפות כבר סגרתי 2 עסקאות מלידים שהמערכת מצאה לי. ה-ROI? x23.",
      author: "יוסי כהן",
      title: "מתווך עצמאי, תל אביב",
      exp: "8 שנות ניסיון"
    },
    {
      quote: "ניהלתי 6 סוכנים בלי מושג מה עושה כל אחד. היום יש לי דשבורד שמראה בזמן אמת מי סגר, מי שלח, ומה הצינור.",
      author: "שרה לוי",
      title: "מנהלת סוכנות, רמת גן",
      exp: "40 סוכנים"
    },
    {
      quote: "אני סוחר רכב — ניסיתי ואחרי חודש יש לי 180 לידים חמים מיד2 רכב. 12 מהם קנו כבר.",
      author: "דוד מזרחי",
      title: "סוחר רכב, חיפה",
      exp: "3 מרכזי מכירות"
    }
  ];

  const pricing = [
    {
      name: "סולו",
      price: "₪249",
      period: "/חודש • חיוב שנתי",
      features: [
        "1,000 קרדיטי שאיבה חודשיים",
        "קמפיין WA — עד 500 הודעות",
        "200 SMS כלולים",
        "CRM בסיסי — עד 2,000 לידים",
        "AI לכתיבת הודעות",
        "דוחות בסיסיים",
        "תמיכה בצ'אט"
      ]
    },
    {
      name: "פרו ✦",
      price: "₪399",
      period: "/חודש • חיוב שנתי",
      popular: true,
      features: [
        "5,000 קרדיטי שאיבה חודשיים",
        "קמפיין WA — ללא הגבלה",
        "1,000 SMS כלולים",
        "CRM מלא — לידים ללא הגבלה",
        "AI מתקדם + יצירת תמונות",
        "Pipeline ויזואלי",
        "דוח מלא + A/B Testing",
        "תמיכה עדיפות"
      ]
    },
    {
      name: "סוכנות",
      price: "₪899",
      period: "/חודש • עד 10 משתמשים",
      features: [
        "20,000 קרדיטי שאיבה חודשיים",
        "כל פיצ'רי פרו × 10 משתמשים",
        "דשבורד מנהל",
        "White Label",
        "API גישה",
        "מנהל לקוח אישי",
        "SLA — תגובה < 2 שעות"
      ]
    }
  ];

  const faqs = [
    { q: "האם זה עובד עם WhatsApp רגיל?", a: "כן! Zira תומכת בשני הסוגים. חבר כל חשבון WA בסריקת QR פשוטה." },
    { q: "האם יחסמו לי את הוואטסאפ?", a: "לא אם מתנהגים נכון. Zira מגבילה שליחה לפי המגבלות הרשמיות עם הפרשות חכמות." },
    { q: "כמה זמן לוקח להתחיל?", a: "15 דקות. הירשם → חבר WA → הגדר שאיבה → שלח קמפיין ראשון." },
    { q: "צריך ידע טכני?", a: "אפס. אם אתה יכול לשלוח WhatsApp — אתה יכול להשתמש ב-Zira." },
    { q: "הנתונים שלי בטוחים?", a: "100%. כל נתונים מוצפנים ומאובטחים בשרתים בישראל. לא מוכרים, לא חולקים." },
    { q: "יש חוזה התקשרות?", a: "לא. חיוב חודשי, ביטול בכל עת, ללא קנסות." }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Assistant', sans-serif" }}>
      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? "backdrop-blur-lg bg-white/95 border-b border-border/40 shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:inline">ZIRA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">תכונות</a>
            <a href="#pricing" className="hover:text-foreground transition">מחירים</a>
            <a href="#testimonials" className="hover:text-foreground transition">ביקורות</a>
            <a href="#faq" className="hover:text-foreground transition">שאלות נפוצות</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/15 text-success text-[11px] font-bold hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              387 פעילים עכשיו
            </div>
            <Button onClick={handleStart} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow">
              ✦ התחל חינם
            </Button>
          </div>
        </div>
      </header>

      {/* 01 Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/3 w-96 h-96 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-gradient-to-bl from-cyan-600/15 to-indigo-600/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/10 text-indigo-600 text-xs font-bold border border-indigo-600/20">
            <Zap className="w-3.5 h-3.5" /> הפלטפורמה #1 לתיווכים בישראל
          </div>

          <div>
            <h1 className="text-6xl md:text-7xl font-black text-foreground leading-tight mb-4">
              תפסיק לחפש.
              <span className="block mt-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">תתחיל לסגור.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              הפלטפורמה הראשונה בישראל שאוספת לידים חמים מיד2 ומדלן, שולחת WA אוטומטי עם AI — ומנהלת את כל הלקוחות ממקום אחד.
            </p>
          </div>

          <p className="text-sm font-bold text-foreground italic">
            "בלי קוד. בלי טכנולוגיה. בלי בזבוז זמן. רק תוצאות."
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleStart} size="lg" className="gap-2 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-lg font-bold h-12 hover:shadow-lg transition-all">
              ← התחל 14 יום חינם
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 h-12">
              <Play className="w-4 h-4" /> צפה בדמו 2 דקות
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            "הצטרפו ל-387 מתווכים שכבר הכפילו את הלידים שלהם"
          </p>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 via-transparent to-transparent rounded-3xl blur-2xl" />
            <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden p-2 shadow-2xl">
              <div className="bg-white rounded-xl p-6 text-center text-muted-foreground text-sm">
                <div className="space-y-4">
                  <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse" />
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-6 bg-slate-100 rounded animate-pulse" />)}
                  </div>
                  <div className="h-40 bg-slate-50 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 Social Proof Bar */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm font-bold mb-4">מאמינים בנו:</p>
          <div className="flex flex-wrap items-center justify-center gap-8 mb-6">
            {[
              { logo: "יד2", w: "w-12" },
              { logo: "מדלן", w: "w-12" },
              { logo: "🏠", w: "w-12" },
              { logo: "🚗", w: "w-12" },
              { logo: "💼", w: "w-12" }
            ].map((item, i) => (
              <div key={i} className="text-2xl opacity-60 hover:opacity-100 transition">{item.logo}</div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
            <div><p className="text-2xl font-black text-indigo-400">387</p><p className="text-white/60">עסקים פעילים</p></div>
            <div><p className="text-2xl font-black text-purple-400">84,000</p><p className="text-white/60">לידים שנשאבו</p></div>
            <div><p className="text-2xl font-black text-cyan-400">2.3M</p><p className="text-white/60">הודעות WA</p></div>
            <div><p className="text-2xl font-black text-indigo-400">4.9★</p><p className="text-white/60">דירוג משתמשים</p></div>
          </div>
        </div>
      </section>

      {/* 03 Problem Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white via-indigo-50/30 to-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-foreground text-center mb-4">כמה מזה נשמע מוכר?</h2>
          <p className="text-lg text-muted-foreground text-center mb-12">הלקוח רואה את עצמו פה</p>

          <div className="space-y-4">
            {[
              { icon: "😤", num: 1, title: "הגלישה התחת", desc: "אתה גולש ביד2 שעתיים — ומסיים עם 10 מספרים שלא יעשו כלום כי אין לך זמן." },
              { icon: "📱", num: 2, title: "הספאם הכמוס", desc: "שלחת WA לליד פעמיים. פעם מהטלפון הפרטי, פעם מה-Business. הוא חסם אותך." },
              { icon: "📊", num: 3, title: "האתות עם ידיים ריקות", desc: "בסוף החודש: כמה עסקאות פספסתי? אין לך מושג. אין מעקב. אין מערכת. אין כסף." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-2xl bg-white border-2 border-red-200/40 hover:border-red-300/60 transition-all group">
                <span className="text-4xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-bold text-foreground mb-1">❎ {item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-red-600/10 to-orange-600/10 border-2 border-red-400/30">
            <p className="text-center font-bold text-foreground text-lg">
              "ומה עולה לך זה? בין <span className="text-red-600">₪8,000</span> ל-<span className="text-red-600">₪25,000</span> בעמלות אבודות בחודש."
            </p>
          </div>
        </div>
      </section>

      {/* 04 Solution Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl font-black text-center mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Zira עושה הכל בשבילך — בזמן שאתה ישן.
          </h2>

          <div className="grid md:grid-cols-3 gap-6 my-12">
            {[
              { num: "①", title: "שאב", desc: "הגדר חיפוש אחד. Zira שואבת מיד2 + מדלן אוטומטית." },
              { num: "②", title: "שלח", desc: "AI כותב הודעות WA מותאמות אישית + שולח בתזמון חכם." },
              { num: "③", title: "נהל", desc: "CRM מלא: לידים, משימות, יומן, דוחות. ממקום אחד." }
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-white to-indigo-50/50 border-2 border-indigo-200/50 text-center hover:shadow-lg transition-all">
                <p className="text-5xl font-black text-indigo-600 mb-3">{item.num}</p>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-lg font-bold text-foreground">
            💡 "פחות מ-15 דקות ביום. אנחנו עושים את השאר."
          </p>
        </div>
      </section>

      {/* 05 Features Grid */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-3">כל מה שצריך כדי לשלוט בשוק</h2>
          <p className="text-center text-muted-foreground mb-16">בפלטפורמה אחת, ללא התפשרויות</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group p-6 rounded-2xl bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200/60 hover:border-indigo-400/50 hover:shadow-xl transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{f.desc}</p>
                  <p className="text-xs font-bold text-indigo-600">✦ {f.stat}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 06 How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-3">3 שלבים. 15 דקות. לידים חמים בידיים.</h2>
          <p className="text-center text-muted-foreground mb-16">עם Zira זה פשוט כמו זה:</p>

          <div className="space-y-4">
            {[
              { step: "1", title: "הירשם וחבר WA", desc: "סרוק QR. אתה מחובר תוך דקה." },
              { step: "2", title: "הגדר שאיבה ראשונה", desc: "בחר עיר, סוג נכס, טווח מחיר. לחץ שאב." },
              { step: "3", title: "שלח קמפיין AI", desc: "בחר לידים, AI כותב, תזמן שליחה. הכל אוטומטי." }
            ].map((item, i) => (
              <div key={i} className="relative">
                {i < 2 && <div className="absolute left-8 top-20 w-1 h-8 bg-gradient-to-b from-indigo-600 to-transparent" />}
                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="pt-3">
                    <h3 className="font-bold text-lg text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-green-600/10 to-cyan-600/10 border-2 border-green-400/30 text-center">
            <p className="text-lg font-bold text-foreground">
              ⚡ "בממוצע, לקוחות Zira מקבלים תגובה ראשונה תוך <span className="text-green-600">4 שעות</span> מהשאיבה הראשונה."
            </p>
          </div>
        </div>
      </section>

      {/* 07 Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-3">387 אנשי מכירות לא טועים</h2>
          <p className="text-center text-muted-foreground mb-16">קרא מה אומרים כבר משתמשים</p>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border-2 border-indigo-200/50 hover:shadow-lg transition-all">
                <p className="text-3xl mb-4">❝</p>
                <p className="text-sm text-foreground mb-4 leading-relaxed italic">{t.quote}</p>
                <div className="border-t border-indigo-200/50 pt-4">
                  <p className="font-bold text-foreground text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.title}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-1">✦ {t.exp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 08 Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-3">בחר את החבילה שמתאימה לך</h2>
          <p className="text-center text-muted-foreground mb-4">שנה בכל עת. ללא התחייבות.</p>

          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-orange-600/10 to-red-600/10 border-2 border-orange-400/30 max-w-2xl mx-auto">
            <p className="text-center text-sm font-bold text-foreground">
              💡 <strong>השוואה לחלופות:</strong> שעות ידנוי (₪9,000) + CRM (₪500-2K) + WA (₪300-800) + AI (₪200-400) = <strong>₪10,000-12,200</strong><br/>
              Zira פרו: <strong>₪399</strong> | חיסכון: <strong>₪9,600-11,800/חודש!</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((pkg, i) => (
              <div key={i} className={`rounded-2xl border-2 p-8 transition-all relative ${
                pkg.popular
                  ? "border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-2xl scale-105"
                  : "border-slate-200 bg-white hover:border-indigo-300"
              }`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                    ★ הכי פופולרי ★
                  </div>
                )}
                <h3 className="text-2xl font-black text-foreground mb-1">{pkg.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{pkg.period}</p>
                <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">{pkg.price}</p>

                <ul className="space-y-3 mb-8">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button onClick={handleStart} className={`w-full font-bold h-11 ${
                  pkg.popular ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-slate-200 text-foreground hover:bg-slate-300"
                }`}>
                  בחר עכשיו
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 09 FAQ */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-12">שאלות נפוצות</h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden hover:border-indigo-400/50 transition-colors">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? -1 : i)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-indigo-50/50 transition-colors"
                >
                  <h3 className="font-bold text-foreground text-left">{faq.q}</h3>
                  <ChevronDown className={`w-5 h-5 text-indigo-600 transition-transform flex-shrink-0 ${activeFaq === i ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-4 pt-0 text-muted-foreground text-sm border-t border-slate-200 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 Final CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-600/10" />
        <div className="max-w-3xl mx-auto relative z-10 text-center space-y-6">
          <h2 className="text-5xl font-black text-foreground">
            מוכנים להכפיל את המכירות שלכם?
          </h2>
          <p className="text-lg text-muted-foreground">
            התחילו עכשיו — לא צריך כרטיס אשראי, ולא צריך פרטי בנק.
          </p>
          <Button onClick={handleStart} size="lg" className="gap-2 px-8 h-12 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg">
            ← התחל 14 יום חינם <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* 11 Footer */}
      <footer className="border-t-2 border-slate-200 bg-slate-50 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <p className="font-bold text-foreground mb-3">ZIRA</p>
              <p className="text-xs text-muted-foreground">הזירה של אנשי העסקים החכמים</p>
            </div>
            <div>
              <p className="font-bold text-foreground mb-3 text-sm">מוצר</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">תכונות</a></li>
                <li><a href="#pricing" className="hover:text-foreground">מחירים</a></li>
                <li><a href="#faq" className="hover:text-foreground">שאלות נפוצות</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-foreground mb-3 text-sm">חברה</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">בלוג</a></li>
                <li><a href="#" className="hover:text-foreground">צור קשר</a></li>
                <li><a href="#" className="hover:text-foreground">ת״נ</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-foreground mb-3 text-sm">ניהול</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/admin" className="hover:text-foreground">דשבורד אדמין</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-foreground mb-3 text-sm">צור קשר</p>
              <p className="text-xs text-muted-foreground">support@zira.co.il</p>
              <p className="text-xs text-muted-foreground mt-2">WhatsApp: 054-XXX-XXXX</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 text-center text-xs text-muted-foreground">
            <p>© 2026 ZIRA. כל הזכויות שמורות. | <a href="#" className="hover:text-foreground">תנאי שימוש</a> | <a href="#" className="hover:text-foreground">מדיניות פרטיות</a></p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/972XXXXXXXXX" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all z-40">
        <MessageSquare className="w-6 h-6" />
      </a>
    </div>
  );
}