import React, { useState } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../data/firebase";

export default function AdminDashboard({ guests }) {
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [maxPlusOneInput, setMaxPlusOneInput] = useState(2);
  const [editingGuest, setEditingGuest] = useState(null);

  // Hitung Statistik
  const totalInvited = guests.length;
  const totalAccepted = guests.filter((g) => g.isAttending === true).length;
  const totalRejected = guests.filter((g) => g.isAttending === false).length;
  const totalNotAnswered = guests.filter((g) => g.isAttending === null).length;

  // 1. Tambah Tamu ke Firestore
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

  // 2. Edit Tamu di Firestore
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

  // 3. Hapus Tamu dari Firestore
  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus tamu ini dari daftar?")) {
      await deleteDoc(doc(db, "guests", id));
    }
  };

  // 4. Buka WhatsApp
  const sendWhatsApp = (guest) => {
    const link = `${window.location.origin}/?guest=${encodeURIComponent(guest.name)}`;
    const message = `Halo ${guest.name}! Mampir ke Kamar 201 yuk, ada cookies & snack hangat. Konfirmasi kehadiranmu di link ini ya: ${link}`;

    let formattedPhone = guest.phone.replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "62" + formattedPhone.slice(1);
    }

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard Undangan Asrama
          </h1>
          <p className="text-sm text-gray-500">
            Kelola daftar tamu Open House Kamar 201
          </p>
        </div>

        {/* Ringkasan Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">Total Diundang</p>
            <p className="text-2xl font-black text-gray-800 mt-1">
              {totalInvited} Orang
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <p className="text-xs text-emerald-600 font-medium">
              Diterima (Hadir)
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {totalAccepted} Tamu
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
            <p className="text-xs text-rose-600 font-medium">
              Ditolak (Tidak Hadir)
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {totalRejected} Tamu
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
            <p className="text-xs text-amber-600 font-medium">Belum Jawab</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {totalNotAnswered} Tamu
            </p>
          </div>
        </div>

        {/* Form Tambah Tamu Baru */}
        <form
          onSubmit={handleAddSubmit}
          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4"
        >
          <h3 className="font-bold text-gray-700 text-sm">
            ➕ Tambah Tamu Baru
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nama Tamu (contoh: Nathan)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <input
              type="text"
              placeholder="Nomor WhatsApp (contoh: 0812345...)"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Batas Teman"
                min="0"
                value={maxPlusOneInput}
                onChange={(e) => setMaxPlusOneInput(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 font-semibold px-5 py-3 rounded-xl text-sm text-white transition-all whitespace-nowrap"
              >
                + Tambah
              </button>
            </div>
          </div>
        </form>

        {/* Tabel Tamu */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold border-b border-gray-100">
                <tr>
                  <th className="p-4">Nama Tamu</th>
                  <th className="p-4">Nomor WhatsApp</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Bawa Teman</th>
                  <th className="p-4 text-center">Aksi & WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-800">
                      {guest.name}
                    </td>
                    <td className="p-4 text-gray-500">{guest.phone || "-"}</td>
                    <td className="p-4">
                      {guest.isAttending === true && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-semibold">
                          Diterima (Hadir)
                        </span>
                      )}
                      {guest.isAttending === false && (
                        <span className="bg-rose-100 text-rose-800 text-xs px-3 py-1 rounded-full font-semibold">
                          Ditolak (Tidak Hadir)
                        </span>
                      )}
                      {guest.isAttending === null && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-semibold">
                          Belum Jawab
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {guest.isAttending ? `+${guest.plusOneCount} orang` : "0"}
                    </td>
                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => sendWhatsApp(guest)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium px-3 py-1.5 rounded-lg text-xs transition-all border border-emerald-200"
                      >
                        💬 Kirim WA
                      </button>
                      <button
                        onClick={() => setEditingGuest(guest)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium px-3 py-1.5 rounded-lg text-xs transition-all border border-blue-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium px-3 py-1.5 rounded-lg text-xs transition-all border border-rose-200"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit Form */}
      {editingGuest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-800 text-lg">
                ✏️ Edit Data Tamu
              </h3>
              <button
                onClick={() => setEditingGuest(null)}
                className="text-gray-400 font-bold text-lg"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nama Tamu
                </label>
                <input
                  type="text"
                  value={editingGuest.name}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={editingGuest.phone}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, phone: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
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
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm outline-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGuest(null)}
                  className="flex-1 bg-gray-100 py-3 rounded-xl text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
