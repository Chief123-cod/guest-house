import React, { useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../data/firebase";

export default function AdminDashboard({ guests, eventTime, setEventTime }) {
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [maxPlusOneInput, setMaxPlusOneInput] = useState(2);
  const [editingGuest, setEditingGuest] = useState(null);

  // State lokal untuk input waktu admin sebelum di-submit
  const [tempEventTime, setTempEventTime] = useState(eventTime || "");
  const [isSavingTime, setIsSavingTime] = useState(false);

  // Hitung Statistik
  const totalInvited = guests.length;
  const totalAccepted = guests.filter((g) => g.isAttending === true).length;
  const totalRejected = guests.filter((g) => g.isAttending === false).length;
  const totalNotAnswered = guests.filter((g) => g.isAttending === null).length;

  // Simpan Waktu Acara ke Firestore (atau state global)
  const handleSaveEventTime = async (e) => {
    e.preventDefault();
    setIsSavingTime(true);
    try {
      // Kita simpan ke dokumen khusus setting di Firestore atau update state
      const settingRef = doc(db, "settings", "general");
      await updateDoc(settingRef, {
        eventTime: tempEventTime,
      }).catch(async () => {
        // Jika dokumen belum ada, buat baru atau simpan via state/handler
        await addDoc(collection(db, "settings"), { eventTime: tempEventTime });
      });

      setEventTime(tempEventTime);
      alert("Waktu acara berhasil diperbarui!");
    } catch (error) {
      console.error("Gagal menyimpan waktu:", error);
      // Tetap update state lokal agar langsung berubah meskipun database offline
      setEventTime(tempEventTime);
      alert("Waktu acara diperbarui.");
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
      createdAt: new Date(),
    });

    setNameInput("");
    setPhoneInput("");
    setMaxPlusOneInput(2);
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
  };

  // Hapus Tamu
  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus tamu ini?")) {
      await deleteDoc(doc(db, "guests", id));
    }
  };

  // Kirim WhatsApp
  const sendWhatsApp = (guest) => {
    const link = `${window.location.origin}/?guest=${encodeURIComponent(guest.name)}`;
    const timeText = eventTime
      ? `Waktu: ${eventTime}`
      : "Waktu: Akan diinfokan kembali";

    const message = `Halo ${guest.name},\n\nAnda diundang dalam acara Open House Kamar 201.\n\n📍 Lokasi: Asrama Guesthouse, Kamar 201\n🕒 ${timeText}\n\nMohon konfirmasi kehadiran Anda melalui tautan berikut:\n${link}\n\nTerima kasih.`;

    let formattedPhone = guest.phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.slice(1);
    }

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header & Form Pengaturan Waktu Acara */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              Dashboard Undangan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kelola daftar tamu Open House Kamar 201
            </p>
          </div>

          {/* Form Pengaturan Waktu dengan Tombol Submit */}
          <form
            onSubmit={handleSaveEventTime}
            className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <div className="text-xs">
              <span className="block font-semibold text-slate-700">
                Waktu Acara
              </span>
              <span className="text-slate-400">Tampil di halaman undangan</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Contoh: Sabtu, 19:00 WITA"
                value={tempEventTime}
                onChange={(e) => setTempEventTime(e.target.value)}
                className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-400 w-full sm:w-48"
              />
              <button
                type="submit"
                disabled={isSavingTime}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2.5 rounded-lg text-xs transition-all shrink-0 shadow-sm disabled:opacity-50"
              >
                {isSavingTime ? "..." : "Submit"}
              </button>
            </div>
          </form>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            <table className="w-full text-left text-sm text-slate-600 min-w-[650px]">
              <thead className="bg-slate-50 text-slate-700 uppercase text-xs font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3.5 sm:p-4">Nama Tamu</th>
                  <th className="p-3.5 sm:p-4">Nomor WhatsApp</th>
                  <th className="p-3.5 sm:p-4">Status</th>
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
                      {guest.isAttending ? `+${guest.plusOneCount} orang` : "0"}
                    </td>
                    <td className="p-3.5 sm:p-4 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => sendWhatsApp(guest)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm"
                      >
                        Kirim WA
                      </button>
                      <button
                        onClick={() => setEditingGuest(guest)}
                        className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-3 py-1.5 rounded-lg text-xs transition-all border border-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium px-3 py-1.5 rounded-lg text-xs transition-all border border-rose-200"
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
