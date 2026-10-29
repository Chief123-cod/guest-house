import React from "react";
import RoomInfo from "../components/RoomInfo";
import RsvpForm from "../components/RsvpForm";

export default function GuestPage({ guestData, isFound }) {
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:py-12 sm:px-6 flex justify-center items-center">
      <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
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

        {/* Garis Pembatas Halus */}
        <hr className="border-slate-100" />

        {/* Info Detail Lokasi Kamar 201 */}
        <RoomInfo />

        {/* Form RSVP */}
        <RsvpForm guest={guestData} />
      </div>
    </div>
  );
}
