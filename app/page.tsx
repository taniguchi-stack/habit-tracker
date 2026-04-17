"use client";
import { useState } from "react";

const DEFAULT_HABITS = ["運動", "読書", "早起き", "水を飲む", "日記を書く"];

export default function Home() {
  const [habits, setHabits] = useState(
    DEFAULT_HABITS.map((name) => ({ name, done: false }))
  );
  const [newHabit, setNewHabit] = useState("");

  const toggleHabit = (index: number) => {
    setHabits((prev) =>
      prev.map((h, i) => (i === index ? { ...h, done: !h.done } : h))
    );
  };

  const addHabit = () => {
    if (newHabit.trim() === "") return;
    setHabits((prev) => [...prev, { name: newHabit.trim(), done: false }]);
    setNewHabit("");
  };

  const doneCount = habits.filter((h) => h.done).length;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">🌱 習慣トラッカー</h1>
      <p className="text-gray-500 mb-8">
        今日の進捗: {doneCount} / {habits.length}
      </p>

      <div className="w-full max-w-md space-y-3 mb-8">
        {habits.map((habit, i) => (
          <div
            key={i}
            onClick={() => toggleHabit(i)}
            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer shadow-sm transition-all ${
              habit.done ? "bg-green-100 line-through text-gray-400" : "bg-white"
            }`}
          >
            <span className="text-2xl">{habit.done ? "✅" : "⬜"}</span>
            <span className="text-lg">{habit.name}</span>
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
        <button
          onClick={addHabit}
          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600"
        >
          追加
        </button>
      </div>
    </main>
  );
}