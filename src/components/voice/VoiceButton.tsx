"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  PhoneOff,
  Loader2,
  Volume2,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Room,
  RoomEvent,
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  ConnectionState,
  TranscriptionSegment,
} from "livekit-client";

export type VoiceState =
  | "IDLE"
  | "CONNECTING"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "DISCONNECTING"
  | "ERROR";

interface VoiceTranscriptEntry {
  speaker: "user" | "ai";
  text: string;
  timestamp: string;
  isFinal: boolean;
}

interface VoiceSessionProps {
  onTranscript?: (entry: VoiceTranscriptEntry) => void;
  onStateChange?: (state: VoiceState) => void;
  className?: string;
}

export function VoiceButton({
  onTranscript,
  onStateChange,
  className,
}: VoiceSessionProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("IDLE");
  const [transcripts, setTranscripts] = useState<VoiceTranscriptEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  const updateState = useCallback(
    (state: VoiceState) => {
      setVoiceState(state);
      onStateChange?.(state);
    },
    [onStateChange]
  );

  const addTranscript = useCallback(
    (entry: VoiceTranscriptEntry) => {
      setTranscripts((prev) => {
        // Replace interim transcripts from same speaker
        if (!entry.isFinal) {
          const withoutInterim = prev.filter(
            (t) => t.isFinal || t.speaker !== entry.speaker
          );
          return [...withoutInterim, entry];
        }
        // For final: remove interims from same speaker, add final
        const withoutInterim = prev.filter(
          (t) => t.isFinal || t.speaker !== entry.speaker
        );
        return [...withoutInterim, entry];
      });
      onTranscript?.(entry);
    },
    [onTranscript]
  );

  const connect = useCallback(async () => {
    try {
      updateState("CONNECTING");
      setError(null);

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from backend
      const res = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.detail || `Voice token request failed: ${res.status}`
        );
      }

      const { token, url, room_name } = await res.json();

      // Connect to LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Listen for connection state changes
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Disconnected) {
          updateState("IDLE");
        }
      });

      // Listen for agent transcriptions
      room.on(
        RoomEvent.TranscriptionReceived,
        (
          segments: TranscriptionSegment[],
          participant?: RemoteParticipant
        ) => {
          for (const seg of segments) {
            const isAgent = participant !== undefined;
            addTranscript({
              speaker: isAgent ? "ai" : "user",
              text: seg.text,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isFinal: seg.final,
            });

            if (isAgent && !seg.final) {
              updateState("SPEAKING");
            }
          }
        }
      );

      // Listen for agent track subscriptions (indicates agent is active)
      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: any,
          publication: RemoteTrackPublication,
          participant: RemoteParticipant
        ) => {
          if (track.kind === Track.Kind.Audio) {
            // Attach audio element for playback
            const el = track.attach();
            el.id = "agent-audio";
            document.body.appendChild(el);
          }
        }
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track: any) => {
          track.detach().forEach((el: HTMLMediaElement) => el.remove());
        }
      );

      await room.connect(url, token);

      // Publish microphone
      await room.localParticipant.setMicrophoneEnabled(true);

      updateState("LISTENING");
    } catch (err: any) {
      console.error("Voice connection failed:", err);
      setError(err.message || "Failed to connect voice");
      updateState("ERROR");
    }
  }, [updateState, addTranscript]);

  const disconnect = useCallback(async () => {
    updateState("DISCONNECTING");
    try {
      if (roomRef.current) {
        await roomRef.current.disconnect();
        roomRef.current = null;
      }
      // Remove any attached audio elements
      document.getElementById("agent-audio")?.remove();
    } catch (err) {
      console.error("Voice disconnect error:", err);
    }
    setTranscripts([]);
    updateState("IDLE");
  }, [updateState]);

  const toggleMute = useCallback(async () => {
    if (roomRef.current) {
      const newMuted = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  const isActive = voiceState !== "IDLE" && voiceState !== "ERROR";

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Voice Controls */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-2xl"
          >
            {/* Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    voiceState === "CONNECTING" && "bg-yellow-400 animate-pulse",
                    voiceState === "LISTENING" && "bg-green-400 animate-pulse",
                    voiceState === "THINKING" && "bg-blue-400 animate-pulse",
                    voiceState === "SPEAKING" && "bg-purple-400 animate-pulse",
                    voiceState === "DISCONNECTING" && "bg-gray-400"
                  )}
                />
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {voiceState === "CONNECTING" && "Connecting..."}
                  {voiceState === "LISTENING" && "Listening..."}
                  {voiceState === "THINKING" && "Thinking..."}
                  {voiceState === "SPEAKING" && "Tutor Speaking..."}
                  {voiceState === "DISCONNECTING" && "Disconnecting..."}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className={cn(
                    "p-1.5 rounded-lg transition-all text-xs",
                    isMuted
                      ? "bg-red-500/10 text-red-400"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isMuted ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={disconnect}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Transcript */}
            {transcripts.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs">
                {transcripts.slice(-6).map((t, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      !t.isFinal && "opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "font-semibold shrink-0",
                        t.speaker === "user"
                          ? "text-indigo-400"
                          : "text-purple-400"
                      )}
                    >
                      {t.speaker === "user" ? "You:" : "Tutor:"}
                    </span>
                    <span className="text-muted-foreground">{t.text}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {voiceState === "ERROR" && error && (
        <div className="mb-2 px-3 py-2 text-xs bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
          {error}
        </div>
      )}

      {/* Mic Button — renders inline next to Send */}
      <button
        type="button"
        onClick={isActive ? disconnect : connect}
        disabled={voiceState === "CONNECTING" || voiceState === "DISCONNECTING"}
        className={cn(
          "p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer",
          isActive
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
            : "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20",
          (voiceState === "CONNECTING" || voiceState === "DISCONNECTING") &&
            "opacity-50 cursor-not-allowed"
        )}
        title={isActive ? "End voice session" : "Start voice session"}
      >
        {voiceState === "CONNECTING" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isActive ? (
          <PhoneOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
