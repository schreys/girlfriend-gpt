"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceControlsProps {
  isRecording: boolean;
  isLoadingAiResponse: boolean;
  isAiSpeaking: boolean;
  onToggleRecording: () => void;
  isSpeechRecognitionSupported: boolean;
  isSpeechSynthesisSupported: boolean;
}

const VoiceControls: FC<VoiceControlsProps> = ({
  isRecording,
  isLoadingAiResponse,
  isAiSpeaking,
  onToggleRecording,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported
}) => {
  const isDisabled = isLoadingAiResponse || isAiSpeaking || !isSpeechRecognitionSupported || !isSpeechSynthesisSupported;

  let buttonText = 'Start Talking';
  let ButtonIcon = Mic;

  if (isRecording) {
    buttonText = 'Stop Recording';
    ButtonIcon = MicOff;
  } else if (isLoadingAiResponse) {
    buttonText = 'Processing...';
    ButtonIcon = Loader2;
  } else if (isAiSpeaking) {
    buttonText = 'Speaking...';
    ButtonIcon = Volume2;
  }

  const getTooltipText = () => {
    if (!isSpeechRecognitionSupported) return "Speech recognition not supported by your browser.";
    if (!isSpeechSynthesisSupported) return "Speech synthesis not supported by your browser.";
    if (isLoadingAiResponse) return "Waiting for response...";
    if (isAiSpeaking) return "Girlfriend is speaking...";
    return isRecording ? "Click to stop recording" : "Click to start talking";
  }

  return (
    <div className="mt-4 flex flex-col items-center p-4 border-t">
      <Button
        onClick={onToggleRecording}
        disabled={isDisabled && !isRecording} // Allow stopping recording even if AI is speaking/loading
        className="w-full max-w-xs h-14 text-lg rounded-full shadow-lg transition-all duration-150 ease-in-out
                   hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                   disabled:opacity-70 disabled:cursor-not-allowed"
        variant={isRecording ? "destructive" : "default"}
        aria-label={buttonText}
        title={getTooltipText()}
      >
        <ButtonIcon className={cn("mr-2 h-6 w-6", (isLoadingAiResponse || isAiSpeaking) && "animate-pulse")} />
        {buttonText}
      </Button>
      {!isSpeechRecognitionSupported && <p className="text-xs text-destructive mt-2">Voice input is not supported on your browser.</p>}
      {!isSpeechSynthesisSupported && <p className="text-xs text-destructive mt-2">Voice output is not supported on your browser.</p>}
    </div>
  );
};

export default VoiceControls;
