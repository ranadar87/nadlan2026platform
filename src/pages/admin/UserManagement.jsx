import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Mail, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function UserManagement() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      if (me?.role !== "admin") {
        return;
      }

      const allUsers = await base44.entities.User.list("-created_date", 100);
      setUsers(allUsers);
      setLoading(false);
    };
    load();
  }, []);

  const handleUpdateRole = async (userId) => {
    try {
      await base44.entities.User.update(userId, { role: editRole });
      toast({ title: "תפקיד עודכן בהצלחה" });
      setEditingId(null);
      const allUsers = await base44.entities.User.list("-created_date", 100);
      setUsers(allUsers);
    } catch (e) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "אנא הזן דוא״ל", variant: "destructive" });
      return;
    }
    if (!inviteEmail.includes("@")) {
      toast({ title: "דוא״ל לא תקין", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      toast({ title: "✅ הזמנה נשלחה", description: `הזמנה נשלחה ל-${inviteEmail}` });
      setInviteEmail("");
      setInviteRole("user");
      // Reload users list
      const allUsers = await base44.entities.User.list("-created_date", 100);
      setUsers(allUsers);
    } catch (e) {
      toast({ title: "❌ שגיאה בשליחת הזמנה", description: e.message, variant: "destructive" });
    }
    setInviting(false);
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-12 text-destructive">אין הרשאה מנהל</div>;
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ניהול משתמשים</h1>
        <p className="text-xs text-muted-foreground mt-1">הזמנה, עריכת תפקידים ו־ניהול משתמשים</p>
      </div>

      {/* Invite Form */}
      <div className="bg-white border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">הזמן משתמש חדש</h2>
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="דוא״ל של המשתמש החדש"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 bg-secondary"
          />
          <select 
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-secondary text-sm"
          >
            <option value="user">משתמש</option>
            <option value="admin">אדמין</option>
          </select>
          <Button onClick={handleInvite} disabled={inviting} className="gap-2">
            <Mail className="w-4 h-4" />
            {inviting ? "שולח..." : "הזמן"}
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <h3 className="text-sm font-bold text-foreground">משתמשים ({users.length})</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">טוען...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-muted-foreground text-xs font-semibold">
                <tr>
                  <th className="text-right px-6 py-3">שם</th>
                  <th className="text-right px-6 py-3">דוא״ל</th>
                  <th className="text-right px-6 py-3">תפקיד</th>
                  <th className="text-right px-6 py-3">הרשמה</th>
                  <th className="text-right px-6 py-3">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="text-right px-6 py-3 text-foreground font-medium">{u.full_name || "—"}</td>
                    <td className="text-right px-6 py-3 text-foreground font-mono text-[11px]">{u.email}</td>
                    <td className="text-right px-6 py-3">
                      {editingId === u.id ? (
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
                          className="px-2 py-1 rounded text-xs border border-border bg-white"
                        >
                          <option value="user">משתמש</option>
                          <option value="admin">אדמין</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                          u.role === "admin" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                        }`}>
                          {u.role === "admin" ? "אדמין" : "משתמש"}
                        </span>
                      )}
                    </td>
                    <td className="text-right px-6 py-3 text-muted-foreground text-[11px]">
                      {new Date(u.created_date).toLocaleDateString("he-IL")}
                    </td>
                    <td className="text-right px-6 py-3 flex gap-2 justify-end">
                      {editingId === u.id ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleUpdateRole(u.id)}>
                            <Check className="w-3 h-3 text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                            <X className="w-3 h-3 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => { setEditingId(u.id); setEditRole(u.role); }}
                        >
                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}