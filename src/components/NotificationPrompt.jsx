import React, { useState, useEffect } from "react";
import {
  checkNotificationSupport,
  requestGuestNotificationPermission,
  showDeviceNotification,
} from "../utils/notificationService";

export default function NotificationPrompt({ guest }) {
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const { isSupported: supported, permission: currentPerm } = checkNotificationSupport();
    setIsSupported(supported);
    setPermission(currentPerm);
  }, []);

  const handleEnableNotification = async () => {
    setIsRequesting(true);
    const success = await requestGuestNotificationPermission(guest);
    setIsRequesting(false);

    if (success) {
      setPermission("granted");
    } else {
      const { permission: updatedPerm } = checkNotificationSupport();
      setPermission(updatedPerm);
    }
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    await showDeviceNotification("🔔 Pengingat Open House Kamar 201", {
      body: `Halo ${guest.name}, ini contoh notifikasi HP untuk info perubahan jam & pengingat kehadiran!`,
      tag: "test-notification",
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  if (!isSupported) {
    return null; // Browser tidak mendukung notifikasi
  }

  // JIKA SUDAH DIAKTIFKAN (GRANTED)
  if (permission === "granted") {
    return (
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shrink-0 text-base shadow-inner">
            🔔
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs font-bold text-emerald-900">
                Notifikasi HP Aktif
              </p>
            </div>
            <p className="text-[11px] text-emerald-700 leading-snug">
              Anda akan otomatis menerima info jika ada perubahan jam & pengingat.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTestNotification}
          disabled={testSent}
          className="text-[11px] bg-white border border-emerald-200 text-emerald-800 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 transition-all shrink-0 shadow-xs"
        >
          {testSent ? "Terkirim ✓" : "Tes Bunyi"}
        </button>
      </div>
    );
  }

  // JIKA DITOLAK / DIBLOKIR DI BROWSER
  if (permission === "denied") {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 flex items-center gap-1.5">
          <span>🔕</span> Notifikasi Belum Diizinkan
        </p>
        <p className="text-[11px] text-slate-500">
          Izin notifikasi dinonaktifkan di browser HP Anda. Buka ikon gembok di alamat web browser untuk mengizinkan notifikasi perubahan jadwal.
        </p>
      </div>
    );
  }

  // JIKA BELUM MENENTUKAN (DEFAULT)
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 text-lg shadow-sm shadow-amber-200">
          🔔
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs sm:text-sm font-bold text-amber-950">
            Aktifkan Notifikasi di HP Anda
          </h4>
          <p className="text-[11px] sm:text-xs text-amber-800/90 leading-relaxed">
            Dapatkan pemberitahuan langsung di HP jika jadwal acara berubah & pengingat sebelum open house dimulai.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleEnableNotification}
        disabled={isRequesting}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
      >
        <span>{isRequesting ? "Meminta izin..." : "🔔 Aktifkan Pengingat di HP"}</span>
      </button>
    </div>
  );
}
