import React from "react";

export default function RoomInfo() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 my-6 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">🍪</span>
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Lokasi Open House</h3>
          <p className="text-sm text-amber-700 font-medium">
            Sesi Nyantai & Snack Cookies
          </p>
        </div>
      </div>

      <div className="space-y-3 text-gray-600 text-sm mt-4">
        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-amber-100">
          <span className="text-xl">🚪</span>
          <div>
            <p className="font-semibold text-gray-800">Nomor Kamar</p>
            <p className="text-amber-800 font-bold text-base">
              Kamar 201 (Lantai 2)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-amber-100">
          <span className="text-xl">🏢</span>
          <div>
            <p className="font-semibold text-gray-800">Gedung</p>
            <p>Asrama Putra</p>
          </div>
        </div>
      </div>
    </div>
  );
}
