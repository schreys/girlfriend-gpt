
"use client";

import { useState, useEffect, useCallback } from 'react';
import { generateResponse, type GenerateResponseInput, type GenerateResponseOutput } from '@/ai/flows/generate-response';
import ConversationSettings from '@/components/girlfriend-gpt/ConversationSettings';
import ConversationLog from '@/components/girlfriend-gpt/ConversationLog';
import VoiceControls from '@/components/girlfriend-gpt/VoiceControls';
import { type Message } from '@/components/girlfriend-gpt/ChatBubble';
import useSpeechRecognition from '@/hooks/use-speech-recognition';
import useSpeechSynthesis from '@/hooks/use-speech-synthesis';
import { useToast } from '@/hooks/use-toast';
import { Bot } from 'lucide-react'; // Using Bot icon for app title

export default function GirlfriendGPTPage() {
  const [girlfriendName, setGirlfriendName] = useState<string>('Ava');
  const [language, setLanguage] = useState<'english' | 'dutch'>('english');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingAiResponse, setIsLoadingAiResponse] = useState(false);

  const { toast } = useToast();

  const {
    isListening: isRecording,
    transcript,
    startListening,
    stopListening,
    error: recognitionError,
    isSupported: isSpeechRecognitionSupported,
    clearTranscript: clearSpeechRecognitionTranscript,
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
      if (isAiSpeaking) cancelSpeaking(); // Stop AI speaking if user wants to talk
      startListening(language);
    }
  }, [isRecording, startListening, stopListening, language, isSpeechRecognitionSupported, toast, isAiSpeaking, cancelSpeaking]);

  // Process recognized speech
  useEffect(() => {
    const trimmedTranscript = transcript.trim();

    if (!isRecording && trimmedTranscript) {
      addMessage('user', trimmedTranscript);
      setIsLoadingAiResponse(true);
      
      // Clear the transcript from the hook immediately after capturing its value
      // to prevent re-processing on subsequent effect runs.
      clearSpeechRecognitionTranscript();

      const aiInput: GenerateResponseInput = {
        spokenInput: trimmedTranscript,
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
    }
  }, [
    isRecording, 
    transcript, 
    language, 
    girlfriendName, 
    speak, 
    toast, 
    isSpeechSynthesisSupported, 
    addMessage, 
    clearSpeechRecognitionTranscript
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
        <section className="md:w-2/5 lg:w-1/3 xl:w-1/4 md:sticky md:top-24 md:self-start"> {/* Sticky settings panel */}
          <ConversationSettings
            name={girlfriendName}
            onNameChange={setGirlfriendName}
            language={language}
            onLanguageChange={(lang) => {
              setLanguage(lang);
              if(isAiSpeaking) cancelSpeaking(); // Stop speaking if language changes
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
          />
        </section>
      </main>
    </div>
  );
}
