"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  PhoneCall,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CallStatus =
  | "IDLE"
  | "DIALING"
  | "QUEUED"
  | "CONNECTED"
  | "COMPLETED"
  | "FAILED";

interface CallTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CallTutorModal({ isOpen, onClose }: CallTutorModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [topic, setTopic] = useState("");
  const [callStatus, setCallStatus] = useState<CallStatus>("IDLE");
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartCall = async () => {
    if (!phoneNumber.trim()) return;

    try {
      setCallStatus("DIALING");
      setError(null);

      const res = await fetch("/api/voice/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber.trim(),
          topic: topic.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Call failed: ${res.status}`);
      }

      const data = await res.json();
      setCallId(data.call_id);
      setCallStatus("QUEUED");

      // Simulate status progression (in production, poll the status endpoint)
      setTimeout(() => setCallStatus("CONNECTED"), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to start call");
      setCallStatus("FAILED");
    }
  };

  const handleClose = () => {
    setPhoneNumber("");
    setTopic("");
    setCallStatus("IDLE");
    setCallId(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border/40 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 rounded-xl">
                <PhoneCall className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Call your AI Tutor</h3>
                <p className="text-xs text-muted-foreground">
                  AI-assisted phone call
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {callStatus === "IDLE" || callStatus === "FAILED" ? (
            <>
              {/* Phone number input */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-muted/40 text-sm rounded-xl px-4 py-3 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Topic (optional)
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Explain deadlock detection..."
                    className="w-full bg-muted/40 text-sm rounded-xl px-4 py-3 border border-border/40 focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-3 px-3 py-2 text-xs bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[10px] text-muted-foreground mb-4">
                This will place an AI-assisted phone call. Standard call rates
                may apply.
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border/40 hover:bg-muted/40 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartCall}
                  disabled={!phoneNumber.trim()}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Start AI Call
                </button>
              </div>
            </>
          ) : (
            /* Call in progress */
            <div className="text-center py-6">
              {callStatus === "DIALING" || callStatus === "QUEUED" ? (
                <>
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">
                    {callStatus === "DIALING"
                      ? "Placing call..."
                      : "Connecting to AI Tutor..."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Calling {phoneNumber}
                  </p>
                </>
              ) : callStatus === "CONNECTED" ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-green-400">
                    AI Tutor Connected
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your phone should be ringing
                  </p>
                </>
              ) : null}

              <button
                onClick={handleClose}
                className="mt-5 px-6 py-2 text-sm rounded-xl border border-border/40 hover:bg-muted/40 transition-all"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
