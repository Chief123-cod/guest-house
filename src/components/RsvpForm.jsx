import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../data/firebase";

export default function RsvpForm({ guest }) {
  const [attending, setAttending] = useState(guest?.isAttending);
  const [plusOne, setPlusOne] = useState(guest?.plusOneCount || 0);
  const [isSubmitted, setIsSubmitted] = useState(guest?.isAttending !== null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = doc(db, "guests", guest.id);
      await updateDoc(docRef, {
        isAttending: attending,
        plusOneCount: attending ? Number(plusOne) : 0,
        updatedAt: new Date(),
      });
      setIsSubmitted(true);
      setIsEditing(false);
    } catch (error) {
      console.error("Gagal menyimpan konfirmasi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Kembalikan ke state awal dari data guest
    setAttending(guest?.isAttending);
    setPlusOne(guest?.plusOneCount || 0);
    setIsEditing(false);
  };

  // Tampilan Ringkasan Jawaban (Sudah Mengisi & Tidak Sedang Mengubah)
  if (isSubmitted && !isEditing) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-center space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800">
            Konfirmasi Telah Tersimpan
          </p>
          <p className="text-xs text-slate-500">
            {guest.isAttending
              ? `Menghadiri acara (Total: ${1 + Number(guest.plusOneCount)} orang)`
              : "Mengonfirmasikan berhalangan hadir"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs text-amber-600 hover:text-amber-700 font-medium underline transition-colors"
        >
          Ubah jawaban
        </button>
      </div>
    );
  }

  // Tampilan Form Input / Form Ubah Jawaban (Ada Tombol X saat Mengubah)
  return (
    <div className="relative bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 shadow-sm">
      {/* Tombol X hanya muncul ketika tamu menekan tombol "Ubah jawaban" */}
      {isEditing && (
        <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
          <span className="text-xs font-semibold text-slate-700">
            Ubah Konfirmasi
          </span>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="text-slate-400 hover:text-slate-700 font-bold text-sm w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 transition-colors"
            title="Batal Ubah"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Konfirmasi Kehadiran
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setAttending(true)}
              className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                attending === true
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Hadir
            </button>
            <button
              type="button"
              onClick={() => {
                setAttending(false);
                setPlusOne(0);
              }}
              className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
                attending === false
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Berhalangan
            </button>
          </div>
        </div>

        {attending === true && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">
                Membawa teman tambahan
              </span>
              <span className="text-slate-400">
                Maks. {guest.maxPlusOne} orang
              </span>
            </div>
            <select
              value={plusOne}
              onChange={(e) => setPlusOne(Number(e.target.value))}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 font-medium outline-none focus:ring-1 focus:ring-slate-400"
            >
              {Array.from({ length: Number(guest.maxPlusOne) + 1 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? "Tanpa teman (Sendiri)" : `+ ${i} orang teman`}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          disabled={attending === null || loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-xs sm:text-sm disabled:opacity-40 transition-all shadow-sm"
        >
          {loading ? "Menyimpan..." : "Kirim Konfirmasi"}
        </button>
      </form>
    </div>
  );
}
