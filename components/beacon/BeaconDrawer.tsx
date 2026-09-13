"use client";
import React, { useState } from 'react';
import { Sparkles, X, Send, ShieldCheck } from 'lucide-react';
import { DecisionEngine } from '@/lib/decision-engine';

interface BeaconDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
}

export function BeaconDrawer({ isOpen, onClose, clientName }: BeaconDrawerProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'beacon'; text: string; dataCard?: any }>>([
    {
      sender: 'beacon',
      text: `Good afternoon. I am Beacon, your Decision Intelligence Assistant for ${clientName}. How can I help analyze or model your performance today?`
    }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setLoading(true);

    setTimeout(() => {
      const modelResult = DecisionEngine.modelForwardScenario([120, 125, 118, 130, 128], 1.25, "OtterWatch + Meta Ads Telemetry");

      setMessages((prev) => [
        ...prev,
        {
          sender: 'beacon',
          text: `Based on ${clientName}'s cross-channel historical telemetry, here is the statistical forecast for increasing local acquisition budget by 25%:`,
          dataCard: modelResult
        }
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-[#0E192B] border-l border-[#A9C7E5]/15 shadow-2xl z-50 flex flex-col justify-between font-sans">
      
      <div className="p-5 border-b border-[#A9C7E5]/10 flex justify-between items-center bg-[#08111F]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#F5A000]/10 border border-[#F5A000]/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-[#FFC44D]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F7FAFC] uppercase tracking-wider">BEACON INTELLIGENCE</h3>
            <p className="text-[10px] text-[#70839D] font-mono">Decision Assistant • {clientName}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[#70839D] hover:text-white p-1 rounded-md">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`p-3.5 rounded-xl text-xs leading-relaxed max-w-[85%] ${
              m.sender === 'user' 
                ? 'bg-[#F5A000] text-[#08111F] font-semibold' 
                : 'bg-[#08111F] border border-[#A9C7E5]/10 text-[#F7FAFC]'
            }`}>
              {m.text}
            </div>

            {m.dataCard && (
              <div className="mt-3 w-full bg-[#08111F] border border-[#A9C7E5]/15 rounded-xl p-4 space-y-3 font-mono">
                <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-2">
                  <span className="text-[10px] text-[#70839D] font-bold uppercase">FORECASTED OUTCOME</span>
                  <span className="text-[10px] font-bold text-[#FFC44D] bg-[#F5A000]/10 border border-[#F5A000]/30 px-2 py-0.5 rounded">
                    GRADE {m.dataCard.evidenceGrade}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#70839D] block">EXPECTED LIFT</span>
                    <span className="text-lg font-bold text-emerald-400">+{m.dataCard.expectedLiftPercent}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#70839D] block">CONFIDENCE</span>
                    <span className="text-lg font-bold text-[#55A9E6]">{m.dataCard.confidenceScore}%</span>
                  </div>
                </div>

                <div className="bg-[#0E192B] p-2.5 rounded border border-[#A9C7E5]/5 text-[11px] text-[#A9C7E5]">
                  <span className="text-[#70839D] block text-[9px] mb-1 uppercase font-bold">MODELED RANGE BOUNDS</span>
                  {m.dataCard.rangeMin} to {m.dataCard.rangeMax} conversions / mo
                </div>

                <div className="text-[10px] text-[#70839D] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Model Ver: {m.dataCard.modelVersion}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-xs text-[#70839D] font-mono animate-pulse">
            Calculating confidence bounds & correlation metrics...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-[#08111F] border-t border-[#A9C7E5]/10 flex gap-2">
        <input
          type="text"
          placeholder="Ask Beacon a scenario or target question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-[#0E192B] border border-[#A9C7E5]/15 rounded-lg px-3.5 py-2 text-xs text-[#F7FAFC] focus:outline-none focus:border-[#F5A000] placeholder-[#70839D]"
        />
        <button type="submit" className="bg-[#F5A000] hover:bg-[#FFC44D] text-[#08111F] font-bold px-3.5 py-2 rounded-lg text-xs transition-all flex items-center justify-center">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
