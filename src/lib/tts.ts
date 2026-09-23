"use client";

/**
 * Sof ingliz tili aksenti (en-US) bilan talaffuz.
 * TZ bo'yicha: tezlik 0.45, tonallik 1.0.
 */
let voiceCache: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (voiceCache) return voiceCache;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred =
    voices.find((v) => /en[-_]US/i.test(v.lang) && /google|natural|samantha|alex/i.test(v.name)) ??
    voices.find((v) => /en[-_]US/i.test(v.lang)) ??
    voices.find((v) => /^en/i.test(v.lang)) ??
    null;
  voiceCache = preferred;
  return preferred;
}

export function primeVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  pickVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    voiceCache = null;
    pickVoice();
  };
}

export const ttsSupported = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}): void {
  if (!ttsSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang ?? "en-US";
  utter.rate = opts.rate ?? 0.45;
  utter.pitch = opts.pitch ?? 1.0;
  utter.volume = 1;
  synth.speak(utter);
}

/** Sekin (bo'g'inma-bo'g'in) talaffuz — spelling rejimi uchun. */
export function speakSlow(text: string) {
  speak(text, { rate: 0.3 });
}

export function stopSpeaking() {
  if (!ttsSupported()) return;
  window.speechSynthesis.cancel();
}

/** Qisqa UI ovoz effekti (WebAudio, tashqi faylsiz). */
let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  audioCtx = audioCtx ?? new AC();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

export function playTone(kind: "correct" | "wrong" | "coin" | "tap" | "win") {
  const ac = ctx();
  if (!ac) return;
  const now = ac.currentTime;
  const notes: Record<string, number[]> = {
    correct: [523.25, 659.25, 783.99],
    wrong: [233.08, 174.61],
    coin: [987.77, 1318.51],
    tap: [440],
    win: [523.25, 659.25, 783.99, 1046.5, 1318.51],
  };
  (notes[kind] ?? notes.tap).forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = kind === "wrong" ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(freq, now + i * 0.08);
    gain.gain.setValueAtTime(0.0001, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(kind === "wrong" ? 0.09 : 0.16, now + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.28);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.3);
  });
}
