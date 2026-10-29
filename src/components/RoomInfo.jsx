import React from "react";

export default function RoomInfo({ eventTime }) {
  return (
    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-slate-500">
        <span>Lokasi</span>
        <span className="font-semibold text-slate-800">
          Asrama Guesthouse, Kamar 201
        </span>
      </div>
      <div className="flex justify-between items-center text-xs sm:text-sm font-medium text-slate-500">
        <span>Waktu</span>
        <span className="font-semibold text-slate-800">
          {eventTime || "Akan diinfokan kembali"}
        </span>
      </div>
    </div>
  );
}
