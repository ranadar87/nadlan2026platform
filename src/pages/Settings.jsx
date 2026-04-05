import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Smartphone, CheckCircle, XCircle, RefreshCw, Shield, User, Loader2 } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: "", business_name: "", phone: "", email: "" });

  const [waStatus, setWaStatus] = useState(null); // null | "loading" | "connected" | "pending_qr" | "disconnected"
  const [qrCode, setQrCode] = useState(null);
  const [waLoading, setWaLoading] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setProfile({
        full_name: u.full_name || "",
        business_name: u.business_name || "",
        phone: u.phone || "",
        email: u.email || "",
      });
    });
    checkWAStatus();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const checkWAStatus = async () => {
    setWaLoading(true);
    const res = await base44.functions.invoke("getWAStatus", {});
    const data = res.data;
    setWaLoading(false);
    if (data.connected) {
      setWaStatus("connected");
      setQrCode(null);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    } else if (data.qr) {
      setWaStatus("pending_qr");
      setQrCode(data.qr);
      startPolling();
    } else {
      setWaStatus("disconnected");
    }
  };

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      const res = await base44.functions.invoke("getWAStatus", {});
      if (res.data.connected) {
        setWaStatus("connected");
        setQrCode(null);
        clearInterval(pollRef.current);
        pollRef.current = null;
        toast({ title: "✅ WhatsApp חובר בהצלחה!" });
      } else if (res.data.qr) {
        setQrCode(res.data.qr);
      }
    }, 3000);
  };

  const handleConnect = async () => {
    setWaLoading(true);
    const res = await base44.functions.invoke("getWAStatus", {});
    const data = res.data;
    setWaLoading(false);
    if (data.connected) {
      setWaStatus("connected");
    } else if (data.qr) {
      setWaStatus("pending_qr");
      setQrCode(data.qr);
      startPolling();
    }
  };

  const saveProfile = async () => {
    await base44.auth.updateMe({ business_name: profile.business_name, phone: profile.phone });
    toast({ title: "הפרופיל עודכן בהצלחה" });
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">הגדרות</h1>
        <p className="text-sm text-muted-foreground mt-1">ניהול חשבון ואינטגרציות</p>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-success/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">חיבור WhatsApp</h2>
            <p className="text-xs text-muted-foreground">חבר את מספר הוואטסאפ שלך לשליחת קמפיינים</p>
          </div>
          <div className="mr-auto">
            {waStatus === "connected" && (
              <div className="flex items-center gap-2 bg-success/10 text-success text-xs font-bold px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
                מחובר
              </div>
            )}
            {waStatus === "pending_qr" && (
              <div className="flex items-center gap-2 bg-warning/10 text-warning text-xs font-bold px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse-soft" />
                ממתין לסריקה
              </div>
            )}
            {(waStatus === "disconnected" || waStatus === null) && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-xs font-bold px-3 py-1.5 rounded-full">
                <XCircle className="w-3.5 h-3.5" />
                לא מחובר
              </div>
            )}
          </div>
        </div>

        {waStatus === "connected" ? (
          <div className="flex items-center gap-3 p-4 bg-success/5 rounded-xl border border-success/15">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm font-semibold text-foreground">WhatsApp מחובר ופעיל</p>
              <p className="text-xs text-muted-foreground">הקמפיינים שלך יישלחו דרך המספר המחובר</p>
            </div>
            <Button variant="outline" size="sm" className="mr-auto text-xs" onClick={checkWAStatus}>
              <RefreshCw className="w-3.5 h-3.5 ml-1" />
              רענן
            </Button>
          </div>
        ) : waStatus === "pending_qr" && qrCode ? (
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-xl p-5 text-center">
              <p className="text-sm font-semibold text-foreground mb-4">סרוק את ה-QR Code עם WhatsApp שלך</p>
              <div className="inline-block p-3 bg-white rounded-2xl shadow-card border border-border">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-52 h-52 object-contain"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                פתח WhatsApp ← הגדרות ← מכשירים מקושרים ← הוסף מכשיר
              </p>
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ממתין לסריקה...
              </div>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={waLoading}
            className="w-full bg-gradient-to-l from-success to-emerald-400 hover:opacity-90 rounded-xl h-11 font-semibold"
          >
            {waLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Smartphone className="w-4 h-4 ml-2" />}
            {waLoading ? "מתחבר..." : "חבר WhatsApp"}
          </Button>
        )}
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">פרטי פרופיל</h2>
            <p className="text-xs text-muted-foreground">פרטי החשבון שלך</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">שם מלא</Label>
            <Input value={profile.full_name} disabled className="mt-1 bg-secondary border-border text-muted-foreground" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">אימייל</Label>
            <Input value={profile.email} disabled className="mt-1 bg-secondary border-border text-muted-foreground" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">שם עסק</Label>
            <Input value={profile.business_name} onChange={e => setProfile(p => ({ ...p, business_name: e.target.value }))} className="mt-1 bg-secondary border-border" placeholder="שם המשרד / עסק" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">טלפון</Label>
            <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="mt-1 bg-secondary border-border" dir="ltr" />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={saveProfile} className="bg-gradient-to-l from-primary to-purple-500 hover:opacity-90 rounded-xl">שמור שינויים</Button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-border shadow-card p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-info/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-info" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">אבטחה</h2>
            <p className="text-xs text-muted-foreground">כל הנתונים מוצפנים ומאובטחים</p>
          </div>
          <div className="mr-auto flex items-center gap-2 bg-success/8 text-success text-xs font-semibold px-3 py-1.5 rounded-full border border-success/15">
            <CheckCircle className="w-3.5 h-3.5" /> SSL מאובטח
          </div>
        </div>
      </div>
    </div>
  );
}