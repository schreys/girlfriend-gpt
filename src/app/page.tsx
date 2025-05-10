
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { generateResponse, type GenerateResponseInput, type GenerateResponseOutput } from '@/ai/flows/generate-response';
import ConversationSettings from '@/components/girlfriend-gpt/ConversationSettings';
import ConversationLog from '@/components/girlfriend-gpt/ConversationLog';
import VoiceControls from '@/components/girlfriend-gpt/VoiceControls';
import { type Message } from '@/components/girlfriend-gpt/ChatBubble';
import useSpeechRecognition from '@/hooks/use-speech-recognition';
import useSpeechSynthesis from '@/hooks/use-speech-synthesis';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react';

export default function GirlfriendGPTPage() {
  const [girlfriendName, setGirlfriendName] = useState<string>('Ava');
  const [language, setLanguage] = useState<'english' | 'dutch'>('english');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');

  const { toast } = useToast();

  const {
    isListening: isRecording,
    startListening,
    stopListening,
    error: recognitionError,
    isSupported: isSpeechRecognitionSupported,
    clearTranscript: clearSpeechRecognitionTranscript,
    interimTranscript,
    finalTranscript,
  } = useSpeechRecognition();

  const {
    isSpeaking: isAiSpeaking,
    speak,
    cancelSpeaking,
    error: synthesisError,
    isSupported: isSpeechSynthesisSupported,
  } = useSpeechSynthesis();

  useEffect(() => {
    if (recognitionError) {
      toast({ title: 'Speech Recognition Error', description: recognitionError, variant: 'destructive' });
    }
  }, [recognitionError, toast]);

  useEffect(() => {
    if (synthesisError) {
      toast({ title: 'Speech Synthesis Error', description: synthesisError, variant: 'destructive' });
    }
  }, [synthesisError, toast]);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: crypto.randomUUID(), sender, text, timestamp: new Date() },
    ]);
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (!isSpeechRecognitionSupported) {
      toast({ title: 'Unsupported Feature', description: 'Speech recognition is not supported by your browser.', variant: 'destructive'});
      return;
    }
    if (isRecording) {
      stopListening();
    } else {
      if (isAiSpeaking) cancelSpeaking();
      setCurrentTranscript(''); 
      clearSpeechRecognitionTranscript();
      startListening(language);
    }
  }, [isRecording, startListening, stopListening, language, isSpeechRecognitionSupported, toast, isAiSpeaking, cancelSpeaking, clearSpeechRecognitionTranscript]);


  // Update currentTranscript with interim results for display
  useEffect(() => {
    if (isRecording && interimTranscript) {
      setCurrentTranscript(interimTranscript);
    }
  }, [isRecording, interimTranscript, setCurrentTranscript]);

  // Update currentTranscript with final results for display
  useEffect(() => {
    if (finalTranscript) { 
      setCurrentTranscript(finalTranscript);
    }
  }, [finalTranscript, setCurrentTranscript]);

  // Handle sending message when recording stops and finalTranscript is available
  useEffect(() => {
    if (!isRecording && finalTranscript && finalTranscript.trim() !== '') {
      const userMessage = finalTranscript.trim();
      addMessage('user', userMessage);
      setIsLoadingAiResponse(true);
      clearSpeechRecognitionTranscript(); 
      setCurrentTranscript(''); 

      const aiInput: GenerateResponseInput = {
        spokenInput: userMessage,
        language,
        girlfriendName,
      };

      generateResponse(aiInput)
        .then((output: GenerateResponseOutput) => {
          addMessage('ai', output.spokenResponse);
          if (isSpeechSynthesisSupported) {
            speak(output.spokenResponse, language);
          } else {
            toast({ title: 'Unsupported Feature', description: 'Speech synthesis is not supported. AI response shown as text.', variant: 'destructive'});
          }
        })
        .catch((error) => {
          console.error('AI Error:', error);
          toast({ title: 'AI Error', description: 'Could not get a response.', variant: 'destructive' });
          addMessage('ai', `Sorry, I encountered an error: ${error.message || 'Unknown error'}`);
        })
        .finally(() => {
          setIsLoadingAiResponse(false);
        });
    } else if (!isRecording && (!finalTranscript || finalTranscript.trim() === '')) {
      setCurrentTranscript('');
      clearSpeechRecognitionTranscript();
    }
  }, [
    isRecording,
    finalTranscript,
    language,
    girlfriendName,
    addMessage,
    clearSpeechRecognitionTranscript,
    speak,
    isSpeechSynthesisSupported,
    toast,
    setIsLoadingAiResponse,
    setCurrentTranscript 
  ]);


  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 shadow-md bg-card">
        <div className="container mx-auto flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">GirlfriendGPT</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row p-4 gap-6 container mx-auto overflow-hidden">
        <section className="md:w-2/5 lg:w-1/3 xl:w-1/4 md:sticky md:top-24 md:self-start">
          <ConversationSettings
            name={girlfriendName}
            onNameChange={setGirlfriendName}
            language={language}
            onLanguageChange={(lang) => {
              setLanguage(lang);
              if(isAiSpeaking) cancelSpeaking();
              if(isRecording) { 
                stopListening();
                setCurrentTranscript('');
                clearSpeechRecognitionTranscript();
                startListening(lang);
              }
            }}
          />
        </section>

        <section className="flex-grow flex flex-col bg-card rounded-lg shadow-lg overflow-hidden">
          <ConversationLog messages={messages} girlfriendName={girlfriendName} isLoadingAiResponse={isLoadingAiResponse} />
          <VoiceControls
            isRecording={isRecording}
            isLoadingAiResponse={isLoadingAiResponse}
            isAiSpeaking={isAiSpeaking}
            onToggleRecording={handleToggleRecording}
            isSpeechRecognitionSupported={isSpeechRecognitionSupported}
            isSpeechSynthesisSupported={isSpeechSynthesisSupported}
            currentTranscript={isRecording ? currentTranscript : ''}
          />
        </section>
      </main>
    </div>
  );
