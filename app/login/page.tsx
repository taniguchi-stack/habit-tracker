"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage(error.message);
      else setMessage("確認メールを送りました！メールを確認してください。");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("メールかパスワードが間違っています。");
      else router.push("/");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? "🌱 新規登録" : "🌱 ログイン"}
        </h1>

        {/* Googleログインボタン */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-2 mb-4 hover:bg-gray-50 transition"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.1C9.5 35.7 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-3.9z"/>
          </svg>
          <span className="text-gray-600 font-medium">Googleでログイン</span>
        </button>

        <div className="flex items-center gap-2 mb-4">
          <hr className="flex-1" />
          <span className="text-gray-400 text-sm">または</span>
          <hr className="flex-1" />
        </div>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl px-4 py-2 mb-3 outline-none focus:ring-2 focus:ring-green-300"
        />
        <input
          type="password"
          placeholder="パスワード（6文字以上）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-xl px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-green-300"
        />
        {message && <p className="text-sm text-red-500 mb-3">{message}</p>}
        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 mb-3"
        >
          {loading ? "処理中..." : isSignUp ? "登録する" : "ログイン"}
        </button>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-gray-500 text-sm"
        >
          {isSignUp ? "ログインはこちら" : "新規登録はこちら"}
        </button>
      </div>
    </main>
  );
}