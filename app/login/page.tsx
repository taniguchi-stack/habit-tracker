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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? "🌱 新規登録" : "🌱 ログイン"}
        </h1>
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