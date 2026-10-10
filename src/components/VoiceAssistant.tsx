'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, VolumeX, Sparkles, X, AlertCircle, Globe } from 'lucide-react';

interface VoiceAssistantProps {
  onNavigateToInvoice: () => void;
  onScrollToSection: (sectionId: string) => void;
}

type LangOption = 'en-IN' | 'hi-IN' | 'hinglish';

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onNavigateToInvoice,
  onScrollToSection,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [selectedLang, setSelectedLang] = useState<LangOption>('en-IN');

  const recognitionRef = useRef<any>(null);

  const getRecognitionLang = (lang: LangOption) => {
    if (lang === 'hi-IN') return 'hi-IN';
    return 'en-IN'; // Default for en-IN and Hinglish browser speech API
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getRecognitionLang(selectedLang);

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access or use text input.');
        } else {
          setError(`Voice recognition error (${event.error}). Try using text input.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLang]);

  const speakText = (text: string, langCode: string = 'en-IN') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop ongoing speech

    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.rate = 1.0;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetPrefix = langCode.slice(0, 2); // 'hi' or 'en'
      const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = langCode;
      }
    } else {
      utterance.lang = langCode;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const processCommand = async (commandText: string) => {
    if (!commandText.trim()) return;

    const lower = commandText.toLowerCase().trim();
    setTranscript(commandText);
    setError(null);

    // Command Intent Detection (English, Hindi & Hinglish variations)
    const isSalesCmd =
      lower.includes('sale') ||
      lower.includes('sales') ||
      lower.includes('bikri') ||
      lower.includes('bikree') ||
      lower.includes('batao sales');

    const isExpenseCmd =
      lower.includes('expense') ||
      lower.includes('kharch') ||
      lower.includes('kharcha') ||
      lower.includes('kharchae');

    const isProfitCmd =
      lower.includes('profit') ||
      lower.includes('margin') ||
      lower.includes('munafa') ||
      lower.includes('faida');

    const isInvoiceCmd =
      lower.includes('invoice') ||
      lower.includes('bill') ||
      lower.includes('banao bill') ||
      lower.includes('kholo invoice');

    // Execution & Multilingual Audio Response
    if (isInvoiceCmd) {
      const msg =
        selectedLang === 'hi-IN'
          ? 'GST Invoice Generator khol raha hoon...'
          : 'Opening Invoice Generator...';
      setReply(msg);
      speakText(msg, selectedLang === 'hi-IN' ? 'hi-IN' : 'en-IN');
      onNavigateToInvoice();
      return;
    }

    if (isSalesCmd) {
      const msg =
        selectedLang === 'hi-IN'
          ? 'Sales aur Products breakdown par jaa rahe hain...'
          : 'Navigating to Sales & Channel Breakdown...';
      setReply(msg);
      speakText(msg, selectedLang === 'hi-IN' ? 'hi-IN' : 'en-IN');
      onScrollToSection('products-section');
      return;
    }

    if (isExpenseCmd) {
      const msg =
        selectedLang === 'hi-IN'
          ? 'Operating Expense breakdown dikha raha hoon...'
          : 'Navigating to Operating Expense Breakdown...';
      setReply(msg);
      speakText(msg, selectedLang === 'hi-IN' ? 'hi-IN' : 'en-IN');
      onScrollToSection('expense-section');
      return;
    }

    if (isProfitCmd) {
      const msg =
        selectedLang === 'hi-IN'
          ? 'Financial Profit KPIs dikha raha hoon...'
          : 'Navigating to Financial Profit KPIs...';
      setReply(msg);
      speakText(msg, selectedLang === 'hi-IN' ? 'hi-IN' : 'en-IN');
      onScrollToSection('kpi-section');
      return;
    }

    // 2. Query Grounded Ask AI backend for custom business questions
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: commandText }),
      });

      if (!res.ok) throw new Error('AI service error');

      const data = await res.json();
      const answerText = data.answer || 'I processed your question successfully.';
      setReply(answerText);
      speakText(answerText.slice(0, 200), selectedLang === 'hi-IN' ? 'hi-IN' : 'en-IN');
    } catch (err: any) {
      const fallbackMsg =
        selectedLang === 'hi-IN'
          ? 'Kshama karein, main abhi is prashna ka uttar nahi de pa raha hoon.'
          : 'Sorry, I could not complete the request right now.';
      setReply(fallbackMsg);
      speakText(fallbackMsg, selectedLang === 'hi-IN' ? 'hi-IN' : 'en-IN');
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setReply('');
    try {
      recognitionRef.current.lang = getRecognitionLang(selectedLang);
      recognitionRef.current.start();
    } catch (e) {
      // Already active
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript) {
        processCommand(transcript);
      }
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-2xl shadow-sky-500/40 hover:scale-105 transition-all ring-2 ring-white/20 flex items-center gap-2 group print:hidden"
        title="Open Multilingual Voice Assistant"
      >
        <Mic className="h-6 w-6 animate-pulse" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold">
          Voice Assistant
        </span>
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-sky-500/30 shadow-2xl p-6 space-y-5 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Arthik Voice Assistant</h3>
                  <p className="text-[10px] text-slate-400">Multilingual Voice Commands & Audio Feedback</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Language Selector Bar */}
            <div className="flex items-center justify-between bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                <Globe className="h-4 w-4 text-sky-400 shrink-0" />
                <span>Voice Language:</span>
              </div>

              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value as LangOption)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="en-IN">English (India) [en-IN]</option>
                <option value="hi-IN">हिन्दी (Hindi) [hi-IN]</option>
                <option value="hinglish">Hinglish (Hindi/English mix)</option>
              </select>
            </div>

            {selectedLang === 'hinglish' && (
              <p className="text-[10px] text-sky-300/80 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20">
                💡 <strong>Hinglish note:</strong> Uses dual browser recognition (en-IN/hi-IN). Commands like <em>"Mera sales dikhao"</em> or <em>"Expenses kitne hain"</em> are fully recognized.
              </p>
            )}

            {/* Predefined Commands Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Sample Voice & Text Commands:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  selectedLang === 'hi-IN' ? 'Sales dikhao' : 'Show sales',
                  selectedLang === 'hi-IN' ? 'Kharcha dikhao' : 'Show expenses',
                  selectedLang === 'hi-IN' ? 'Munafa dikhao' : 'Show profit',
                  selectedLang === 'hi-IN' ? 'Invoice generator kholo' : 'Open invoice generator',
                  'Mera sales dikhao',
                  'Mere expenses kitne hain',
                ].map((cmd, i) => (
                  <span
                    key={i}
                    onClick={() => processCommand(cmd)}
                    className="cursor-pointer text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    “{cmd}”
                  </span>
                ))}
              </div>
            </div>

            {/* Mic Recording Area */}
            <div className="flex flex-col items-center justify-center py-6 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3 text-center">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-bounce ring-4 ring-rose-500/30'
                    : 'bg-sky-500 hover:bg-sky-400 text-white ring-2 ring-sky-500/20'
                }`}
              >
                {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </button>
              <span className="text-xs font-semibold text-slate-300">
                {isListening
                  ? `Listening in ${selectedLang === 'hi-IN' ? 'Hindi' : 'English/Hinglish'}... Speak now`
                  : 'Click microphone to start listening'}
              </span>
              {transcript && (
                <p className="text-xs text-sky-300 font-medium px-4 py-1.5 bg-sky-500/10 rounded-lg max-w-sm">
                  "{transcript}"
                </p>
              )}
            </div>

            {/* Reply Area */}
            {reply && (
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 text-[10px] text-slate-400">
                  <span className="font-bold text-slate-200">Assistant Response</span>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <VolumeX className="h-3 w-3" /> Stop Audio
                    </button>
                  )}
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-line text-xs">{reply}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Fallback Text Input */}
            <form
              onSubmit={e => {
                e.preventDefault();
                processCommand(textInput);
                setTextInput('');
              }}
              className="flex gap-2 pt-2 border-t border-slate-800"
            >
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder={
                  selectedLang === 'hi-IN'
                    ? 'Aapna prashna ya aadesh yahan type karein...'
                    : 'Or type your command or question here...'
                }
                className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-400 text-white"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
