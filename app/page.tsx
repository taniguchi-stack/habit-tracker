"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

type Habit = {
  id: number; name: string; done: boolean; date: string;
  memo?: string; target_minutes?: number; category?: string;
};

const CATEGORIES = ["未分類", "健康", "スキルアップ", "仕事", "プライベート"];

export default function Home() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [newCategory, setNewCategory] = useState("未分類");
  const [newTargetMinutes, setNewTargetMinutes] = useState("");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<"today" | "week" | "month">("today");
  const [groupMode, setGroupMode] = useState<"date" | "habit">("date");
  const [filterCategory, setFilterCategory] = useState("すべて");
  const [showAddForm, setShowAddForm] = useState(false);
  const [advice, setAdvice] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);

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
    await supabase.from("habits").insert({
      name: newHabit.trim(), done: false, user_id: userId, date: today,
      category: newCategory,
      target_minutes: newTargetMinutes ? parseInt(newTargetMinutes) : null,
    });
    setNewHabit(""); setNewCategory("未分類"); setNewTargetMinutes("");
    setShowAddForm(false);
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

  const saveEdit = async () => {
    if (!editingHabit) return;
    await supabase.from("habits").update({
      name: editingHabit.name,
      memo: editingHabit.memo,
      target_minutes: editingHabit.target_minutes,
      category: editingHabit.category,
    }).eq("id", editingHabit.id);
    setEditingHabit(null);
    fetchHabits();
  };

  const logout = async () => { await supabase.auth.signOut(); router.push("/login"); };

  const getGeminiAdvice = async () => {
    setLoadingAdvice(true);
    setShowAdvice(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habits }),
      });
      const data = await res.json();
      setAdvice(data.advice);
    } catch {
      setAdvice("アドバイスの取得に失敗しました。");
    }
    setLoadingAdvice(false);
  };

  const calcStreak = (habitName: string) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = d.toISOString().split("T")[0];
      const found = habits.find(h => h.name === habitName && h.date === dateStr && h.done);
      if (!found) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const todayHabits = habits.filter(h => h.date === today &&
    (filterCategory === "すべて" || h.category === filterCategory));
  const doneCount = todayHabits.filter(h => h.done).length;
  const rate = todayHabits.length > 0 ? Math.round((doneCount / todayHabits.length) * 100) : 0;

  const groupByDate = (habits: Habit[]) => {
    const map: { [date: string]: Habit[] } = {};
    habits.forEach(h => { if (!map[h.date]) map[h.date] = []; map[h.date].push(h); });
    return map;
  };

  const groupByHabit = (habits: Habit[]) => {
    const map: { [name: string]: Habit[] } = {};
    habits.forEach(h => { if (!map[h.name]) map[h.name] = []; map[h.name].push(h); });
    return map;
  };

  const getDates = () => {
    const dates: string[] = [];
    const days = view === "week" ? 7 : new Date().getDate();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  };

  const categoryColors: { [key: string]: string } = {
    "未分類": "bg-gray-100 text-gray-600",
    "健康": "bg-green-100 text-green-600",
    "スキルアップ": "bg-blue-100 text-blue-600",
    "仕事": "bg-orange-100 text-orange-600",
    "プライベート": "bg-purple-100 text-purple-600",
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <div className="sticky top-0 bg-white shadow-sm z-10 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold">🌱 習慣トラッカー</h1>
        <button onClick={logout} className="text-sm text-gray-400 py-2 px-3">ログアウト</button>
      </div>

      <div className="flex flex-col items-center px-4 pt-4">
        <p className="text-gray-400 text-sm mb-4">{todayJP}</p>

        {/* 週間・月間グループ切替 */}
        {(view === "week" || view === "month") && (
          <div className="flex gap-2 mb-4 w-full max-w-md">
            <button onClick={() => setGroupMode("date")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${groupMode === "date" ? "bg-blue-500 text-white" : "bg-white text-gray-500 border"}`}>
              📅 日付別
            </button>
            <button onClick={() => setGroupMode("habit")}
              className={`flex-1 py-2 rounded-xl text-sm font-medium ${groupMode === "habit" ? "bg-blue-500 text-white" : "bg-white text-gray-500 border"}`}>
              📋 習慣別
            </button>
          </div>
        )}

        {/* 今日ビュー */}
        {view === "today" && (
          <>
            <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">今日の進捗</span>
                <span className="text-green-600 font-bold text-lg">{rate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 mb-1">
                <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${rate}%` }} />
              </div>
              <p className="text-right text-xs text-gray-400">{doneCount} / {todayHabits.length} 完了</p>
            </div>

            {/* Geminiアドバイスボタン */}
            <button onClick={getGeminiAdvice}
              className="w-full max-w-md bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl py-3 mb-4 font-medium flex items-center justify-center gap-2">
              <span>✨</span>
              {loadingAdvice ? "AIが分析中..." : "AIにアドバイスをもらう"}
            </button>

            {/* Geminiアドバイス表示 */}
            {showAdvice && (
              <div className="w-full max-w-md bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-4 border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-blue-700">✨ AIアドバイス</span>
                  <button onClick={() => setShowAdvice(false)} className="text-gray-400 text-sm">✕</button>
                </div>
                {loadingAdvice ? (
                  <p className="text-gray-500 text-sm">分析中...少々お待ちください</p>
                ) : (
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{advice}</p>
                )}
              </div>
            )}

            {/* カテゴリフィルター */}
            <div className="flex gap-2 mb-4 w-full max-w-md overflow-x-auto pb-1">
              {["すべて", ...CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${filterCategory === cat ? "bg-green-500 text-white" : "bg-white text-gray-500 border"}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* 習慣リスト */}
            <div className="w-full max-w-md space-y-3 mb-4">
              {todayHabits.map(habit => {
                const streak = calcStreak(habit.name);
                return (
                  <div key={habit.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <button onClick={() => toggleHabit(habit)} className="text-3xl flex-shrink-0">
                        {habit.done ? "✅" : "⬜"}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-base ${habit.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                            {habit.name}
                          </span>
                          {streak > 1 && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                              🔥 {streak}日連続
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[habit.category || "未分類"]}`}>
                            {habit.category || "未分類"}
                          </span>
                          {habit.target_minutes && (
                            <span className="text-xs text-gray-400">⏱ {habit.target_minutes}分</span>
                          )}
                          {habit.memo && (
                            <span className="text-xs text-gray-400 truncate">📝 {habit.memo}</span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setEditingHabit(habit)} className="text-gray-300 text-xl p-1">✏️</button>
                      <button onClick={() => deleteHabit(habit.id)} className="text-gray-300 text-xl p-1">🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 習慣追加フォーム */}
            {showAddForm ? (
              <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-3">
                <input type="text" value={newHabit} onChange={e => setNewHabit(e.target.value)}
                  placeholder="習慣名を入力..." autoFocus
                  className="w-full border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-300" />
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 text-base outline-none">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={newTargetMinutes} onChange={e => setNewTargetMinutes(e.target.value)}
                  placeholder="目標時間（分）※任意"
                  className="w-full border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-300" />
                <div className="flex gap-2">
                  <button onClick={() => setShowAddForm(false)}
                    className="flex-1 border rounded-xl py-3 text-gray-500">キャンセル</button>
                  <button onClick={addHabit}
                    className="flex-1 bg-green-500 text-white rounded-xl py-3 font-medium">追加</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                className="w-full max-w-md bg-white border-2 border-dashed border-gray-200 rounded-2xl py-4 text-gray-400 text-base">
                ＋ 習慣を追加
              </button>
            )}
          </>
        )}

        {/* 週間・月間 日付別 */}
        {(view === "week" || view === "month") && groupMode === "date" && (
          <div className="w-full max-w-md space-y-4">
            {Object.entries(groupByDate(habits)).map(([date, dayHabits]) => {
              const done = dayHabits.filter(h => h.done).length;
              const r = dayHabits.length > 0 ? Math.round((done / dayHabits.length) * 100) : 0;
              return (
                <div key={date} className="bg-white p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-700">{new Date(date).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}</span>
                    <span className="text-green-600 font-bold">{r}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${r}%` }} />
                  </div>
                  {dayHabits.map(h => (
                    <div key={h.id} className="flex items-center gap-2 py-2">
                      <span className="text-xl">{h.done ? "✅" : "⬜"}</span>
                      <div>
                        <span className={`text-base ${h.done ? "line-through text-gray-400" : "text-gray-700"}`}>{h.name}</span>
                        {h.category && <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${categoryColors[h.category]}`}>{h.category}</span>}
                      </div>
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
              const streak = calcStreak(name);
              return (
                <div key={name} className="bg-white p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-700">{name}</span>
                    <span className="text-green-600 font-bold">{r}%</span>
                  </div>
                  {streak > 1 && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full mb-2 inline-block">🔥 {streak}日連続</span>}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${r}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dates.map(date => {
                      const h = habitList.find(x => x.date === date);
                      return (
                        <div key={date} className="flex flex-col items-center">
                          <span className="text-xs text-gray-400">{new Date(date).getDate()}</span>
                          <span className="text-2xl">{h ? (h.done ? "✅" : "⬜") : "➖"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editingHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-end">
          <div className="bg-white w-full rounded-t-2xl p-6 space-y-3">
            <h2 className="font-bold text-lg mb-2">習慣を編集</h2>
            <input value={editingHabit.name} onChange={e => setEditingHabit({...editingHabit, name: e.target.value})}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-300" />
            <select value={editingHabit.category || "未分類"} onChange={e => setEditingHabit({...editingHabit, category: e.target.value})}
              className="w-full border rounded-xl px-4 py-3 outline-none">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="number" value={editingHabit.target_minutes || ""} placeholder="目標時間（分）"
              onChange={e => setEditingHabit({...editingHabit, target_minutes: parseInt(e.target.value)})}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-300" />
            <textarea value={editingHabit.memo || ""} placeholder="メモ（任意）" rows={3}
              onChange={e => setEditingHabit({...editingHabit, memo: e.target.value})}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-300 resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setEditingHabit(null)} className="flex-1 border rounded-xl py-3 text-gray-500">キャンセル</button>
              <button onClick={saveEdit} className="flex-1 bg-green-500 text-white rounded-xl py-3 font-medium">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10">
        {(["today", "week", "month"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 text-xs font-medium ${view === v ? "text-green-500" : "text-gray-400"}`}>
            <span className="text-xl">{v === "today" ? "📅" : v === "week" ? "📊" : "📆"}</span>
            {v === "today" ? "今日" : v === "week" ? "週間" : "月間"}
          </button>
        ))}
      </div>
    </main>
  );
}