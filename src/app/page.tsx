
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
      if (isAiSpeaking) cancelSpeaking(); 
      startListening(language);
    }
  }, [isRecording, startListening, stopListening, language, isSpeechRecognitionSupported, toast, isAiSpeaking, cancelSpeaking]);

  const prevIsRecording = useRef(isRecording);

  useEffect(() => {
    // This effect runs when `isRecording` changes or other stable dependencies change.
    // It does NOT run when *only* `transcript` changes.

    if (prevIsRecording.current && !isRecording) {
      // This block executes exactly ONCE when `isRecording` transitions from true to false.
      const finalTranscript = transcript.trim(); // Read the *current* transcript value at this point.
      
      if (finalTranscript) {
        addMessage('user', finalTranscript);
        setIsLoadingAiResponse(true);
        
        // It's important to clear the transcript from the hook now,
        // so that if this effect were to run again (e.g. due to other dep changes)
        // while isRecording is still false, it won't reprocess an old transcript.
        // Also helps ensure next recording starts fresh.
        clearSpeechRecognitionTranscript();

        const aiInput: GenerateResponseInput = {
          spokenInput: finalTranscript,
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
    }

    // Update prevIsRecording for the next render.
    prevIsRecording.current = isRecording;

  }, [ 
    isRecording, // Primary trigger for this logic
    // `transcript` is deliberately omitted here to prevent re-runs on interim results.
    // The effect reads the latest `transcript` when `isRecording` transitions.
    language, 
    girlfriendName, 
    addMessage, 
    clearSpeechRecognitionTranscript, 
    speak, 
    isSpeechSynthesisSupported, 
    toast,
    setIsLoadingAiResponse 
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
