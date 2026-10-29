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

  // State Waktu Acara
  const [eventTime, setEventTime] = useState("");

  // 1. Pantau status Auth Firebase secara real-time
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

    // 2. Ambil data tamu dari Firestore secara real-time
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

    // 3. Ambil data setting waktu acara dari Firestore secara real-time
    const unsubscribeSettings = onSnapshot(
      collection(db, "settings"),
      (snapshot) => {
        snapshot.forEach((doc) => {
          if (doc.data().eventTime) {
            setEventTime(doc.data().eventTime);
          }
        });
      },
      (error) => {
        // Fallback aman jika koleksi settings belum dibuat di Firestore
        console.log("Settings collection belum tersedia:", error);
      },
    );

    return () => {
      unsubscribeAuth();
      unsubscribeGuests();
      unsubscribeSettings();
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

  // Baca Parameter URL WhatsApp
  const queryParams = new URLSearchParams(window.location.search);
  const rawGuestParam = queryParams.get("guest") || queryParams.get("id");
  const guestParam = rawGuestParam
    ? decodeURIComponent(rawGuestParam).trim().toLowerCase()
    : "";

  const currentGuest = guests.find(
    (g) =>
      g.name?.trim().toLowerCase() === guestParam || g.id === rawGuestParam,
  );

  // Status validitas tamu (Pastikan parameter ada dan tamu benar-benar terdaftar)
  const isGuestFound = Boolean(guestParam && currentGuest);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <p className="text-slate-600 font-medium text-sm animate-pulse">
          Memuat Undangan Kamar 201...
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
        <AdminDashboard
          guests={guests}
          eventTime={eventTime}
          setEventTime={setEventTime}
        />
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
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <GuestPage
        guestData={currentGuest}
        isFound={isGuestFound}
        eventTime={eventTime}
      />

      <footer className="text-center py-6 text-xs text-slate-400">
        <p>© Open House Kamar 201</p>
      </footer>
    </div>
  );
}
