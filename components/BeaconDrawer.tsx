'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClient } from '../lib/client-context';

interface BeaconDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  sender: 'USER' | 'BEACON';
  text: string;
  structuredResponse?: {
    facts: string;
    interpretation: string;
    recommendation: string;
    handoffRoute?: string;
    handoffLabel?: string;
  };
}

export default function BeaconDrawer({ isOpen, onClose, initialPrompt }: BeaconDrawerProps) {
  const router = useRouter();
  const { activeClient } = useClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendQuery(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const handleSendQuery = (queryText: string) => {
    if (!queryText.trim() || !activeClient) return;

    const userMsg: Message = { sender: 'USER', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    setTimeout(() => {
      let beaconResponse: Message;

      if (!activeClient.is_certified) {
        beaconResponse = {
          sender: 'BEACON',
          text: `NO CERTIFIED SIGNALS AVAILABLE FOR ${activeClient.name.toUpperCase()}`,
          structuredResponse: {
            facts: `Active client (${activeClient.name}) is operating on an uncertified baseline with missing integration mappings.`,
            interpretation: `Beacon cannot synthesize performance trends without verified provider telemetry.`,
            recommendation: `Configure required provider mappings in Connection Center to activate Beacon intelligence.`,
            handoffRoute: `/connection-center`,
            handoffLabel: `Open Connection Center →`,
          },
        };
      } else if (queryText.toLowerCase().includes('calls') || queryText.toLowerCase().includes('grow')) {
        beaconResponse = {
          sender: 'BEACON',
          text: `Analysis for ${activeClient.name} Phone Calls & Lead Telemetry:`,
          structuredResponse: {
            facts: `Phone calls are currently at 124 calls/month (+8.5% vs prior period). Blended CPL is $34.15.`,
            interpretation: `Local Search rank stability in top ZIP nodes (#3.4 avg) is driving consistent call volume. Paid Media contributes 32% of total calls.`,
            recommendation: `To increase calls by +15%, run a Goal Planner simulation in Opportunity Lab.`,
            handoffRoute: `/outcome-lab`,
            handoffLabel: `Open Goal Planner in Opportunity Lab →`,
          },
        };
      } else if (queryText.toLowerCase().includes('paid') || queryText.toLowerCase().includes('cpl')) {
        beaconResponse = {
          sender: 'BEACON',
          text: `Paid Acquisition Analysis for ${activeClient.name}:`,
          structuredResponse: {
            facts: `Google Ads spend is $3,250.00 (98 conversions, $33.16 CPL). Meta Ads spend is $1,600.00 (44 leads, $36.36 CPL).`,
            interpretation: `Google Ads cost per conversion is 8.8% more efficient than Meta Ads lead forms.`,
            recommendation: `Shift $300/mo budget from Meta Ads top-of-funnel reach to high-intent Google Search campaigns.`,
            handoffRoute: `/paid-media`,
            handoffLabel: `Review Paid Media Workspace →`,
          },
        };
      } else {
        beaconResponse = {
          sender: 'BEACON',
          text: `System Telemetry Summary for ${activeClient.name}:`,
          structuredResponse: {
            facts: `All 8 primary connectors are live and synchronized for ${activeClient.name}.`,
            interpretation: `Local SERP map pack rank is position #3.4. Overall visibility score is 38.2% Share of Voice.`,
            recommendation: `Maintain current search campaign budget and monitor weekly OtterWatch SERP grid updates.`,
            handoffRoute: `/command-center`,
            handoffLabel: `Return to Command Center →`,
          },
        };
      }

      setMessages((prev) => [...prev, beaconResponse]);
      setThinking(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-[#111622] border-l border-[#A9C7E5]/20 h-full flex flex-col justify-between shadow-2xl font-mono text-xs">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#A9C7E5]/10 flex justify-between items-center bg-[#151D2A]">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🦉</span>
            <div>
              <h3 className="font-bold text-white uppercase text-sm">BEACON AI ASSISTANT</h3>
              <span className="text-[10px] text-slate-400 block">
                CLIENT CONTEXT: <strong className="text-white">{activeClient?.name}</strong>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Message History Container */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.sender === 'USER'
                  ? 'bg-[#151D2A] text-white border border-[#A9C7E5]/10 ml-8'
                  : 'bg-[#0B0F17] text-slate-200 border border-[#D99614]/30 mr-4 space-y-2'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                {msg.sender === 'USER' ? 'YOU' : 'BEACON AI'}
              </div>
              <p className="font-sans text-xs">{msg.text}</p>

              {msg.structuredResponse && (
                <div className="space-y-2 pt-2 border-t border-[#A9C7E5]/10 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">OBSERVED FACTS:</span>
                    <span className="text-white">{msg.structuredResponse.facts}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">INTERPRETATION:</span>
                    <span className="text-slate-300">{msg.structuredResponse.interpretation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block">RECOMMENDED ACTION:</span>
                    <span className="text-emerald-400 font-bold">{msg.structuredResponse.recommendation}</span>
                  </div>
                  {msg.structuredResponse.handoffRoute && (
                    <button
                      onClick={() => {
                        onClose();
                        router.push(msg.structuredResponse!.handoffRoute!);
                      }}
                      className="mt-2 w-full py-1.5 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-bold rounded transition-all text-center"
                    >
                      {msg.structuredResponse.handoffLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="p-3 bg-[#0B0F17] rounded border border-[#A9C7E5]/10 text-slate-400 italic text-xs">
              Beacon is querying client telemetry...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#A9C7E5]/10 bg-[#151D2A]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery(input);
            }}
            className="flex space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask Beacon about ${activeClient?.name || 'active client'}...`}
              className="flex-1 bg-[#0B0F17] border border-[#A9C7E5]/20 rounded px-3 py-2 text-white focus:outline-none focus:border-[#D99614] font-mono text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-bold rounded transition-all"
            >
              SEND
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
