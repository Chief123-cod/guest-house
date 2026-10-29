import React from "react";

export default function RoomInfo() {
  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-slate-500">
        <span>Lokasi</span>
        <span className="font-semibold text-slate-800">Kamar 201, Asrama</span>
      </div>
      <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-slate-500">
        <span>Waktu</span>
        <span className="font-semibold text-slate-800">
          Kapanpun saat luang
        </span>
      </div>
      <div className="pt-2 border-t border-slate-200/60 text-center">
        <p className="text-xs text-slate-600 font-medium">
          Tersedia cookies dan snack hangat untuk dinikmati bersama.
        </p>
      </div>
    </div>
  );
}
