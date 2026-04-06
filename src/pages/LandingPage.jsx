import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Zap, Target, BarChart3, Smartphone, Lock, Zap as ZapIcon, ChevronDown, ArrowRight, Check } from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState(0);

  const features = [
    { icon: Target, label: "ניהול לידים ברמה מקצועית", desc: "שמור, סנן וארגן לידים מאפליקציות נדל\"ן בקליק אחד" },
    { icon: Smartphone, label: "שליחת קמפיינים ווטסאפ", desc: "שלח הודעות בקבוצות גדולות עם אחוזי פתיחה גבוהים" },
    { icon: BarChart3, label: "דוחות מפורטים בזמן אמת", desc: "עקוב אחרי ביצועים, שיעורי פתיחה והתגובות" },
    { icon: Zap, label: "אוטומציה חכמה עם AI", desc: "יצור וריאציות הודעות בשנייה אחת עם Gemini Pro" },
    { icon: Lock, label: "אבטחה ברמה ארגונית", desc: "הצפנה מלאה ואחסון מאובטח של כל הנתונים" },
  ];

  const pricing = [
    { 
      name: "סטארטר", 
      price: "₪299", 
      period: "/חודש", 
      leads: "עד 500 לידים",
      messages: "עד 5,000 הודעות",
      features: ["שליחת קמפיינים בסיסית", "דוחות בזמן אמת", "תמיכה לקוח 24/7"],
      cta: "התחל בחינם"
    },
    { 
      name: "פרו", 
      price: "₪799", 
      period: "/חודש", 
      leads: "עד 5,000 לידים",
      messages: "עד 50,000 הודעות",
      features: ["קמפיינים מתקדמים", "AI וריאציות הודעות", "ניתוח תמציתי", "עדיפות בתמיכה"],
      cta: "בחר עכשיו",
      popular: true
    },
    { 
      name: "אנטרפרייז", 
      price: "בהתאמה", 
      period: "", 
      leads: "הלא מוגבל",
      messages: "הלא מוגבל",
      features: ["API וחיבורים מותאמים", "דוחות מקצועיים", "קבוצת תמיכה ייעודית", "הכשרה ממלול"],
      cta: "דברו איתנו"
    },
  ];

  const faqs = [
    {
      q: "מה אם אני עדיין לא בטוח?",
      a: "אנחנו מציעים 14 ימי בחינם ללא צורך בכרטיס אשראי. נסה את כל התכונות ותרגיש בעצמך את ההבדל."
    },
    {
      q: "האם אני יכול לשלוח קמפיינים בכמות גדולה?",
      a: "בהחלט! אנחנו מתמחים בשליחת קמפיינים לאלפי אנשים בבת אחת עם אוטומציה חכמה וזימון בחכמה."
    },
    {
      q: "כמה זמן לוקח להתחיל?",
      a: "5 דקות. התחבר, יבא את הלידים שלך, בחר טמפלט, ושלח. קל כמו זה."
    },
    {
      q: "האם הנתונים שלי בטוחים?",
      a: "100%. כל הנתונים מוצפנים, מאובטחים בשרתים בישראל, ולא נדרגו לשום צד שלישי."
    },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Assistant', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-glow transition-shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:inline">BrokerPro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">צור קשר</Button>
            <Link to="/"><Button size="sm" className="gap-1">כניסה <ArrowRight className="w-3 h-3" /></Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
            <Zap className="w-3 h-3" /> אפליקציית המכירה #1 לתיווך נדלן בישראל
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            תוכל להפוך לסופר-סיילס בקליק אחד
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            שמור לידים מיד2 ומדלן, שלח קמפיינים ווטסאפ בקבוצות וקבל דוחות בזמן אמת. הכל בעזרת AI חכם שחוסך לך שעות של עבודה.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Button size="lg" className="gap-2 px-6">
              התחל בחינם <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-6">
              צפה בדמו <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center text-sm">
            {[
              { num: "2,500+", label: "תיווכים פעילים" },
              { num: "500K+", label: "לידים במערכת" },
              { num: "4.8/5", label: "דירוג משתמשים" },
              { num: "24/7", label: "תמיכה בעברית" },
              { num: "100%", label: "בטוח בישראל" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                <p className="font-bold text-foreground text-sm md:text-base">{item.num}</p>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-3">למה תיווכים בוחרים בנו</h2>
            <p className="text-muted-foreground">כל הכלים שאתה צריך כדי להכפיל את המכירות שלך</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-white border border-border hover:border-primary/30 hover:shadow-card-hover transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{f.label}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-3">תמחור שקוף וסביר</h2>
            <p className="text-muted-foreground">בחר את החבילה שמתאימה לך ותתחיל היום</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((pkg, i) => (
              <div key={i} className={`relative rounded-2xl border-2 p-6 transition-all flex flex-col ${
                pkg.popular 
                  ? "border-primary bg-gradient-to-br from-primary/5 to-purple-500/5 shadow-lg" 
                  : "border-border bg-white hover:border-primary/30"
              }`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-500 text-white px-4 py-1 rounded-full text-[11px] font-bold">
                    המובחר ⭐
                  </div>
                )}

                <h3 className="text-xl font-bold text-foreground mb-1">{pkg.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">{pkg.price}</span>
                  <span className="text-muted-foreground text-sm">{pkg.period}</span>
                </div>

                <div className="space-y-2 mb-6 pb-6 border-b border-border/50 flex-1">
                  <p className="text-sm font-semibold text-foreground">{pkg.leads}</p>
                  <p className="text-sm text-muted-foreground">{pkg.messages}</p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {pkg.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button className={`w-full ${!pkg.popular && "bg-secondary text-foreground hover:bg-secondary/80"}`}>
                  {pkg.cta}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            * כל החבילות כוללות בדיקה חינמית של 14 ימים. אין צורך בכרטיס אשראי.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-3">שאלות נפוצות</h2>
            <p className="text-muted-foreground">הכל שאתה צריך לדעת על BrokerPro</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-white overflow-hidden hover:border-primary/30 transition-colors">
                <button onClick={() => setActiveFaq(activeFaq === i ? -1 : i)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <h3 className="font-semibold text-foreground text-left">{faq.q}</h3>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${activeFaq === i ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-4 pt-0 text-muted-foreground text-sm leading-relaxed border-t border-border/30">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            מוכנים להכפיל את המכירות שלכם?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            התחילו עכשיו — לא צריך כרטיס אשראי, ולא צריך פרטי בנק.
          </p>
          <Button size="lg" className="gap-2 px-8">
            התחל בחינם <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/50 px-4 py-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 BrokerPro. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}