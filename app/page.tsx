"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Habit = { id: number; name: string; done: boolean };

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    const { data } = await supabase.from("habits").select("*").order("id");
    if (data) setHabits(data);
  };

  const addHabit = async () => {
    if (newHabit.trim() === "") return;
    await supabase.from("habits").insert({ name: newHabit.trim(), done: false });
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

  const startEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setEditingName(habit.name);
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    await supabase.from("habits").update({ name: editingName }).eq("id", editingId);
    setEditingId(null);
    fetchHabits();
  };

  const doneCount = habits.filter((h) => h.done).length;
  const rate = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">🌱 習慣トラッカー</h1>
      <p className="text-gray-500 mb-2">今日の進捗: {doneCount} / {habits.length}</p>
      <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-8">
        <div
          className="bg-green-500 h-4 rounded-full transition-all"
          style={{ width: `${rate}%` }}
        />
      </div>
      <p className="text-green-600 font-bold mb-6 text-xl">{rate}% 達成！</p>

      <div className="w-full max-w-md space-y-3 mb-8">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center gap-2 bg-white p-4 rounded-xl shadow-sm">
            <span onClick={() => toggleHabit(habit)} className="cursor-pointer text-2xl">
              {habit.done ? "✅" : "⬜"}
            </span>
            {editingId === habit.id ? (
              <>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 border rounded px-2 py-1"
                />
                <button onClick={saveEdit} className="text-blue-500 text-sm">保存</button>
              </>
            ) : (
              <>
                <span className={`flex-1 text-lg ${habit.done ? "line-through text-gray-400" : ""}`}>
                  {habit.name}
                </span>
                <button onClick={() => startEdit(habit)} className="text-gray-400 text-sm">✏️</button>
                <button onClick={() => deleteHabit(habit.id)} className="text-red-400 text-sm">🗑️</button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 w-full max-w-md">
        <input
          type="text"
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          placeholder="習慣を追加..."
          className="flex-1 border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-green-300"
        />
        <button onClick={addHabit} className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600">
          追加
        </button>
      </div>
    </main>
  );
}