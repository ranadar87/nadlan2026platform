import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import LiveTutorial from "../components/LiveTutorial";
import { Home, Megaphone, Send, Eye, AlertTriangle } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActions from "../components/dashboard/QuickActions";
import LiquidProgress from "../components/ui/liquid-progress";
import SubscriptionStatus from "../components/SubscriptionStatus";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalLeads: 0, activeCampaigns: 0, sentToday: 0, openRate: 0, newThisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("tutorial_done");
    if (!seen) setShowTutorial(true);
  }, []);

  const handleTutorialDone = () => {
    localStorage.setItem("tutorial_done", "1");
    setShowTutorial(false);
  };

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list("-created_date", 500),
      base44.entities.Campaign.list("-created_date", 100),
      base44.entities.CampaignMessage.list("-created_date", 500),
    ]).then(([leads, campaigns, messages]) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const today = new Date().toDateString();
      const totalSent = messages.filter(m => m.status !== "pending" && m.status !== "failed").length;
      const totalOpened = messages.filter(m => m.status === "opened" || m.status === "replied").length;
      setStats({
        totalLeads: leads.length,
        activeCampaigns: campaigns.filter(c => c.status === "running").length,
        sentToday: messages.filter(m => m.sent_at && new Date(m.sent_at).toDateString() === today).length,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        newThisWeek: leads.filter(l => new Date(l.created_date) >= weekAgo).length,
      });
      setLoading(false);
    }).catch(e => {
      console.error("Dashboard load error:", e);
      setLoading(false);
    });
  }, []);

  return (
    <>
    {showTutorial && <LiveTutorial onDone={handleTutorialDone} />}
    <div className="space-y-6 max-w-7xl animate-fade-in" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <SubscriptionStatus />
      {/* Empty state - no leads */}
      {!loading && stats.totalLeads === 0 && (
        <div className="bg-info/5 border border-info/20 rounded-2xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">🎯 בואו נתחיל!</p>
            <p className="text-xs text-muted-foreground mt-1">אתה עדיין ללא לידים. בואו נשאב לידים מיד2 או מדלן כדי להתחיל.</p>
          </div>
        </div>
      )}
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Home className="w-6 h-6" />}
          label='סה"כ לידים'
          value={loading ? "—" : stats.totalLeads.toLocaleString()}
          delta={`+${stats.newThisWeek} השבוע`}
          deltaType="up"
          color="purple"
        />
        <StatCard
          icon={<Megaphone className="w-6 h-6" />}
          label="קמפיינים פעילים"
          value={loading ? "—" : stats.activeCampaigns}
          delta={stats.activeCampaigns > 0 ? `${stats.activeCampaigns} פעיל כעת` : "אין פעילים"}
          deltaType={stats.activeCampaigns > 0 ? "up" : "neutral"}
          color="green"
        />
        <StatCard
          icon={<Send className="w-6 h-6" />}
          label="הודעות נשלחו היום"
          value={loading ? "—" : stats.sentToday}
          delta="מתוך 80 מתוכנן"
          deltaType="neutral"
          color="blue"
        />
        <StatCard
          icon={<Eye className="w-6 h-6" />}
          label="אחוז פתיחה"
          value={loading ? "—" : `${stats.openRate}%`}
          delta="+5% מחודש שעבר"
          deltaType="up"
          color="orange"
        />
      </div>

      {/* Campaign Progress Highlight */}
      {stats.activeCampaigns > 0 ? (
        <div className="bg-white rounded-2xl border border-primary/10 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">קמפיינים פעילים</h3>
            <span className="text-sm font-bold text-primary">{Math.round(stats.sentToday / 80 * 100)}% מהמגבלה היומית</span>
          </div>
          <LiquidProgress value={Math.round(stats.sentToday / 80 * 100)} />
          <p className="text-xs text-muted-foreground mt-2">{stats.sentToday} מ-80 הודעות נשלחו היום</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl border border-primary/10 p-6">
          <h3 className="text-base font-bold text-foreground mb-2">🚀 בואו נתחיל קמפיין</h3>
          <p className="text-sm text-muted-foreground mb-4">אין קמפיינים פעילים כרגע. צור קמפיין חדש כדי להתחיל לשדר הודעות ללידים שלך.</p>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentActivity />
        <div className="flex flex-col gap-0">
          <QuickActions />
        </div>
      </div>
    </div>
    </>
  );
}