// src/utils/notificationService.js
import { doc, updateDoc, addDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../data/firebase";

// Suara notifikasi lembut menggunakan Web Audio API tanpa perlu file eksternal
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Nada 1 (Chime Pembuka)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.3);

    // Nada 2 (Chime Kedua Melodi Harmoni)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.4);
      } catch (err) {}
    }, 120);
  } catch (e) {
    // Abaikan jika browser membatasi autoplay audio
  }
};

// Inisialisasi Service Worker
export const initServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      return reg;
    } catch (err) {
      console.warn("Service worker registration gagal:", err);
    }
  }
  return null;
};

// Cek apakah browser HP mendukung Web Notification
export const checkNotificationSupport = () => {
  const isSupported = "Notification" in window;
  const permission = isSupported ? Notification.permission : "denied";
  return { isSupported, permission };
};

// Munculkan notifikasi di HP (via Service Worker dengan fallback API)
export const showDeviceNotification = async (title, options = {}) => {
  playNotificationSound();

  const finalOptions = {
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    ...options,
  };

  // Coba tampilkan lewat Service Worker (Standar PWA di Mobile Android & iOS)
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, finalOptions);
        return;
      }
    } catch (e) {
      console.warn("Gagal menampilkan notifikasi via ServiceWorker:", e);
    }
  }

  // Fallback standar browser Notification
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, finalOptions);
    } catch (e) {
      console.warn("Gagal membuat notifikasi standar:", e);
    }
  }
};

// Minta izin notifikasi dari HP tamu dan simpan status ke Firestore
export const requestGuestNotificationPermission = async (guest) => {
  if (!("Notification" in window)) {
    alert("Browser HP Anda belum mendukung fitur Web Notification.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === "granted";

    if (guest?.id) {
      const docRef = doc(db, "guests", guest.id);
      await updateDoc(docRef, {
        notificationsEnabled: isGranted,
        deviceInfo: navigator.userAgent.slice(0, 120),
        lastSubscribedAt: new Date(),
      });
    }

    if (isGranted) {
      await initServiceWorker();
      // Berikan konfirmasi notifikasi pertama kali di HP
      await showDeviceNotification("Notifikasi Aktif! 🔔", {
        body: `Halo ${guest.name}, Anda akan menerima info jika ada perubahan jam acara & pengingat kehadiran.`,
        tag: "welcome-notif",
      });
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error meminta izin notifikasi:", error);
    return false;
  }
};

// Admin mengirim notifikasi spesifik ke HP 1 tamu
export const sendNotificationToSingleGuest = async (guest, { title, message, type = "custom" }) => {
  if (!guest?.id) return false;

  try {
    // 1. Simpan di koleksi riwayat notifikasi Firestore
    await addDoc(collection(db, "notifications"), {
      guestId: guest.id,
      guestName: guest.name,
      title,
      message,
      type,
      createdAt: new Date(),
      read: false,
    });

    // 2. Update status notifikasi terakhir langsung di data tamu
    const docRef = doc(db, "guests", guest.id);
    await updateDoc(docRef, {
      lastNotification: {
        title,
        message,
        type,
        sentAt: new Date(),
      },
    });

    return true;
  } catch (err) {
    console.error("Gagal mengirim notifikasi ke tamu:", err);
    throw err;
  }
};

// Admin mengirim notifikasi broadcast ke semua tamu terdaftar (atau yang aktifkan notif)
export const broadcastNotification = async (guests, { title, message, type = "broadcast" }) => {
  try {
    // Simpan dokumen notifikasi global
    await addDoc(collection(db, "notifications"), {
      guestId: "ALL",
      title,
      message,
      type,
      createdAt: new Date(),
    });

    // Update notifikasi terakhir ke setiap tamu agar listener mereka langsung memicu notifikasi di HP
    const updates = guests.map(async (g) => {
      try {
        const docRef = doc(db, "guests", g.id);
        await updateDoc(docRef, {
          lastNotification: {
            title,
            message,
            type,
            sentAt: new Date(),
          },
        });
      } catch (e) {
        console.error(`Gagal update tamu ${g.name}:`, e);
      }
    });

    await Promise.all(updates);
    return true;
  } catch (err) {
    console.error("Gagal mengirim broadcast notifikasi:", err);
    throw err;
  }
};

// Listener Real-time di HP Tamu: Menunggu notifikasi dari Admin atau Perubahan Jam
export const listenToGuestNotifications = (guestId, onNewNotification) => {
  if (!guestId) return () => {};

  const sessionStartTime = Date.now();

  // Dengarkan notifikasi untuk tamu ini atau broadcast "ALL"
  const q = query(
    collection(db, "notifications"),
    where("guestId", "in", [guestId, "ALL"])
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().getTime() : Date.now();

          // Hanya picu notifikasi jika pesan dibuat setelah sesi ini aktif (agar tidak mengulang riwayat lama saat refresh)
          if (createdAt >= sessionStartTime - 3000) {
            onNewNotification({
              id: change.doc.id,
              ...data,
            });
          }
        }
      });
    },
    (err) => {
      console.warn("Gagal mendengarkan koleksi notifications:", err);
    }
  );

  return unsubscribe;
};

// Fitur Pengingat Otomatis Berdasarkan Waktu (Pagi / Siang Menjelang 13:30)
export const checkAndTriggerDailyReminder = (guest, eventTime) => {
  if (!guest || Notification.permission !== "granted") return;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const reminderKey = `reminder_sent_${guest.id}_${todayStr}`;

  if (localStorage.getItem(reminderKey)) {
    return; // Sudah pernah dikirim hari ini
  }

  const hour = now.getHours();

  // Pagi hari (07:00 - 11:00) atau Siang menjelang open house (11:00 - 13:30)
  if (hour >= 7 && hour < 14) {
    const timeInfo = eventTime || "13:30 siang";
    showDeviceNotification("🔔 Pengingat Open House Kamar 201", {
      body: `Halo ${guest.name}! Jangan lupa hadir di Open House Kamar 201 (${timeInfo}). Kami siap menyambut Anda!`,
      tag: "scheduled-reminder",
    });
    localStorage.setItem(reminderKey, "sent");
  }
};
