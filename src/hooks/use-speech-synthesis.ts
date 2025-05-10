"use client";

import { useState, useEffect, useCallback } from 'react';

interface SpeechSynthesisHook {
  isSpeaking: boolean;
  speak: (text: string, language: string) => void;
  cancelSpeaking: () => void;
  error: string | null;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    }
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);
      populateVoiceList();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoiceList;
      }
    } else {
      setIsSupported(false);
      setError('Speech synthesis is not supported in this browser.');
    }
  }, [populateVoiceList]);


  useEffect(() => {
    if (!utterance) return;

    const handleEnd = () => setIsSpeaking(false);
    const handleError = (event: SpeechSynthesisErrorEvent) => {
      setError(event.error);
      setIsSpeaking(false);
    };

    utterance.addEventListener('end', handleEnd);
    utterance.addEventListener('error', handleError);

    return () => {
      utterance.removeEventListener('end', handleEnd);
      utterance.removeEventListener('error', handleError);
    };
  }, [utterance]);

  const speak = useCallback((text: string, language: string) => {
    if (!isSupported || isSpeaking) return;

    const newUtterance = new SpeechSynthesisUtterance(text);
    const langCode = language === 'dutch' ? 'nl-NL' : 'en-US';
    
    const selectedVoice = voices.find(voice => voice.lang.startsWith(langCode.substring(0,2)) && voice.name.includes('Female')) || voices.find(voice => voice.lang.startsWith(langCode.substring(0,2))) || voices.find(voice => voice.default && voice.lang.startsWith(langCode.substring(0,2)));
    
    if (selectedVoice) {
      newUtterance.voice = selectedVoice;
    }
    newUtterance.lang = selectedVoice ? selectedVoice.lang : langCode; // Fallback to langCode if specific voice not found for precise sub-locale

    setError(null);
    try {
      window.speechSynthesis.speak(newUtterance);
      setUtterance(newUtterance);
      setIsSpeaking(true);
    } catch (e) {
      setError('Failed to speak: ' + (e as Error).message);
      setIsSpeaking(false);
    }
  }, [isSupported, isSpeaking, voices]);

  const cancelSpeaking = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported, isSpeaking]);

  return { isSpeaking, speak, cancelSpeaking, error, isSupported, voices };
};

export default useSpeechSynthesis;
