import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Activity,
  BarChart2,
  ExternalLink,
  Radio,
  Sparkles,
  Info,
  Layers,
  Music,
  Share2
} from 'lucide-react';
import type { AnimalRecord, TaxonAudioItem } from '../../../types/taxonomy';
import { redactSpecimenText } from '../../../utils/taxonomicMysteryEngine';
import {
  globalAudioBus,
  type AudioPlaybackState
} from '../../../services/audioCoordinator';
import {
  resolveTaxonBioacoustics,
  type BioacousticResolution
} from '../../../services/bioacousticService';

export interface BioacousticVocalizationDeckProps {
  animal: AnimalRecord;
  className?: string;
  mysteryMode?: boolean;
}

export function BioacousticVocalizationDeck({
  animal,
  className = '',
  mysteryMode = false
}: BioacousticVocalizationDeckProps) {
  const [resolution, setResolution] = useState<BioacousticResolution | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeRecordingIdx, setActiveRecordingIdx] = useState<number>(0);
  const [audioState, setAudioState] = useState<AudioPlaybackState>(globalAudioBus.getState());
  const [visualizerMode, setVisualizerMode] = useState<'SPECTROGRAM' | 'OSCILLOGRAM'>('SPECTROGRAM');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 1. Resolve bioacoustics on animal.id change
  useEffect(() => {
    let isSubscribed = true;
    setIsLoading(true);
    setActiveRecordingIdx(0);

    resolveTaxonBioacoustics(animal)
      .then((res) => {
        if (!isSubscribed) return;
        setResolution(res);
      })
      .catch(() => {
        if (!isSubscribed) return;
        setResolution({
          status: 'UNDOCUMENTED',
          primaryAudio: null,
          recordings: [],
          scientificNote: 'Failed to query bioacoustic archives.'
        });
      })
      .finally(() => {
        if (isSubscribed) setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [animal.id]);

  // 2. Subscribe to global audio bus
  useEffect(() => {
    const unsubscribe = globalAudioBus.subscribe((state) => {
      setAudioState(state);
    });
    return unsubscribe;
  }, []);

  const activeRecording: TaxonAudioItem | null =
    resolution?.recordings[activeRecordingIdx] || resolution?.primaryAudio || null;

  const isCurrentTrackPlaying =
    audioState.isPlaying &&
    activeRecording !== null &&
    audioState.activeTrack?.audioUrl === activeRecording.audioUrl;

  // 3. 60fps Web Audio Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 64;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.fillStyle = '#060a09';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (visualizerMode === 'SPECTROGRAM') {
        globalAudioBus.getByteFrequencyData(freqData);

        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (freqData[i] / 255) * (height - 20);

          // Radiant Gradient: Amber (#f59e0b) to Emerald (#10b981)
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, '#f59e0b');
          gradient.addColorStop(0.6, '#eab308');
          gradient.addColorStop(1, '#10b981');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, height - barHeight - 4, barWidth - 2, barHeight + 4, [4, 4, 0, 0]);
          ctx.fill();

          x += barWidth;
          if (x > width) break;
        }
      } else {
        // OSCILLOGRAM MODE
        globalAudioBus.getByteTimeDomainData(timeData);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#10b981';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visualizerMode, isCurrentTrackPlaying]);

  // Audio Playback Controls
  const handleTogglePlay = useCallback(() => {
    if (!activeRecording) return;
    globalAudioBus.toggle(activeRecording);
  }, [activeRecording]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    globalAudioBus.seek(val);
  };

  const handleSpeedChange = (rate: number) => {
    globalAudioBus.setPlaybackRate(rate);
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 4. SCIENTIFIC INTEGRITY FALLBACK: Non-Vocal Organism
  if (resolution?.status === 'NON_VOCAL_ORGANISM') {
    return (
      <div className={`p-6 sm:p-8 rounded-xl bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 space-y-4 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-[#2E6F54] dark:text-emerald-400 font-bold tracking-wider">
          <Radio className="w-4 h-4" />
          <span>Bioacoustic Profile: Non-Vocal Organism</span>
        </div>
        <div className="p-4 rounded-xl bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#141816] dark:text-[#F2EFE9]">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Acoustically Silent Specimen</span>
          </div>
          <p className="text-xs text-[#5A625E] dark:text-[#949E99] leading-relaxed">
            {mysteryMode ? redactSpecimenText(resolution.scientificNote, animal) : resolution.scientificNote}
          </p>
        </div>
      </div>
    );
  }

  // 5. SCIENTIFIC INTEGRITY FALLBACK: Extinct Fossil Specimen
  if (resolution?.status === 'EXTINCT_PALEO_ACOUSTIC') {
    return (
      <div className={`p-6 sm:p-8 rounded-xl bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 space-y-4 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-[#D4A359] font-bold tracking-wider">
          <Radio className="w-4 h-4" />
          <span>Bioacoustic Profile: Prehistoric Fossil Lineage</span>
        </div>
        <div className="p-4 rounded-xl bg-[#F5F2EB] dark:bg-[#070A09] border border-[#141816]/10 dark:border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#141816] dark:text-[#F2EFE9]">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Paleo-Acoustics Inferred from Skeletal Morphology</span>
          </div>
          <p className="text-xs text-[#5A625E] dark:text-[#949E99] leading-relaxed">
            {mysteryMode ? redactSpecimenText(resolution.scientificNote, animal) : resolution.scientificNote}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-8 rounded-xl bg-[#EBE6DC]/35 dark:bg-[#0D1210]/60 border border-[#141816]/10 dark:border-white/10 space-y-6 transition-all ${className}`}>
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-700 dark:text-[#D4A359] font-bold tracking-wider">
            <Volume2 className="w-4 h-4" />
            <span>{mysteryMode ? 'Mystery Bioacoustic Clue' : 'Bioacoustic Vocalization Studio'}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white mt-1">
            {mysteryMode ? 'Bioacoustic Signature & Sonogram' : 'Wild Acoustic Resonance & Sonograms'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {mysteryMode
              ? 'Real-time 60fps frequency spectrum of the mystery specimen (identity redacted)'
              : 'Real-time 60fps frequency spectrum and pitch-shifted wildlife recordings'}
          </p>
        </div>

        {/* Visualizer Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setVisualizerMode('SPECTROGRAM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              visualizerMode === 'SPECTROGRAM'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>FFT Spectrogram</span>
          </button>
          <button
            onClick={() => setVisualizerMode('OSCILLOGRAM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
              visualizerMode === 'OSCILLOGRAM'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Oscillogram</span>
          </button>
        </div>
      </div>

      {/* Recording Type Selector Pills */}
      {resolution && resolution.recordings.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-400">Available Recordings:</span>
          {resolution.recordings.map((rec, idx) => (
            <button
              key={rec.audioUrl || idx}
              onClick={() => {
                setActiveRecordingIdx(idx);
                if (isCurrentTrackPlaying) {
                  globalAudioBus.play(rec);
                }
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                idx === activeRecordingIdx
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {mysteryMode
                ? `Vocalization Sample #${idx + 1}`
                : rec.recordingType || `Recording #${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* 60FPS REAL-TIME SPECTROGRAM CANVAS */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#060a09] shadow-inner aspect-[21/8] min-h-[140px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={700}
          height={200}
          className="w-full h-full object-cover block"
        />

        {/* Live Audio Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
          <span className="flex h-2 w-2 relative">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCurrentTrackPlaying ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isCurrentTrackPlaying ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur-sm">
            {isCurrentTrackPlaying ? 'Acoustic Stream Active' : 'Audio Bus Standby'}
          </span>
        </div>

        {/* Center Play Button Overlay on Standby */}
        {!isCurrentTrackPlaying && (
          <button
            onClick={handleTogglePlay}
            className="absolute inset-0 m-auto w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group"
            title="Play Animal Vocalization"
            aria-label="Play Animal Vocalization"
          >
            <Play className="w-6 h-6 fill-current translate-x-0.5 group-hover:scale-105 transition-transform" />
          </button>
        )}
      </div>

      {/* INTERACTIVE CONTROLS DECK */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {/* Scrubber & Duration */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
            <span>{formatTime(audioState.currentTime)}</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {mysteryMode
                ? '[REDACTED BIOACOUSTIC SIGNATURE]'
                : activeRecording?.title || animal.identity.commonName}
            </span>
            <span>{formatTime(audioState.duration)}</span>
          </div>

          <input
            type="range"
            min={0}
            max={audioState.duration || 100}
            step={0.1}
            value={audioState.currentTime}
            onChange={handleSeek}
            disabled={!activeRecording}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            aria-label="Audio scrubber"
          />
        </div>

        {/* Playback Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              disabled={!activeRecording}
              className={`p-3 rounded-2xl font-bold transition-all shadow-md flex items-center gap-2 ${
                isCurrentTrackPlaying
                  ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-950'
              }`}
              title={isCurrentTrackPlaying ? 'Pause Audio' : 'Play Audio'}
            >
              {isCurrentTrackPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              )}
              <span className="text-xs font-mono">{isCurrentTrackPlaying ? 'Pause' : 'Play'}</span>
            </button>

            {/* Loop Toggle */}
            <button
              onClick={() => globalAudioBus.setLoop(!audioState.isLooping)}
              className={`p-2.5 rounded-xl border text-xs font-mono transition-colors ${
                audioState.isLooping
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-white'
              }`}
              title="Toggle Audio Loop"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Slow-Motion Speed Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <span className="text-[10px] text-slate-400 px-2 uppercase font-semibold">Speed:</span>
            {[1.0, 0.5, 0.25].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  audioState.playbackRate === speed
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Set speed to ${speed}x`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RECORDIST ATTRIBUTION & CC LICENSE STRIP */}
      {activeRecording && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 truncate">
            <Music className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-slate-400">Recordist:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
              {mysteryMode ? redactSpecimenText(activeRecording.recordist, animal) : activeRecording.recordist}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-amber-500 border border-slate-200 dark:border-slate-700 text-[10px] shrink-0">
              {activeRecording.licenseCode}
            </span>
          </div>

          {activeRecording.sourceUrl && (
            mysteryMode ? (
              <span className="text-slate-400 dark:text-slate-500 text-[11px] font-mono italic">
                Bioacoustic archive verified (URL redacted during deduction)
              </span>
            ) : (
              <a
                href={activeRecording.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-amber-500 hover:underline flex items-center gap-1 shrink-0 text-[11px]"
              >
                <span>{activeRecording.sourceProvider}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
