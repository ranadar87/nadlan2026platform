import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Plus, Trash2, Flag } from "lucide-react";
import moment from "moment";
import "moment/locale/he";
moment.locale("he");

const PRIORITY = {
  high: { label: "גבוהה", color: "text-destructive" },
  medium: { label: "בינונית", color: "text-warning" },
  low: { label: "נמוכה", color: "text-muted-foreground" },
};

export default function LeadTasksTab({ leadId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Task.filter({ lead_id: leadId }, "due_date", 100)
      .then(setTasks).catch(() => setTasks([]).finally(() => setLoading(false)));
    setLoading(false);
  };

  useEffect(() => { if (leadId) load(); }, [leadId]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await base44.entities.Task.create({ lead_id: leadId, title: newTitle, due_date: newDue || null, priority: newPriority, is_done: false });
    setNewTitle(""); setNewDue(""); setNewPriority("medium"); setShowForm(false);
    load();
    setAdding(false);
  };

  const toggleDone = async (task) => {
    await base44.entities.Task.update(task.id, { is_done: !task.is_done });
    load();
  };

  const handleDelete = async (task) => {
    await base44.entities.Task.delete(task.id);
    load();
  };

  const pending = tasks.filter(t => !t.is_done);
  const done = tasks.filter(t => t.is_done);

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!showForm ? (
        <Button size="sm" variant="outline" className="gap-2 w-full" onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" />הוסף משימה
        </Button>
      ) : (
        <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border">
          <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="כותרת המשימה..." autoFocus className="bg-white" />
          <div className="flex gap-2">
            <Input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className="bg-white flex-1" dir="ltr" />
            <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-foreground flex-1">
              <option value="high">עדיפות גבוהה</option>
              <option value="medium">עדיפות בינונית</option>
              <option value="low">עדיפות נמוכה</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={adding || !newTitle.trim()} className="flex-1">שמור</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1">ביטול</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-secondary/40 rounded-xl animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="py-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">אין משימות עדיין</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.length > 0 && <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">פעילות ({pending.length})</p>}
          {pending.map(task => <TaskRow key={task.id} task={task} onToggle={toggleDone} onDelete={handleDelete} />)}
          {done.length > 0 && <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-4">הושלמו ({done.length})</p>}
          {done.map(task => <TaskRow key={task.id} task={task} onToggle={toggleDone} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onToggle, onDelete }) {
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const isOverdue = !task.is_done && task.due_date && moment(task.due_date).isBefore(moment(), "day");
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${task.is_done ? "bg-secondary/20 border-border/30 opacity-60" : "bg-white border-border hover:border-primary/20"}`}>
      <button onClick={() => onToggle(task)} className="flex-shrink-0">
        {task.is_done
          ? <CheckCircle2 className="w-5 h-5 text-success" />
          : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.is_done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
        {task.due_date && (
          <p className={`text-[11px] mt-0.5 ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
            {isOverdue ? "⚠️ " : ""}{moment(task.due_date).format("DD/MM/YYYY")}
          </p>
        )}
      </div>
      <Flag className={`w-3.5 h-3.5 flex-shrink-0 ${p.color}`} />
      <button onClick={() => onDelete(task)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-all">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}