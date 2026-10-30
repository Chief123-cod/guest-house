import React, { useState, useEffect, useRef } from "react";
import RoomInfo from "../components/RoomInfo";
import RsvpForm from "../components/RsvpForm";
import NotificationPrompt from "../components/NotificationPrompt";
import {
  initServiceWorker,
  listenToGuestNotifications,
  showDeviceNotification,
  checkAndTriggerDailyReminder,
} from "../utils/notificationService";

export default function GuestPage({ guestData, isFound, eventTime }) {
  const [activeToast, setActiveToast] = useState(null);
  const [timeChangeAlert, setTimeChangeAlert] = useState(null);
  const initialTimeRef = useRef(eventTime);

  // Inisialisasi Service Worker saat pertama kali buka web
  useEffect(() => {
    initServiceWorker();
  }, []);

  // Cek pengingat otomatis pagi / siang (menjelang jam 13:30)
  useEffect(() => {
    if (isFound && guestData) {
      checkAndTriggerDailyReminder(guestData, eventTime);
    }
  }, [isFound, guestData, eventTime]);

  // Pantau jika ada perubahan waktu acara secara real-time
  useEffect(() => {
    if (!initialTimeRef.current && eventTime) {
      initialTimeRef.current = eventTime;
      return;
    }

    if (
      initialTimeRef.current &&
      eventTime &&
      initialTimeRef.current !== eventTime
    ) {
      // Waktu acara berubah! Munculkan alert banner dan notifikasi di HP
      const msg = `Waktu acara telah diperbarui menjadi: ${eventTime}`;
      setTimeChangeAlert(msg);

      showDeviceNotification("📢 Perubahan Waktu Acara Kamar 201", {
        body: msg,
        tag: "event-time-update",
      });

      initialTimeRef.current = eventTime;
    }
  }, [eventTime]);

  // Dengarkan notifikasi langsung dari Admin Dashboard yang dikirim spesifik ke tamu ini
  useEffect(() => {
    if (!isFound || !guestData?.id) return;

    const unsubscribe = listenToGuestNotifications(guestData.id, (notif) => {
      // Munculkan notifikasi di HP
      showDeviceNotification(notif.title || "Open House Kamar 201", {
        body: notif.message,
        tag: `notif-${notif.id || Date.now()}`,
      });

      // Tampilkan popup Toast interaktif di layar
      setActiveToast({
        title: notif.title,
        message: notif.message,
        type: notif.type,
      });

      // Hilangkan toast setelah 8 detik
      setTimeout(() => {
        setActiveToast(null);
      }, 8000);
    });

    return () => unsubscribe();
  }, [isFound, guestData?.id]);

  // KONDISI 2: Jika tamu tidak terdaftar atau sudah dihapus oleh admin
  if (!isFound) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-slate-200/80 p-6 sm:p-8 rounded-2xl sm:rounded-3xl text-center max-w-sm w-full shadow-sm space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-lg font-semibold">
            !
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Undangan Tidak Valid
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Maaf, tautan ini sudah tidak aktif atau nama Anda tidak terdaftar
              dalam daftar tamu Open House Kamar 201.
            </p>
          </div>
          <div className="pt-2">
            <span className="inline-block bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1 rounded-full">
              Akses Ditutup
            </span>
          </div>
        </div>
      </div>
    );
  }

  // KONDISI 1: Jika tamu terdaftar dan aktif
  return (
    <div className="relative min-h-screen bg-slate-50 py-8 px-4 sm:py-12 sm:px-6 flex justify-center items-center">
      {/* Toast Notifikasi Masuk dari Admin */}
      {activeToast && (
        <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-bounce duration-500">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔔</span>
              <div>
                <p className="text-xs font-bold text-amber-400">
                  {activeToast.title || "Pemberitahuan Undangan"}
                </p>
                <p className="text-xs text-slate-200 mt-0.5 leading-snug">
                  {activeToast.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Banner Alert Jika Waktu Acara Diperbarui */}
        {timeChangeAlert && (
          <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3.5 flex items-start gap-3 text-amber-900 shadow-xs animate-pulse">
            <span className="text-base">🕒</span>
            <div className="text-xs">
              <p className="font-bold">Pembaruan Jadwal Acara!</p>
              <p className="text-amber-800 leading-snug mt-0.5">
                {timeChangeAlert}
              </p>
            </div>
          </div>
        )}

        {/* Header Sapaan Personal */}
        <div className="text-center space-y-2">
          <span className="inline-block bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Open House Kamar 201
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Halo, <span className="text-amber-600">{guestData.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            Anda diundang untuk mampir santai dan menikmati hidangan ringan di
            asrama.
          </p>
        </div>

        {/* Kotak Pengaktifan Notifikasi HP */}
        <NotificationPrompt guest={guestData} />

        {/* Garis Pembatas Halus */}
        <hr className="border-slate-100" />

        {/* Info Detail Lokasi & Waktu Kamar 201 */}
        <RoomInfo eventTime={eventTime} />

        {/* Form RSVP */}
        <RsvpForm guest={guestData} />
      </div>
    </div>
  );
}
