"use client";

/**
 * Galereya/kameradan olingan rasmni kichraytirib, data URL ko'rinishida
 * tayyorlaydi (oflayn va tezkor ishlash uchun bazada saqlanadi).
 */
export function fileToDataUrl(file: File, maxSize = 640, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasm formati qo'llab-quvvatlanmaydi"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const c = canvas.getContext("2d");
        if (!c) return reject(new Error("Canvas mavjud emas"));
        c.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const EMOJI_LIBRARY = [
  "🦁","🐘","🦋","🐢","🦜","🐬","🌵","🌻","🍎","🍜","🥐","🍉",
  "🏔️","🌊","🌋","🌈","🌙","☀️","⚡","❄️","🔥","💧",
  "🏠","🏘️","🏫","🏥","🚂","✈️","🚲","⛵","🛰️","🗺️",
  "📚","📖","✏️","🔤","🧮","🔬","🎧","🎸","🥁","🎨",
  "⚽","🏀","🏆","🥇","🛡️","⚖️","💡","🔑","🧭","⏰",
  "👩‍🏫","👨‍🍳","👩‍⚕️","🧑‍🚀","🤝","🧠","❤️","😀","🤔","🤫","😴","🥳",
];
