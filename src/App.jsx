import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "./data/firebase";
import GuestPage from "./pages/GuestPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import "./index.css";

export default function App() {
  const [guests, setGuests] = useState([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState("guest");
  const [loading, setLoading] = useState(true);

  // 1. Pantau status Auth Firebase secara real-time (mencegah logout saat refresh)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminLoggedIn(true);
        const path = window.location.pathname;
        if (path.includes("/login") || path.includes("/admin")) {
          setViewMode("admin");
        }
      } else {
        setIsAdminLoggedIn(false);
      }
    });

    // 2. Ambil data tamu dari Firestore
    const unsubscribeGuests = onSnapshot(
      collection(db, "guests"),
      (snapshot) => {
        const guestList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGuests(guestList);
        setLoading(false);
      },
    );

    return () => {
      unsubscribeAuth();
      unsubscribeGuests();
    };
  }, []);

  // Cek Path URL saat pertama buka
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes("/login")) {
      setViewMode("login");
    }
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminLoggedIn(false);
    setViewMode("guest");
    window.history.pushState({}, "", "/");
  };

  // Baca Parameter URL WhatsApp (?guest=Nathan)
  const queryParams = new URLSearchParams(window.location.search);
  const guestParam = queryParams.get("guest") || queryParams.get("id");

  const currentGuest = guests.find(
    (g) =>
      g.name?.toLowerCase() === guestParam?.toLowerCase() ||
      g.id === guestParam,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex justify-center items-center">
        <p className="text-amber-800 font-bold text-sm animate-pulse">
          Memuat Undangan Kamar 201... 🍪
        </p>
      </div>
    );
  }

  // Tampilan Dashboard Admin
  if (viewMode === "admin" && isAdminLoggedIn) {
    return (
      <div>
        <div className="bg-gray-900 text-white px-4 py-2.5 flex justify-between items-center text-xs font-medium shadow-md">
          <span className="truncate pr-2">👑 Sesi Admin Aktif (Kamar 201)</span>
          <button
            onClick={handleLogout}
            className="bg-rose-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-rose-700 transition-all shrink-0"
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
  // Tampilan Halaman Tamu (Tanpa teks masuk admin di footer)
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <GuestPage
        guestData={currentGuest}
        isFound={Boolean(currentGuest)}
        eventTime={eventTime}
      />

      <footer className="text-center py-6 text-xs text-slate-400">
        <p>© Open House Kamar 201</p>
      </footer>
    </div>
  );
}
