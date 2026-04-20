import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { habits } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `
あなたは習慣管理のコーチです。以下のユーザーの習慣データを分析して、日本語で優しく具体的なアドバイスを3つ提供してください。

習慣データ:
${habits.map((h: { name: string; done: boolean; date: string; category?: string; target_minutes?: number }) =>
  `- ${h.date} | ${h.name} | ${h.done ? "達成✅" : "未達成⬜"} | カテゴリ: ${h.category || "未分類"}${h.target_minutes ? ` | 目標: ${h.target_minutes}分` : ""}`
).join("\n")}

以下の形式で回答してください：
1. 全体的な評価（1〜2文）
2. アドバイス①
3. アドバイス②
4. アドバイス③
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "アドバイスを取得できませんでした。";

  return NextResponse.json({ advice: text });
}