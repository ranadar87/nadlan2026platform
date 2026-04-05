import { useState } from "react";
import { Smartphone, Shield, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const [waConnected, setWaConnected] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-lg font-bold text-foreground">הגדרות</h2>

      {/* WhatsApp Connection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">חיבור WhatsApp</h3>
            <p className="text-xs text-muted-foreground">חבר את מספר הווטסאפ שלך לשליחת הודעות</p>
          </div>
        </div>
        {waConnected ? (
          <div className="flex items-center justify-between p-3 bg-success/5 border border-success/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm text-success font-medium">מחובר</span>
            </div>
            <Button variant="outline" size="sm" className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => setWaConnected(false)}>
              נתק
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">לחץ על "חבר WhatsApp" כדי להציג את ה-QR Code לסריקה</p>
            <Button className="gap-2" onClick={() => setWaConnected(true)}>
              <Smartphone className="w-4 h-4" />
              חבר WhatsApp
            </Button>
          </div>
        )}
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">פרופיל</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">שם מלא</Label>
            <Input className="bg-secondary border-border mt-1" placeholder="שמך המלא" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">שם העסק</Label>
            <Input className="bg-secondary border-border mt-1" placeholder="שם העסק" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">טלפון</Label>
            <Input className="bg-secondary border-border mt-1" dir="ltr" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">אימייל</Label>
            <Input className="bg-secondary border-border mt-1" dir="ltr" type="email" />
          </div>
        </div>
        <Button className="mt-4" size="sm">שמור שינויים</Button>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-info" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">אבטחה</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          כל הנתונים מוצפנים. Session הווטסאפ שמור עם הצפנת AES-256.
        </p>
      </div>
    </div>
  );
}