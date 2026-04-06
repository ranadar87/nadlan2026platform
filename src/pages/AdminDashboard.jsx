import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, TrendingUp, BarChart3, Settings, ArrowLeft, Zap, Lock, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      // בדוק אם admin
      if (me?.role !== "admin") {
        navigate("/");
        return;
      }

      try {
        const allUsers = await base44.entities.User.list("-created_date", 100);
        setUsers(allUsers);
        
        const campaigns = await base44.entities.Campaign.list();
        const leads = await base44.entities.Lead.list();
        const credits = await base44.entities.CreditPackage.list();
        
        setStats({
          totalUsers: allUsers.length,
          totalCampaigns: campaigns.length,
          totalLeads: leads.length,
          totalCreditsIssued: credits.reduce((s, c) => s + (c.credits_total || 0), 0),
          activeCampaigns: campaigns.filter(c => c.status === "running").length,
        });
      } catch (e) {
        console.error("Load error:", e);
      }
      
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div></div>;
  }

  if (user?.role !== "admin") {
    return null;
  }

  const adminSections = [
    { path: "/admin", label: "סטטיסטיקות", icon: BarChart3, description: "סקירה כללית והסטטיסטיקות" },
    { path: "/admin/users", label: "ניהול משתמשים", icon: Users, description: "הזמנה וניהול תפקידים" },
    { path: "/admin/credits", label: "ניהול קרדיטים", icon: Zap, description: "חבילות קרדיטים" },
    { path: "/admin/payment-plans", label: "חבילות תשלום", icon: Lock, description: "ניהול חבילות וPayMe" },
    { path: "/admin/settings", label: "הגדרות אתר", icon: Cog, description: "Header, Footer, CSS ועוד" },
    { path: "/admin/automations", label: "אוטומציות", icon: Settings, description: "ניהול אוטומציות שמורות" },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground">🎛️ לוח בקרה מנהלים</h1>
          <p className="text-sm text-muted-foreground mt-2">ניהול מלא של המערכת, משתמשים, תשלומים והגדרות</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> חזור
        </Button>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminSections.map((section, i) => {
          const Icon = section.icon;
          const isActive = window.location.pathname === section.path;
          return (
            <Link key={i} to={section.path}>
              <div className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                isActive 
                  ? "bg-primary/10 border-primary shadow-lg" 
                  : "bg-white border-border hover:border-primary/30 hover:shadow-md"
              }`}>
                <div className="flex items-start gap-3 mb-3">
                  <Icon className={`w-6 h-6 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`} />
                  {isActive && <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">פעיל</span>}
                </div>
                <h3 className="font-bold text-foreground mb-1">{section.label}</h3>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: Users, label: "משתמשים", value: stats.totalUsers, color: "primary" },
            { icon: TrendingUp, label: "קמפיינים", value: stats.totalCampaigns, color: "success" },
            { icon: BarChart3, label: "קמפיינים פעילים", value: stats.activeCampaigns, color: "info" },
            { icon: Users, label: "לידים", value: stats.totalLeads, color: "warning" },
            { icon: Settings, label: "קרדיטים", value: (stats.totalCreditsIssued / 1000).toFixed(0) + "K", color: "accent" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 text-${item.color}`} />
                  <div className="flex-1">
                    <p className="text-[11px] text-muted-foreground font-semibold">{item.label}</p>
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Users */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">משתמשים אחרונים ({users.length})</h3>
          <Link to="/admin/users"><Button size="sm" variant="outline" className="h-7 text-xs">ניהול מלא →</Button></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground text-xs font-semibold">
              <tr>
                <th className="text-right px-6 py-3">שם</th>
                <th className="text-right px-6 py-3">דוא״ל</th>
                <th className="text-right px-6 py-3">תפקיד</th>
                <th className="text-right px-6 py-3">הרשמה</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-muted-foreground text-xs">אין משתמשים</td></tr>
              ) : (
                users.slice(0, 5).map(u => (
                  <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="text-right px-6 py-3 text-foreground font-medium">{u.full_name || "—"}</td>
                    <td className="text-right px-6 py-3 text-foreground font-mono text-[11px]">{u.email}</td>
                    <td className="text-right px-6 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                        u.role === "admin" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                      }`}>
                        {u.role === "admin" ? "מנהל" : "משתמש"}
                      </span>
                    </td>
                    <td className="text-right px-6 py-3 text-muted-foreground text-[11px]">{new Date(u.created_date).toLocaleDateString("he-IL")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {users.length > 5 && (
          <div className="px-6 py-3 border-t border-border text-center">
            <Link to="/admin/users"><Button size="sm" variant="ghost" className="text-xs">צפה בכל המשתמשים →</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}