"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

type Habit = { id: number; name: string; done: boolean; date: string };

export default function Home() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<"today" | "week" | "month">("today");
  const [groupMode, setGroupMode] = useState<"date" | "habit">("date");

  const today = new Date().toISOString().split("T")[0];
  const todayJP = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.push("/login"); return; }
      setUserId(data.session.user.id);
    });
  }, []);

  useEffect(() => {
    if (userId) fetchHabits();
  }, [userId, view]);

  const fetchHabits = async () => {
    let query = supabase.from("habits").select("*").eq("user_id", userId);
    if (view === "today") query = query.eq("date", today);
    else if (view === "week") {
      const week = new Date(); week.setDate(week.getDate() - 6);
      query = query.gte("date", week.toISOString().split("T")[0]);
    } else {
      const month = new Date(); month.setDate(1);
      query = query.gte("date", month.toISOString().split("T")[0]);
    }
    const { data } = await query.order("date", { ascending: false }).order("id");
    if (data) setHabits(data);
  };

  const addHabit = async () => {
    if (newHabit.trim() === "" || !userId) return;
    await supabase.from("habits").insert({ name: newHabit.trim(), done: false, user_id: userId, date: today });
    setNewHabit("");
    fetchHabits();
  };

  const toggleHabit = async (habit: Habit) => {
    await supabase.from("habits").update({ done: !habit.done }).eq("id", habit.id);
    fetchHabits();
  };

  const deleteHabit = async (id: number) => {
    await supabase.from("habits").delete().eq("id", id);
    fetchHabits();
  };

  const startEdit = (habit: Habit) => { setEditingId(habit.id); setEditingName(habit.name); };
  const saveEdit = async () => {
    if (editingId === null) return;
    await supabase.from("habits").update({ name: editingName }).eq("id", editingId);
    setEditingId(null);
    fetchHabits();
  };

  const logout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const todayHabits = habits.filter(h => h.date === today);
  const doneCount = todayHabits.filter(h => h.done).length;
  const rate = todayHabits.length > 0 ? Math.round((doneCount / todayHabits.length) * 100) : 0;

  // 日付別グループ
  const groupByDate = (habits: Habit[]) => {
    const map: { [date: string]: Habit[] } = {};
    habits.forEach(h => { if (!map[h.date]) map[h.date] = []; map[h.date].push(h); });
    return map;
  };

  // 習慣別グループ
  const groupByHabit = (habits: Habit[]) => {
    const map: { [name: string]: Habit[] } = {};
    habits.forEach(h => { if (!map[h.name]) map[h.name] = []; map[h.name].push(h); });
    return map;
  };

  // 期間内の日付一覧を生成
  const getDates = () => {
    const dates: string[] = [];
    const days = view === "week" ? 7 : new Date().getDate();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🌱 習慣トラッカー</h1>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">ログアウト</button>
      </div>

      <p className="text-gray-400 text-sm mb-4">{todayJP}</p>

      {/* ビュー切替 */}
      <div className="flex gap-2 mb-4">
        {(["today", "week", "month"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1 rounded-full text-sm ${view === v ? "bg-green-500 text-white" : "bg-white text-gray-500 border"}`}>
            {v === "today" ? "今日" : v === "week" ? "週間" : "月間"}
          </button>
        ))}
      </div>

      {/* 週間・月間のグループ切替 */}
      {(view === "week" || view === "month") && (
        <div className="flex gap-2 mb-6">
          <button onClick={() => setGroupMode("date")}
            className={`px-4 py-1 rounded-full text-sm ${groupMode === "date" ? "bg-blue-500 text-white" : "bg-white text-gray-500 border"}`}>
            📅 日付別
          </button>
          <button onClick={() => setGroupMode("habit")}
            className={`px-4 py-1 rounded-full text-sm ${groupMode === "habit" ? "bg-blue-500 text-white" : "bg-white text-gray-500 border"}`}>
            📋 習慣別
          </button>
        </div>
      )}

      {/* 今日ビュー */}
      {view === "today" && (
        <>
          <p className="text-gray-500 mb-2">今日の進捗: {doneCount} / {todayHabits.length}</p>
          <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-2">
            <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: `${rate}%` }} />
          </div>
          <p className="text-green-600 font-bold mb-6 text-xl">{rate}% 達成！</p>
          <div className="w-full max-w-md space-y-3 mb-8">
            {todayHabits.map(habit => (
              <div key={habit.id} className="flex items-center gap-2 bg-white p-4 rounded-xl shadow-sm">
                <span onClick={() => toggleHabit(habit)} className="cursor-pointer text-2xl">{habit.done ? "✅" : "⬜"}</span>
                {editingId === habit.id ? (
                  <><input value={editingName} onChange={e => setEditingName(e.target.value)} className="flex-1 border rounded px-2 py-1" />
                  <button onClick={saveEdit} className="text-blue-500 text-sm">保存</button></>
                ) : (
                  <><span className={`flex-1 text-lg ${habit.done ? "line-through text-gray-400" : ""}`}>{habit.name}</span>
                  <button onClick={() => startEdit(habit)} className="text-gray-400 text-sm">✏️</button>
                  <button onClick={() => deleteHabit(habit.id)} className="text-red-400 text-sm">🗑️</button></>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 w-full max-w-md">
            <input type="text" value={newHabit} onChange={e => setNewHabit(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addHabit()} placeholder="習慣を追加..."
              className="flex-1 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-300" />
            <button onClick={addHabit} className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600">追加</button>
          </div>
        </>
      )}

      {/* 週間・月間 日付別 */}
      {(view === "week" || view === "month") && groupMode === "date" && (
        <div className="w-full max-w-md space-y-6">
          {Object.entries(groupByDate(habits)).map(([date, dayHabits]) => {
            const done = dayHabits.filter(h => h.done).length;
            const r = dayHabits.length > 0 ? Math.round((done / dayHabits.length) * 100) : 0;
            return (
              <div key={date} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-700">{new Date(date).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}</span>
                  <span className="text-green-600 font-bold">{r}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${r}%` }} />
                </div>
                {dayHabits.map(h => (
                  <div key={h.id} className="flex items-center gap-2 py-1">
                    <span>{h.done ? "✅" : "⬜"}</span>
                    <span className={h.done ? "line-through text-gray-400" : ""}>{h.name}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* 週間・月間 習慣別 */}
      {(view === "week" || view === "month") && groupMode === "habit" && (
        <div className="w-full max-w-md space-y-4">
          {Object.entries(groupByHabit(habits)).map(([name, habitList]) => {
            const dates = getDates();
            const done = habitList.filter(h => h.done).length;
            const r = habitList.length > 0 ? Math.round((done / habitList.length) * 100) : 0;
            return (
              <div key={name} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-700">{name}</span>
                  <span className="text-green-600 font-bold">{r}% ({done}/{habitList.length}日)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${r}%` }} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {dates.map(date => {
                    const h = habitList.find(x => x.date === date);
                    return (
                      <div key={date} className="flex flex-col items-center">
                        <span className="text-xs text-gray-400">{new Date(date).getDate()}</span>
                        <span className="text-lg">{h ? (h.done ? "✅" : "⬜") : "➖"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}