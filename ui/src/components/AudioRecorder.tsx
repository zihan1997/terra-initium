import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Store as Stop, Upload, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  questionId: number;
  question: string;
  correctAnswer: string;
  gptToken?: string;
  onAudioSubmit?: (audio: Blob) => void;
  isSubmitting?: boolean;
  aiScore?: number;
  aiExplanation?: string;
}

export function AudioRecorder({ 
  questionId, 
  question, 
  correctAnswer, 
  gptToken,
  onAudioSubmit,
  isSubmitting = false,
  aiScore,
  aiExplanation
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        }
        
        setHasRecording(true);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (audioRef.current && hasRecording) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    }
  };

  const submitAudio = async () => {
    if (!hasRecording || !audioChunksRef.current.length) return;
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    
    try {
      // Create FormData to send audio with question data
      const formData = new FormData();
      formData.append('audio', audioBlob, `question_${questionId}.wav`);
      formData.append('question', question);
      formData.append('correctAnswer', correctAnswer);
      formData.append('questionId', questionId.toString());
      
      // Include GPT token if available
      if (gptToken) {
        formData.append('gptToken', gptToken);
      }
      
      // Call the onAudioSubmit callback if provided
      if (onAudioSubmit) {
        onAudioSubmit(audioBlob);
      }
      
      // Here you would typically send to your backend
      // const response = await fetch('/api/evaluate-answer', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${gptToken}`,
      //   },
      //   body: formData
      // });
      // const result = await response.json();
      
    } catch (error) {
      console.error('Error submitting audio:', error);
      alert('Error submitting audio. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Record Your Answer</h4>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isSubmitting}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Mic className="w-4 h-4" />
            Record
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            <MicOff className="w-4 h-4" />
            Stop
          </button>
        )}
        
        {hasRecording && !isRecording && (
          <>
            <button
              onClick={playRecording}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPlaying ? <Stop className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            
            <button
              onClick={submitAudio}
              disabled={isSubmitting || !gptToken}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={!gptToken ? "Please add your GPT token in settings first" : ""}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit for AI'}
            </button>
          </>
        )}
        
      </div>
      
      {hasRecording && !gptToken && (
        <div className="text-xs text-amber-600 mt-2">
          ⚠️ Add your GPT token in settings to enable AI scoring
        </div>
      )}
      
      <audio ref={audioRef} className="hidden" />
      
      {aiScore !== undefined && (
        <div className="p-3 bg-green-50 border border-green-200 rounded mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">AI Evaluation Complete</span>
            <span className="text-base font-bold text-green-600">{aiScore}/5</span>
          </div>
          {aiExplanation && (
            <div className="text-xs text-green-700 bg-white p-2 rounded border border-green-100">
              <strong>Feedback:</strong> {aiExplanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}