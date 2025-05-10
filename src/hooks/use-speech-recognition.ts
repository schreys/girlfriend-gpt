// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: (language: string) => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        setIsSupported(true);
        const newRecognition = new SpeechRecognitionAPI();
        newRecognition.continuous = true;
        newRecognition.interimResults = true;
        setRecognition(newRecognition);
      } else {
        setIsSupported(false);
        setError('Speech recognition is not supported in this browser.');
      }
    }
  }, []);

  const handleResult = useCallback((event: SpeechRecognitionEvent) => {
    let interimTranscript = '';
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    setTranscript(finalTranscript || interimTranscript);
  }, []);

  const handleError = useCallback((event: SpeechRecognitionErrorEvent) => {
    setError(event.error);
    setIsListening(false);
  }, []);

  const handleEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    return () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('error', handleError);
      recognition.removeEventListener('end', handleEnd);
      if (isListening) {
        recognition.stop();
      }
    };
  }, [recognition, handleResult, handleError, handleEnd, isListening]);

  const startListening = useCallback((language: string) => {
    if (recognition && !isListening) {
      recognition.lang = language === 'dutch' ? 'nl-NL' : 'en-US';
      setTranscript('');
      setError(null);
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        setError('Failed to start recognition: ' + (e as Error).message);
        setIsListening(false);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  return { isListening, transcript, startListening, stopListening, error, isSupported };
};

export default useSpeechRecognition;
