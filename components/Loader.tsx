

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const MESSAGES = [
  "DETECTIVE AGENT: Scouring Reddit for horror stories...",
  "AUDITOR AGENT: Identifying hidden fees and software costs...",
  "INSIDER AGENT: Investigating affiliate kickback structures...",
  "STAT AGENT: Ignoring guru claims, finding real 2024 data...",
  "Synthesizing Forensic Dossier from 4 sources...",
  "Cross-referencing victim complaints...",
  "Structuring data for Y-It Engine...",
  "Calculating Ethical Risk Score...",
];

interface Props {
    customMessage?: string;
}

const Loader: React.FC<Props> = ({ customMessage }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!customMessage) {
        const interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    }
  }, [customMessage]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
            <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-yellow-500 animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-bold font-mono tracking-widest text-center animate-pulse">
          {customMessage || MESSAGES[msgIndex]}
        </h2>
        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-500 animate-loading-bar"></div>
        </div>
      </div>
      <style>{`
        @keyframes loading-bar {
            0% { width: 0%; transform: translateX(-100%); }
            50% { width: 50%; }
            100% { width: 100%; transform: translateX(100%); }
        }
        .animate-loading-bar {
            animation: loading-bar 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default Loader;