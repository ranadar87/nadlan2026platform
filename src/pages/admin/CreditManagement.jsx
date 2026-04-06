import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, Save, X, ZapOff, Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CreditManagement() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newPackage, setNewPackage] = useState(null);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      if (me?.role !== "admin") {
        return;
      }

      const pkgs = await base44.entities.CreditPackage.list("-created_date", 100);
      setPackages(pkgs);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreatePackage = async () => {
    if (!newPackage?.name || !newPackage?.type || newPackage?.credits_total === undefined) {
      toast({ title: "אנא מלא את כל הפרטים", variant: "destructive" });
      return;
    }
    
    try {
      await base44.entities.CreditPackage.create(newPackage);
      toast({ title: "חבילה נוצרה בהצלחה" });
      setNewPackage(null);
      const pkgs = await base44.entities.CreditPackage.list("-created_date", 100);
      setPackages(pkgs);
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdatePackage = async () => {
    try {
      await base44.entities.CreditPackage.update(editingId, editData);
      toast({ title: "חבילה עודכנה בהצלחה" });
      setEditingId(null);
      const pkgs = await base44.entities.CreditPackage.list("-created_date", 100);
      setPackages(pkgs);
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  const handleDeletePackage = async (pkgId) => {
    if (!window.confirm("האם בטוח?")) return;
    try {
      await base44.entities.CreditPackage.delete(pkgId);
      toast({ title: "חבילה נמחקה" });
      const pkgs = await base44.entities.CreditPackage.list("-created_date", 100);
      setPackages(pkgs);
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-12 text-destructive">אין הרשאה מנהל</div>;
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ניהול קרדיטים</h1>
        <p className="text-xs text-muted-foreground mt-1">יצירה וניהול חבילות קרדיטים</p>
      </div>

      {/* Create New Package */}
      {newPackage ? (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-foreground">חבילה חדשה</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              placeholder="שם"
              value={newPackage.name || ""}
              onChange={e => setNewPackage({...newPackage, name: e.target.value})}
              className="bg-white"
            />
            <select
              value={newPackage.type || ""}
              onChange={e => setNewPackage({...newPackage, type: e.target.value})}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
            >
              <option value="">בחר סוג</option>
              <option value="scraping">שאיבה</option>
              <option value="sms">SMS</option>
            </select>
            <Input
              type="number"
              placeholder="קרדיטים"
              value={newPackage.credits_total || ""}
              onChange={e => setNewPackage({...newPackage, credits_total: parseInt(e.target.value)})}
              className="bg-white"
            />
            <Input
              type="number"
              placeholder="מחיר"
              value={newPackage.price || ""}
              onChange={e => setNewPackage({...newPackage, price: parseFloat(e.target.value)})}
              className="bg-white"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreatePackage} size="sm" className="gap-2">
              <Save className="w-4 h-4" /> צור
            </Button>
            <Button onClick={() => setNewPackage(null)} size="sm" variant="outline" className="gap-2">
              <X className="w-4 h-4" /> ביטול
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setNewPackage({})} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> חבילה חדשה
        </Button>
      )}

      {/* Packages Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <h3 className="text-sm font-bold text-foreground">חבילות קרדיטים ({packages.length})</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">טוען...</div>
        ) : (
          <div className="divide-y divide-border">
            {packages.map(pkg => (
              <div key={pkg.id} className="p-6 hover:bg-secondary/20 transition-colors">
                {editingId === pkg.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Input
                        placeholder="שם"
                        value={editData.name || ""}
                        onChange={e => setEditData({...editData, name: e.target.value})}
                        className="bg-secondary"
                      />
                      <Input
                        type="number"
                        placeholder="קרדיטים"
                        value={editData.credits_total || ""}
                        onChange={e => setEditData({...editData, credits_total: parseInt(e.target.value)})}
                        className="bg-secondary"
                      />
                      <Input
                        type="number"
                        placeholder="מחיר"
                        value={editData.price || ""}
                        onChange={e => setEditData({...editData, price: parseFloat(e.target.value)})}
                        className="bg-secondary"
                      />
                      <select
                        value={editData.is_active ? "1" : "0"}
                        onChange={e => setEditData({...editData, is_active: e.target.value === "1"})}
                        className="px-3 py-2 rounded-lg border border-border bg-secondary text-sm"
                      >
                        <option value="1">פעיל</option>
                        <option value="0">כבוי</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdatePackage} size="sm" className="gap-2">
                        <Save className="w-4 h-4" /> שמור
                      </Button>
                      <Button onClick={() => setEditingId(null)} size="sm" variant="outline" className="gap-2">
                        <X className="w-4 h-4" /> ביטול
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{pkg.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {pkg.credits_total?.toLocaleString()} קרדיטים • {pkg.price}₪ • {pkg.type === "scraping" ? "שאיבה" : "SMS"}
                        • {pkg.is_active ? "✓ פעיל" : "✗ כבוי"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => { setEditingId(pkg.id); setEditData(pkg); }}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeletePackage(pkg.id)}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}