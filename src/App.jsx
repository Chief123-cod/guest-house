import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./data/firebase";
import GuestPage from "./pages/GuestPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import "./index.css";

export default function App() {
  const [guests, setGuests] = useState([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState("guest");
  const [loading, setLoading] = useState(true);

  // 1. Ambil data tamu dari Firestore secara Real-Time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "guests"), (snapshot) => {
      const guestList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGuests(guestList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Cek Path URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes("/login") || path.includes("/admin")) {
      setViewMode("login");
    }
  }, []);

  // 3. Baca Parameter URL WhatsApp (?guest=Nathan)
  const queryParams = new URLSearchParams(window.location.search);
  const guestParam = queryParams.get("guest") || queryParams.get("id");

  // Cari Tamu
  const currentGuest = guests.find(
    (g) =>
      g.name?.toLowerCase() === guestParam?.toLowerCase() ||
      g.id === guestParam,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex justify-center items-center">
        <p className="text-amber-800 font-bold text-sm">
          Memuat Undangan... 🍪
        </p>
      </div>
    );
  }

  // Tampilan Admin Dashboard
  if (viewMode === "admin" && isAdminLoggedIn) {
    return (
      <div>
        <div className="bg-gray-900 text-white px-6 py-2 flex justify-between items-center text-xs font-medium">
          <span>👑 Sesi Admin Aktif (Kamar 201)</span>
          <button
            onClick={() => {
              setIsAdminLoggedIn(false);
              setViewMode("guest");
              window.history.pushState({}, "", "/");
            }}
            className="bg-rose-600 px-3 py-1 rounded-md font-semibold hover:bg-rose-700 transition-all"
          >
            Logout
          </button>
        </div>
        <AdminDashboard guests={guests} />
      </div>
    );
  }

  // Tampilan Form Login
  if (viewMode === "login") {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setViewMode("admin");
        }}
        onBackToGuest={() => {
          setViewMode("guest");
          window.history.pushState({}, "", "/");
        }}
      />
    );
  }

  // Tampilan Halaman Tamu
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <GuestPage guestData={currentGuest} isFound={Boolean(currentGuest)} />

      <footer className="text-center py-4 text-xs text-gray-400">
        <button
          onClick={() => {
            setViewMode("login");
            window.history.pushState({}, "", "/login");
          }}
          className="hover:text-gray-600 transition-colors"
        >
          • Masuk Admin •
        </button>
      </footer>
    </div>
  );
}
