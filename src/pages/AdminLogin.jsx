import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../data/firebase";

export default function AdminLogin({ onLoginSuccess, onBackToGuest }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLoginSuccess();
    } catch (err) {
      setError("Gagal masuk! Periksa kembali email atau password kamu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-200 max-w-sm w-full space-y-5">
        <div className="text-center">
          <span className="text-3xl">🔐</span>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">Login Admin</h2>
          <p className="text-xs text-gray-500">
            Khusus pengelola undangan Kamar 201
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Email Admin
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kamar201.com"
              className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk Dashboard"}
          </button>
        </form>

        <button
          onClick={onBackToGuest}
          className="w-full text-center text-xs text-gray-500 hover:underline block pt-2"
        >
          ← Kembali ke Halaman Undangan
        </button>
      </div>
    </div>
  );
}
