"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  textToRead: string;
  audioUrl?: string; // If actual recorded voice note exists
  lang?: string;
  className?: string;
}

export const VoiceAudioPlayer: React.FC<AudioPlayerProps> = ({
  textToRead,
  audioUrl,
  lang = "hi-IN",
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. If a real audio file exists, toggle HTML5 Audio
    if (audioUrl) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn("Audio playback failed:", err);
          setIsPlaying(false);
        });
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
      }
      return;
    }

    // 2. Fallback: Web Speech API Text-To-Speech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel(); // clear queue
        const cleanText = (textToRead || "").trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        utterance.rate = 0.95; // Clear government pacing
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);

        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  const hasContent = Boolean((audioUrl && audioUrl.length > 0) || (textToRead && textToRead.trim().length > 0));

  if (!hasContent) return null;

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition shadow-2xs cursor-pointer ${
        isPlaying
          ? "bg-[#001B2E] text-[#FFEFD3] border-[#001B2E] ring-2 ring-[#FFC49B]/50 animate-pulse"
          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300"
      } ${className}`}
      title="Listen to original citizen grievance description (Text-to-Speech)"
    >
      {isPlaying ? (
        <>
          <VolumeX className="w-3.5 h-3.5 text-[#FFC49B]" />
          <span>Stop Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-[#294C60]" />
          <span>Listen to Issue</span>
        </>
      )}
    </button>
  );
};

export default VoiceAudioPlayer;
