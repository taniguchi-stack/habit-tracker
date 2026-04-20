import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { habits } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const habitList = habits.map(
    (h) => "- " + h.date + " | " + h.name + " | " + (h.done ? "達成" : "未達成") + " | カテゴリ: " + (h.category || "未分類")
  ).join("\n");

  const prompt = "あなたは習慣管理のコーチです。以下の習慣データを分析して日本語でアドバイスを3つください。\n\n" + habitList;

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" + apiKey;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ advice: "エラー: " + JSON.stringify(data) });
    return NextResponse.json({ advice: text });
  } catch (e) {
    return NextResponse.json({ advice: "通信エラーが発生しました。" });
  }
}