import React from "react";
import RoomInfo from "../components/RoomInfo";
import RsvpForm from "../components/RsvpForm";

export default function GuestPage({ guestData, isFound }) {
  // KONDISI 2: Jika tamu tidak terdaftar atau sudah dihapus oleh admin
  if (!isFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl border border-rose-200 text-center max-w-sm w-full shadow-xl space-y-3">
          <span className="text-4xl">❌</span>
          <h2 className="text-xl font-bold text-gray-800">
            Undangan Tidak Valid
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Maaf, link undangan ini sudah tidak aktif, atau nama kamu tidak
            terdaftar dalam daftar tamu Open House Kamar 201.
          </p>
          <div className="pt-2">
            <span className="inline-block bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1 rounded-full">
              Akses Ditolak / Dihapus
            </span>
          </div>
        </div>
      </div>
    );
  }

  // KONDISI 1: Jika tamu terdaftar dan aktif
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-10 px-4 flex justify-center items-center">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md border border-amber-100 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Header Sapaan Personal */}
        <div className="text-center space-y-2">
          <span className="inline-block bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Open House Kamar 201 🍪
          </span>
          <h1 className="text-2xl font-black text-gray-800">
            Halo, <span className="text-amber-600">{guestData.name}</span>! ✨
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Kamu diundang secara khusus buat mampir santai dan menikmati
            cookies/snack hangat di kamar!
          </p>
        </div>

        {/* Info Detail Lokasi Kamar 201 */}
        <RoomInfo />

        {/* Form RSVP */}
        <RsvpForm guest={guestData} />
      </div>
    </div>
  );
}
