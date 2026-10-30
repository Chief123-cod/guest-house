import React, { useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../data/firebase";
import {
  sendNotificationToSingleGuest,
  broadcastNotification,
} from "../utils/notificationService";

export default function AdminDashboard({ guests, eventTime, setEventTime }) {
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [maxPlusOneInput, setMaxPlusOneInput] = useState(2);
  const [editingGuest, setEditingGuest] = useState(null);

  // State Pengaturan Waktu
  const [tempEventTime, setTempEventTime] = useState(eventTime || "");
  const [isSavingTime, setIsSavingTime] = useState(false);

  // State Modal Notifikasi Personal Per Tamu
  const [targetGuestNotif, setTargetGuestNotif] = useState(null);
  const [notifTemplate, setNotifTemplate] = useState("reminder");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Hitung Statistik
  const totalInvited = guests.length;
  const totalAccepted = guests.filter((g) => g.isAttending === true).length;
  const totalRejected = guests.filter((g) => g.isAttending === false).length;
  const totalNotAnswered = guests.filter((g) => g.isAttending === null).length;
  const totalNotifActive = guests.filter((g) => g.notificationsEnabled).length;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Simpan Waktu Acara ke Firestore & Kirim Notifikasi Pembaruan
  const handleSaveEventTime = async (e) => {
    e.preventDefault();
    if (!tempEventTime.trim()) return;
    setIsSavingTime(true);
    try {
      const settingRef = doc(db, "settings", "general");
      await updateDoc(settingRef, {
        eventTime: tempEventTime,
      }).catch(async () => {
        await addDoc(collection(db, "settings"), { eventTime: tempEventTime });
      });

      setEventTime(tempEventTime);

      // Otomatis kirim pemberitahuan ke HP tamu yang terdaftar
      await broadcastNotification(guests, {
        title: "📢 Perubahan Waktu Acara Kamar 201",
        message: `Waktu acara telah diperbarui menjadi: ${tempEventTime}. Silakan cek undangan Anda.`,
        type: "time_change",
      });

      showToast("Waktu acara diperbarui & notifikasi perubahan dikirim ke HP tamu!");
    } catch (error) {
      console.error("Gagal menyimpan waktu:", error);
      setEventTime(tempEventTime);
      showToast("Waktu acara diperbarui.");
    } finally {
      setIsSavingTime(false);
    }
  };

  // Tambah Tamu
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    await addDoc(collection(db, "guests"), {
      name: nameInput,
      phone: phoneInput,
      maxPlusOne: Number(maxPlusOneInput),
      isAttending: null,
      plusOneCount: 0,
      notificationsEnabled: false,
      createdAt: new Date(),
    });

    setNameInput("");
    setPhoneInput("");
    setMaxPlusOneInput(2);
    showToast(`Tamu "${nameInput}" berhasil ditambahkan.`);
  };

  // Edit Tamu
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingGuest) return;

    const docRef = doc(db, "guests", editingGuest.id);
    await updateDoc(docRef, {
      name: editingGuest.name,
      phone: editingGuest.phone,
      maxPlusOne: Number(editingGuest.maxPlusOne),
    });

    setEditingGuest(null);
    showToast("Data tamu berhasil diperbarui.");
  };

  // Hapus Tamu
  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus tamu ini?")) {
      await deleteDoc(doc(db, "guests", id));
      showToast("Tamu telah dihapus.");
    }
  };

  // Buka Modal Notifikasi Spesifik Tamu
  const openSingleGuestNotifModal = (guest) => {
    setTargetGuestNotif(guest);
    setNotifTemplate("reminder");
    setCustomTitle("🔔 Pengingat Open House Kamar 201");
    setCustomMessage(
      `Halo ${guest.name}, jangan lupa acara open house dimulai pukul 13:30 siang ini. Kami menunggu kedatangan Anda!`
    );
  };

  // Ganti Template Notifikasi di Modal
  const handleTemplateChange = (tpl) => {
    setNotifTemplate(tpl);
    if (!targetGuestNotif) return;

    if (tpl === "reminder") {
      setCustomTitle("🔔 Pengingat Open House Kamar 201");
      setCustomMessage(
        `Halo ${targetGuestNotif.name}, jangan lupa acara open house dimulai pukul 13:30 siang ini. Kami menunggu kehadiran Anda!`
      );
    } else if (tpl === "time_change") {
      setCustomTitle("📢 Perubahan Waktu Acara Kamar 201");
      setCustomMessage(
        `Halo ${targetGuestNotif.name}, ada pembaruan jadwal: Acara Open House Kamar 201 diadakan pada ${eventTime || "13:30 siang"}.`
      );
    } else {
      setCustomTitle("Pemberitahuan Undangan Kamar 201");
      setCustomMessage("");
    }
  };

  // Kirim Notifikasi Spesifik ke 1 Tamu Saja
  const handleSendSingleNotif = async (e) => {
    e.preventDefault();
    if (!targetGuestNotif || !customMessage.trim()) return;

    setIsSendingNotif(true);
    try {
      await sendNotificationToSingleGuest(targetGuestNotif, {
        title: customTitle.trim() || "Open House Kamar 201",
        message: customMessage.trim(),
        type: notifTemplate,
      });

      showToast(`Notifikasi berhasil dikirim ke HP ${targetGuestNotif.name}!`);
      setTargetGuestNotif(null);
    } catch (err) {
      alert("Gagal mengirim notifikasi: " + err.message);
    } finally {
      setIsSendingNotif(false);
    }
  };

  // Kirim Broadcast Pengingat Hari-H Siang (13:30) ke Semua Tamu
  const handleBroadcastReminder = async () => {
    if (!confirm("Kirim notifikasi pengingat acara siang (13:30) ke semua tamu?")) {
      return;
    }

    try {
      await broadcastNotification(guests, {
        title: "🔔 Pengingat Open House Kamar 201",
        message: "Jangan lupa hadir! Acara open house kamar 201 dimulai pukul 13:30 siang ini. Kami siap menyambut Anda!",
        type: "reminder",
      });
      showToast("Notifikasi pengingat siang (13:30) berhasil dikirim ke semua tamu!");
    } catch (err) {
      alert("Gagal broadcast notifikasi: " + err.message);
    }
  };

  // Kirim WhatsApp
  const sendWhatsApp = (guest) => {
    const link = `${window.location.origin}/?guest=${encodeURIComponent(guest.name)}`;
    const timeText = eventTime
      ? `Waktu: ${eventTime}`
      : "Waktu: Open House 13:30 Siang";

    const message = `Halo ${guest.name},\n\nAnda diundang dalam acara Open House Kamar 201.\n\n📍 Lokasi: Asrama Guesthouse, Kamar 201\n🕒 ${timeText}\n\nMohon konfirmasi kehadiran dan aktifkan notifikasi pengingat di HP Anda melalui tautan berikut:\n${link}\n\nTerima kasih.`;

    let formattedPhone = guest.phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.slice(1);
    }

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 md:p-8">
      {/* Toast Notifikasi Sukses */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-medium animate-fadeIn">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header & Form Pengaturan Waktu Acara */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Dashboard Undangan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kelola daftar tamu & notifikasi HP Open House Kamar 201
            </p>
          </div>

          {/* Form Pengaturan Waktu */}
          <form
            onSubmit={handleSaveEventTime}
            className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="text-xs">
              <span className="block font-semibold text-slate-700">
                Waktu Acara
              </span>
              <span className="text-slate-400">Notifikasi otomatis dikirim saat diubah</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: 13:30 WITA"
                value={tempEventTime}
                onChange={(e) => setTempEventTime(e.target.value)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-44"
              />
              <button
                type="submit"
                disabled={isSavingTime}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2.5 rounded-lg text-xs transition-all shrink-0 shadow-sm disabled:opacity-50"
              >
                {isSavingTime ? "..." : "Simpan & Notif"}
              </button>
            </div>
          </form>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Total Diundang</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
              {totalInvited} Orang
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-100 shadow-sm">
            <p className="text-xs text-emerald-600 font-medium">Hadir</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
              {totalAccepted} Tamu
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-rose-100 shadow-sm">
            <p className="text-xs text-rose-600 font-medium">Berhalangan</p>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-1">
              {totalRejected} Tamu
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-amber-100 shadow-sm">
            <p className="text-xs text-amber-600 font-medium">Belum Menjawab</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
              {totalNotAnswered} Tamu
            </p>
          </div>
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-indigo-100 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs text-indigo-600 font-medium">HP Notif Aktif</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-700 mt-1">
              {totalNotifActive} HP
            </p>
          </div>
        </div>

        {/* Panel Kontrol Cepat Notifikasi HP */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h3 className="font-bold text-sm sm:text-base">
                Pusat Pengingat & Notifikasi HP Tamu
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Kirim pengingat serentak ke semua tamu atau gunakan tombol notifikasi per-tamu di tabel untuk mengirim ke nomor tamu tertentu saja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleBroadcastReminder}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>⏰</span>
              <span>Kirim Pengingat Siang (13:30)</span>
            </button>
          </div>
        </div>

        {/* Form Tambah Tamu Baru */}
        <form
          onSubmit={handleAddSubmit}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 sm:space-y-4"
        >
          <h3 className="font-bold text-slate-700 text-sm">Tambah Tamu Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nama Tamu"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-slate-400 w-full"
              required
            />
            <input
              type="text"
              placeholder="Nomor WhatsApp (0812345...)"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-slate-400 w-full"
              required
            />
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
              <input
                type="number"
                placeholder="Batas Teman"
                min="0"
                value={maxPlusOneInput}
                onChange={(e) => setMaxPlusOneInput(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 font-medium px-5 py-3 rounded-xl text-sm text-white transition-all whitespace-nowrap shadow-sm"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>

        {/* Tabel Tamu */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 min-w-[720px]">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3.5 sm:p-4">Nama Tamu</th>
                  <th className="p-3.5 sm:p-4">Nomor WhatsApp</th>
                  <th className="p-3.5 sm:p-4">Status RSVP</th>
                  <th className="p-3.5 sm:p-4">Notifikasi HP</th>
                  <th className="p-3.5 sm:p-4">Teman</th>
                  <th className="p-3.5 sm:p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 sm:p-4 font-bold text-slate-800">
                      {guest.name}
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-500">
                      {guest.phone || "-"}
                    </td>
                    <td className="p-3.5 sm:p-4">
                      {guest.isAttending === true && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                          Hadir
                        </span>
                      )}
                      {guest.isAttending === false && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                          Berhalangan
                        </span>
                      )}
                      {guest.isAttending === null && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                          Belum Menjawab
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      {guest.notificationsEnabled ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          HP Aktif
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-medium">
                          Belum Aktif
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      {guest.isAttending ? `+${guest.plusOneCount} orang` : "0"}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center space-x-1.5 whitespace-nowrap">
                      {/* Tombol Kirim Notifikasi HP Personal Khusus Tamu Ini Saja */}
                      <button
                        onClick={() => openSingleGuestNotifModal(guest)}
                        title="Kirim notifikasi langsung ke HP tamu ini saja"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-all border border-indigo-200"
                      >
                        🔔 Notif HP
                      </button>

                      {/* Tombol Kirim WhatsApp */}
                      <button
                        onClick={() => sendWhatsApp(guest)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-2.5 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                      >
                        WA
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setEditingGuest(guest)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-2.5 py-1.5 rounded-lg text-xs transition-all border border-slate-200"
                      >
                        Edit
                      </button>

                      {/* Hapus */}
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium px-2.5 py-1.5 rounded-lg text-xs transition-all border border-rose-200"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Kirim Notifikasi Spesifik Tamu (Hanya Muncul di HP Tamu Bersangkutan) */}
      {targetGuestNotif && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                  <span>🔔</span> Kirim Notifikasi ke HP Tamu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tamu: <span className="font-semibold text-slate-800">{targetGuestNotif.name}</span> ({targetGuestNotif.phone})
                </p>
              </div>
              <button
                onClick={() => setTargetGuestNotif(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Status HP Tamu */}
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              targetGuestNotif.notificationsEnabled
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}>
              <span className="text-base">{targetGuestNotif.notificationsEnabled ? "🟢" : "⚠️"}</span>
              <span>
                {targetGuestNotif.notificationsEnabled
                  ? "Tamu ini sudah mengaktifkan izin notifikasi di HP-nya."
                  : "Tamu belum mengaktifkan izin notifikasi di web undangan. Notifikasi akan tersimpan & langsung muncul begitu tamu membuka web."}
              </span>
            </div>

            <form onSubmit={handleSendSingleNotif} className="space-y-3.5">
              {/* Pilihan Template Cepat */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Pilih Template Pesan
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTemplateChange("reminder")}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      notifTemplate === "reminder"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    ⏰ Pengingat 13:30
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange("time_change")}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      notifTemplate === "time_change"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    📢 Perubahan Jam
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTemplateChange("custom")}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      notifTemplate === "custom"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    ✏️ Kustom
                  </button>
                </div>
              </div>

              {/* Judul Notifikasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Judul Notifikasi
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
              </div>

              {/* Isi Pesan Notifikasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Isi Pesan Notifikasi di HP
                </label>
                <textarea
                  rows="3"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-slate-400"
                  placeholder="Ketik pesan notifikasi untuk tamu ini..."
                  required
                ></textarea>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-[11px] text-slate-500">
                🔒 Sesuai aturan: Notifikasi ini hanya dikirim ke HP <strong>{targetGuestNotif.name}</strong> dan tidak akan muncul di HP tamu lainnya.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetGuestNotif(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {isSendingNotif ? "Mengirim..." : "Kirim Notifikasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tamu */}
      {editingGuest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">
                Edit Data Tamu
              </h3>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Tamu
                </label>
                <input
                  type="text"
                  value={editingGuest.name}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, name: e.target.value })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={editingGuest.phone}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, phone: e.target.value })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Batas Teman
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingGuest.maxPlusOne}
                  onChange={(e) =>
                    setEditingGuest({
                      ...editingGuest,
                      maxPlusOne: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
