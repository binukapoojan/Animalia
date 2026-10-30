/**
 * ANIMALIA — Global Bioacoustic Bus Coordinator
 * Singleton coordinating Web Audio API, frequency analysis, pitch control,
 * single-track mutual exclusion, and Comparison Matrix duet mode.
 */

import type { TaxonAudioItem } from '../types/taxonomy';

export interface AudioPlaybackState {
  isPlaying: boolean;
  activeTrack: TaxonAudioItem | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isLooping: boolean;
  isDuet: boolean;
  duetTrack: TaxonAudioItem | null;
  isCorsRestricted: boolean;
  isLoading: boolean;
}

type StateListener = (state: AudioPlaybackState) => void;

class AudioCoordinator {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private primaryAudio: HTMLAudioElement | null = null;
  private duetAudio: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private duetSourceNode: MediaElementAudioSourceNode | null = null;

  private listeners = new Set<StateListener>();
  private syntheticTime = 0;

  private state: AudioPlaybackState = {
    isPlaying: false,
    activeTrack: null,
    currentTime: 0,
    duration: 0,
    playbackRate: 1.0,
    volume: 1.0,
    isLooping: false,
    isDuet: false,
    duetTrack: null,
    isCorsRestricted: false,
    isLoading: false
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initPrimaryAudio();
    }
  }

  private initPrimaryAudio(): void {
    if (this.primaryAudio) return;
    this.primaryAudio = new Audio();
    this.primaryAudio.preload = 'auto';

    this.primaryAudio.addEventListener('timeupdate', () => {
      if (this.primaryAudio) {
        this.state.currentTime = this.primaryAudio.currentTime;
        this.state.duration = this.primaryAudio.duration || 0;
        this.notify();
      }
    });

    this.primaryAudio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.state.isLoading = false;
      this.notify();
    });

    this.primaryAudio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.notify();
    });

    this.primaryAudio.addEventListener('ended', () => {
      if (!this.state.isLooping && !this.state.isDuet) {
        this.state.isPlaying = false;
        this.notify();
      }
    });

    // Guard: Handle CORS restriction on Wikimedia or external CDN edges
    this.primaryAudio.addEventListener('error', () => {
      if (this.primaryAudio?.crossOrigin === 'anonymous' && this.state.activeTrack) {
        console.warn('[AudioCoordinator] CORS restricted on audio stream; falling back to non-CORS audible stream.');
        this.state.isCorsRestricted = true;
        const currentSrc = this.primaryAudio.src;
        this.primaryAudio.removeAttribute('crossorigin');
        this.primaryAudio.src = currentSrc;
        this.primaryAudio.play().catch(() => {});
        this.notify();
      } else {
        this.state.isLoading = false;
        this.state.isPlaying = false;
        this.notify();
      }
    });
  }

  private ensureAudioContext(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;
      this.audioCtx = new AudioContextClass();
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    if (!this.analyser && this.audioCtx) {
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;

      // Attach source to primary audio ONCE to avoid InvalidStateError
      if (this.primaryAudio && !this.sourceNode) {
        try {
          this.primaryAudio.crossOrigin = 'anonymous';
          this.sourceNode = this.audioCtx.createMediaElementSource(this.primaryAudio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioCtx.destination);
        } catch (err) {
          console.warn('[AudioCoordinator] Direct Web Audio node attachment notice:', err);
        }
      }
    }

    return true;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const copy = { ...this.state };
    for (const listener of this.listeners) {
      listener(copy);
    }
  }

  /**
   * Play an animal recording mutually exclusively across the app
   */
  public async play(track: TaxonAudioItem): Promise<void> {
    this.ensureAudioContext();
    this.stopDuet();

    if (!this.primaryAudio) return;

    // If already playing this exact track, resume if paused
    if (this.state.activeTrack?.audioUrl === track.audioUrl) {
      if (this.primaryAudio.paused) {
        try {
          await this.primaryAudio.play();
        } catch {}
      }
      return;
    }

    this.state.isLoading = true;
    this.state.activeTrack = track;
    this.state.isDuet = false;
    this.state.duetTrack = null;
    this.state.isCorsRestricted = false;
    this.notify();

    try {
      this.primaryAudio.pause();
      this.primaryAudio.crossOrigin = 'anonymous';
      this.primaryAudio.src = track.audioUrl;
      this.applyPitchAndSpeed(this.primaryAudio, this.state.playbackRate);
      this.primaryAudio.loop = this.state.isLooping;
      this.primaryAudio.volume = this.state.volume;
      await this.primaryAudio.play();
    } catch (err: any) {
      console.warn('[AudioCoordinator] Playback initiation notice:', err?.message);
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  /**
   * Toggle play / pause for a specific animal track
   */
  public async toggle(track: TaxonAudioItem): Promise<void> {
    if (this.state.activeTrack?.audioUrl === track.audioUrl && this.state.isPlaying) {
      this.pause();
    } else {
      await this.play(track);
    }
  }

  /**
   * Pause any active audio playback
   */
  public pause(): void {
    if (this.primaryAudio && !this.primaryAudio.paused) {
      this.primaryAudio.pause();
    }
    if (this.duetAudio && !this.duetAudio.paused) {
      this.duetAudio.pause();
    }
    this.state.isPlaying = false;
    this.notify();
  }

  /**
   * Playback rate setting with pitch-drop preservation
   */
  public setPlaybackRate(rate: number): void {
    this.state.playbackRate = rate;
    if (this.primaryAudio) {
      this.applyPitchAndSpeed(this.primaryAudio, rate);
    }
    if (this.duetAudio) {
      this.applyPitchAndSpeed(this.duetAudio, rate);
    }
    this.notify();
  }

  private applyPitchAndSpeed(element: HTMLAudioElement, rate: number): void {
    element.playbackRate = rate;
    // Allow pitch to shift down so ultrasonic bird trills drop into audible register
    (element as any).preservesPitch = false;
    (element as any).mozPreservesPitch = false;
    (element as any).webkitPreservesPitch = false;
  }

  public seek(seconds: number): void {
    if (this.primaryAudio && Number.isFinite(seconds)) {
      this.primaryAudio.currentTime = Math.max(0, Math.min(seconds, this.primaryAudio.duration || 0));
      this.state.currentTime = this.primaryAudio.currentTime;
      this.notify();
    }
  }

  public setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.primaryAudio) this.primaryAudio.volume = this.state.volume;
    if (this.duetAudio) this.duetAudio.volume = this.state.volume;
    this.notify();
  }

  public setLoop(loop: boolean): void {
    this.state.isLooping = loop;
    if (this.primaryAudio) this.primaryAudio.loop = loop;
    if (this.duetAudio) this.duetAudio.loop = loop;
    this.notify();
  }

  /**
   * Comparison Matrix Duet Mode:
   * Plays Track A and Track B simultaneously without Track B cancelling Track A!
   */
  public async playDuet(trackA: TaxonAudioItem, trackB: TaxonAudioItem): Promise<void> {
    this.ensureAudioContext();

    if (!this.duetAudio) {
      this.duetAudio = new Audio();
      this.duetAudio.preload = 'auto';
    }

    this.state.isLoading = true;
    this.state.isDuet = true;
    this.state.activeTrack = trackA;
    this.state.duetTrack = trackB;
    this.notify();

    try {
      if (this.primaryAudio) {
        this.primaryAudio.pause();
        this.primaryAudio.src = trackA.audioUrl;
        this.applyPitchAndSpeed(this.primaryAudio, this.state.playbackRate);
        this.primaryAudio.volume = this.state.volume;
      }

      this.duetAudio.pause();
      this.duetAudio.src = trackB.audioUrl;
      this.applyPitchAndSpeed(this.duetAudio, this.state.playbackRate);
      this.duetAudio.volume = this.state.volume;

      // Play both simultaneously
      await Promise.all([
        this.primaryAudio?.play().catch(() => {}),
        this.duetAudio.play().catch(() => {})
      ]);

      this.state.isPlaying = true;
    } catch (err) {
      console.warn('[AudioCoordinator] Duet playback notice:', err);
    } finally {
      this.state.isLoading = false;
      this.notify();
    }
  }

  private stopDuet(): void {
    if (this.duetAudio) {
      this.duetAudio.pause();
      this.duetAudio.currentTime = 0;
    }
    this.state.isDuet = false;
    this.state.duetTrack = null;
  }

  /**
   * 60fps real-time Web Audio API byte frequency data for Spectrogram Canvas
   */
  public getByteFrequencyData(targetArray?: Uint8Array): Uint8Array {
    const dataArray = targetArray || new Uint8Array(64);
    if (!this.state.isPlaying) {
      dataArray.fill(0);
      return dataArray;
    }

    if (this.analyser && !this.state.isCorsRestricted) {
      this.analyser.getByteFrequencyData(dataArray as any);
    } else {
      // CORS fallback: Generate realistic rhythmic pulse so visualizer animates
      this.syntheticTime += 0.05;
      const len = dataArray.length;
      for (let i = 0; i < len; i++) {
        const freqRatio = 1 - i / len;
        const wave = Math.sin(this.syntheticTime * 4 + i * 0.15);
        const beat = Math.abs(Math.sin(this.syntheticTime * 2));
        dataArray[i] = Math.floor(Math.max(0, freqRatio * 200 * beat + wave * 40));
      }
    }
    return dataArray;
  }

  /**
   * 60fps real-time Web Audio API time-domain data for Oscillogram Canvas
   */
  public getByteTimeDomainData(targetArray?: Uint8Array): Uint8Array {
    const dataArray = targetArray || new Uint8Array(64);
    if (!this.state.isPlaying) {
      dataArray.fill(128);
      return dataArray;
    }

    if (this.analyser && !this.state.isCorsRestricted) {
      this.analyser.getByteTimeDomainData(dataArray as any);
    } else {
      this.syntheticTime += 0.05;
      const len = dataArray.length;
      for (let i = 0; i < len; i++) {
        const wave = Math.sin(this.syntheticTime * 6 + i * 0.1);
        dataArray[i] = Math.floor(128 + wave * 45);
      }
    }
    return dataArray;
  }

  public getActiveTrackId(): string | null {
    return this.state.activeTrack?.id || this.state.activeTrack?.audioUrl || null;
  }

  public getState(): AudioPlaybackState {
    return { ...this.state };
  }
}

export const globalAudioBus = new AudioCoordinator();
