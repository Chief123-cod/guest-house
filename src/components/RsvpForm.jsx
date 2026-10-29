import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../data/firebase";

export default function RsvpForm({ guest }) {
  const [attending, setAttending] = useState(guest?.isAttending);
  const [plusOne, setPlusOne] = useState(guest?.plusOneCount || 0);
  const [isSubmitted, setIsSubmitted] = useState(guest?.isAttending !== null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simpan konfirmasi ke Firestore
    const docRef = doc(db, "guests", guest.id);
    await updateDoc(docRef, {
      isAttending: attending,
      plusOneCount: attending ? Number(plusOne) : 0,
      updatedAt: new Date(),
    });

    setIsSubmitted(true);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg">
      <h3 className="font-bold text-gray-800 text-lg mb-4 text-center">
        Konfirmasi Kehadiran
      </h3>

      {isSubmitted ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-center space-y-2">
          <p className="font-bold text-base">
            Terima kasih atas konfirmasinya! 🎉
          </p>
          <p className="text-sm">
            {attending
              ? `Sampai jumpa di Kamar 201! (Total: ${1 + Number(plusOne)} orang)`
              : "Mungkin di lain kesempatan ya!"}
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="mt-2 text-xs text-emerald-700 underline font-semibold"
          >
            Ubah Konfirmasi
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apakah kamu bisa datang?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAttending(true)}
                className={`p-3 rounded-xl border font-semibold text-sm transition-all ${
                  attending === true
                    ? "bg-amber-500 text-white border-amber-500 shadow-md"
                    : "border-gray-200 hover:bg-amber-50 text-gray-700"
                }`}
              >
                👍 Ya, Saya Datang
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttending(false);
                  setPlusOne(0);
                }}
                className={`p-3 rounded-xl border font-semibold text-sm transition-all ${
                  attending === false
                    ? "bg-rose-500 text-white border-rose-500 shadow-md"
                    : "border-gray-200 hover:bg-rose-50 text-gray-700"
                }`}
              >
                🙅‍♂️ Maaf, Ga Bisa
              </button>
            </div>
          </div>

          {attending === true && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 transition-all">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membawa teman tambahan?
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Maksimal bawa{" "}
                <span className="font-bold text-amber-600">
                  {guest.maxPlusOne} orang
                </span>{" "}
                teman.
              </p>
              <select
                value={plusOne}
                onChange={(e) => setPlusOne(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 font-medium outline-none"
              >
                {Array.from(
                  { length: Number(guest.maxPlusOne) + 1 },
                  (_, i) => (
                    <option key={i} value={i}>
                      {i === 0
                        ? "Hanya Saya Sendiri (0 Teman)"
                        : `+ ${i} Teman`}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={attending === null}
            className="w-full bg-gray-900 text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:bg-gray-800 transition-all shadow-md"
          >
            Kirim Jawaban
          </button>
        </form>
      )}
    </div>
  );
}
