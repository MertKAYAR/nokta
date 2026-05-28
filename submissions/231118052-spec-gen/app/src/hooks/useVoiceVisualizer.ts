import { useState, useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export interface AudioAnalysis {
  rms: number;          // 0-1 overall volume
  bars: number[];       // FFT bars (0-1 each)
  isActive: boolean;
  isSpeaking: boolean;
}

const NUM_BARS = 32;
const SILENCE_THRESHOLD = 0.02;
const SAMPLE_RATE = 50; // ms between samples

export function useVoiceVisualizer() {
  const [analysis, setAnalysis] = useState<AudioAnalysis>({
    rms: 0,
    bars: new Array(NUM_BARS).fill(0),
    isActive: false,
    isSpeaking: false,
  });
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const smoothedBarsRef = useRef<number[]>(new Array(NUM_BARS).fill(0));

  // Smooth the bars for fluid animation
  const smoothBars = useCallback((raw: number[], decay = 0.7) => {
    const prev = smoothedBarsRef.current;
    const smoothed = raw.map((v, i) => {
      const s = Math.max(v, prev[i] * decay);
      return s;
    });
    smoothedBarsRef.current = smoothed;
    return smoothed;
  }, []);

  // Generate pseudo-FFT from metering data (expo-av doesn't expose raw FFT)
  const generateBars = useCallback((rms: number): number[] => {
    if (rms < SILENCE_THRESHOLD) {
      return new Array(NUM_BARS).fill(0);
    }

    const bars: number[] = [];
    for (let i = 0; i < NUM_BARS; i++) {
      // Model human voice frequency distribution
      // Lower frequencies (i < 8): fundamentals, strong
      // Mid (8-20): harmonics
      // High (20+): sibilance, weaker
      const freqWeight = i < 8 ? 1.2 : i < 20 ? 0.9 : 0.4;
      const noise = (Math.random() - 0.5) * 0.3;
      const phase = Math.sin(Date.now() * 0.002 + i * 0.5) * 0.2;
      const val = Math.max(0, Math.min(1,
        rms * freqWeight * 2.5 + noise * rms + phase * rms
      ));
      bars.push(val);
    }
    return bars;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Mikrofon izni verilmedi');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          extension: '.wav',
          sampleRate: 44100,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          extension: '.wav',
          sampleRate: 44100,
        },
        isMeteringEnabled: true,
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setAnalysis(prev => ({ ...prev, isActive: true }));

      // Poll metering data
      intervalRef.current = setInterval(async () => {
        try {
          const status = await recording.getStatusAsync();
          if (!status.isRecording) return;

          // metering is in dB (-160 to 0)
          const db = status.metering ?? -160;
          const rms = Math.max(0, Math.min(1, (db + 60) / 60));
          const isSpeaking = rms > SILENCE_THRESHOLD;
          const rawBars = generateBars(rms);
          const bars = smoothBars(rawBars);

          setAnalysis({ rms, bars, isActive: true, isSpeaking });
        } catch {
          // Recording might have stopped
        }
      }, SAMPLE_RATE);

    } catch (err) {
      console.error('Recording error:', err);
    }
  }, [generateBars, smoothBars]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const recording = recordingRef.current;
    if (!recording) return null;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setAnalysis({
        rms: 0,
        bars: new Array(NUM_BARS).fill(0),
        isActive: false,
        isSpeaking: false,
      });
      smoothedBarsRef.current = new Array(NUM_BARS).fill(0);
      return uri ?? null;
    } catch (err) {
      console.error('Stop recording error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    analysis,
    isRecording,
    startRecording,
    stopRecording,
  };
}
