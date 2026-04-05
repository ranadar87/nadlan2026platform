import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Home, Megaphone, Send, Eye } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import QuickActions from "../components/dashboard/QuickActions";
import ActiveCampaignCard from "../components/dashboard/ActiveCampaignCard";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalLeads: 0, activeCampaigns: 0, sentToday: 0, openRate: 0, newThisWeek: 0 });
  const [loading, setLoading] = useState(true);

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
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl animate-fade-in" style={{ fontFamily: "'Assistant', sans-serif" }}>
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentActivity />
        <div className="flex flex-col gap-0">
          <QuickActions />
          <ActiveCampaignCard />
        </div>
      </div>
    </div>
  );
}