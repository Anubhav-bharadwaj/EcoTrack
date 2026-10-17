// ═══════════════════════════════════════════════════
// ECOTRACK AI — NATURAL NEURAL VOICE SERVICE
// Studio-Quality AI Voice Synthesis with Real Male & Female Timbre,
// Sentence Pipelining, and Environmental Phonetic Smoothing
// ═══════════════════════════════════════════════════

import { normalizeEnvironmentalSpeech } from '../utils/speechNormalizer';

/**
 * Splits text into natural sentence chunks (< 140 characters)
 * to respect audio streaming limits while preserving natural speech rhythm.
 */
export function splitTextIntoAudioChunks(text, maxChars = 140, lang = 'en') {
  if (!text) return [];

  // Normalize environmental units and symbols first
  const normalized = normalizeEnvironmentalSpeech(text, lang);
  if (!normalized) return [];

  // Split on sentence boundaries: ., !, ?, or Devanagari danda (।)
  const rawSentences = normalized.match(/[^.!?।\n]+[.!?।\n]+/g) || [normalized];
  const chunks = [];
  let currentChunk = '';

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((currentChunk + ' ' + trimmed).trim().length <= maxChars) {
      currentChunk = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
    } else {
      if (currentChunk) chunks.push(currentChunk);

      if (trimmed.length > maxChars) {
        // Split on clause punctuation (comma, semicolon)
        const parts = trimmed.split(/(?<=[,;،])\s+/);
        let subChunk = '';
        for (const part of parts) {
          if ((subChunk + ' ' + part).trim().length <= maxChars) {
            subChunk = subChunk ? subChunk + ' ' + part : part;
          } else {
            if (subChunk) chunks.push(subChunk);
            if (part.length > maxChars) {
              const words = part.split(' ');
              let wordChunk = '';
              for (const w of words) {
                if ((wordChunk + ' ' + w).trim().length <= maxChars) {
                  wordChunk = wordChunk ? wordChunk + ' ' + w : w;
                } else {
                  if (wordChunk) chunks.push(wordChunk);
                  wordChunk = w;
                }
              }
              if (wordChunk) chunks.push(wordChunk);
              subChunk = '';
            } else {
              subChunk = part;
            }
          }
        }
        if (subChunk) chunks.push(subChunk);
        currentChunk = '';
      } else {
        currentChunk = trimmed;
      }
    }
  }

  if (currentChunk && currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

class NaturalVoicePlayer {
  constructor() {
    this.currentAudio = null;
    this.nextAudio = null; // Preloaded next chunk audio
    this.isPlaying = false;
    this.queue = [];
    this.currentIndex = 0;
    this.onStartCallback = null;
    this.onEndCallback = null;
    this.isMuted = false;
    this.audioContext = null;
  }

  /**
   * Stop any currently playing audio immediately.
   * Disarms listeners to ensure cancellation never triggers error callbacks.
   */
  stop() {
    this.isPlaying = false;
    this.queue = [];
    this.currentIndex = 0;

    const cleanupAudio = (audio) => {
      if (!audio) return;
      audio.onended = null;
      audio.onerror = null;
      audio.oncanplay = null;
      audio.onplay = null;
      audio.onpause = null;
      if (audio._mediaSourceNode) {
        try {
          audio._mediaSourceNode.disconnect();
        } catch (e) {}
        audio._mediaSourceNode = null;
      }
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute('src');
        audio.load();
      } catch (e) {}
    };

    cleanupAudio(this.currentAudio);
    cleanupAudio(this.nextAudio);
    this.currentAudio = null;
    this.nextAudio = null;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }

  /**
   * Play speech using high-fidelity local proxy audio stream (/api/tts)
   * with pipeline preloading for zero-latency multi-sentence playback.
   */
  playNeuralSpeech(
    text,
    lang = 'hi',
    {
      onStart,
      onEnd,
      onChunkChange,
      playbackRate = 1.0,
      preservesPitch = true,
      pitch = 1.0,
      personaId = 'aditi',
    } = {}
  ) {
    this.stop();
    if (!text || this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    const chunks = splitTextIntoAudioChunks(text, 140, lang);
    if (chunks.length === 0) {
      if (onEnd) onEnd();
      return;
    }

    this.queue = chunks;
    this.currentIndex = 0;
    this.isPlaying = true;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    if (onStart) onStart();
    this._playNextChunk(lang, {
      onChunkChange,
      playbackRate,
      preservesPitch,
      pitch,
      personaId,
      fullText: text,
    });
  }

  _buildChunkUrl(chunk, lang) {
    let ttsLang = 'hi';
    const hasDevanagari = /[\u0900-\u097F]/.test(chunk);

    if (hasDevanagari) {
      ttsLang = 'hi';
    } else if (lang === 'en' || lang === 'en-US' || lang === 'en-GB') {
      ttsLang = 'en';
    } else if (lang === 'en-IN' || lang === 'hinglish') {
      ttsLang = 'en-IN';
    } else {
      ttsLang = 'hi';
    }

    return `/api/tts?q=${encodeURIComponent(chunk)}&tl=${ttsLang}`;
  }

  _getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  _applyPersonaAcoustics(audio, personaId) {
    if (personaId !== 'aditi') {
      // Aarav (male) retains his natural low-end resonance and baritone fundamental
      return;
    }

    try {
      const ctx = this._getAudioContext();
      if (!ctx) return;

      audio.crossOrigin = 'anonymous';

      // Studio EQ filter chain: Low-cut highpass to remove boomy proximity rumble,
      // plus high-shelf presence boost for articulate, clear female voice
      if (!this.aditiHighpass) {
        this.aditiHighpass = ctx.createBiquadFilter();
        this.aditiHighpass.type = 'highpass';
        this.aditiHighpass.frequency.value = 190; // Cuts frequencies below 190 Hz (removes heavy boomy chest resonance)
        this.aditiHighpass.Q.value = 0.707; // Butterworth flat passband

        this.aditiPresence = ctx.createBiquadFilter();
        this.aditiPresence.type = 'highshelf';
        this.aditiPresence.frequency.value = 3200; // Articulate clarity & brightness
        this.aditiPresence.gain.value = 2.0; // +2 dB boost

        this.aditiHighpass.connect(this.aditiPresence);
        this.aditiPresence.connect(ctx.destination);
      }

      const sourceNode = ctx.createMediaElementSource(audio);
      sourceNode.connect(this.aditiHighpass);
      audio._mediaSourceNode = sourceNode;
    } catch (e) {
      // If Web Audio routing fails, HTML5 audio continues playing directly
      console.debug('Acoustic filter note:', e);
    }
  }

  _playNextChunk(
    lang,
    { onChunkChange, playbackRate, preservesPitch, pitch, personaId, fullText }
  ) {
    if (!this.isPlaying || this.currentIndex >= this.queue.length) {
      this.isPlaying = false;
      if (this.onEndCallback) this.onEndCallback();
      return;
    }

    const chunk = this.queue[this.currentIndex];
    if (onChunkChange) onChunkChange(chunk, this.currentIndex, this.queue.length);

    // Use preloaded audio if already ready, otherwise create new
    let audio = this.nextAudio;
    this.nextAudio = null;

    if (!audio) {
      audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.src = this._buildChunkUrl(chunk, lang);
    }

    // Apply voice-persona specific acoustic pitch & formant settings
    if (preservesPitch !== undefined) {
      audio.preservesPitch = preservesPitch;
      audio.webkitPreservesPitch = preservesPitch;
      audio.mozPreservesPitch = preservesPitch;
    }
    audio.playbackRate = playbackRate || 1.0;
    this.currentAudio = audio;

    // Apply acoustic filter chain (Option 3: removes low-end heaviness for Aditi)
    this._applyPersonaAcoustics(audio, personaId);

    // Preload next chunk in background for seamless streaming
    if (this.currentIndex + 1 < this.queue.length) {
      const nextChunk = this.queue[this.currentIndex + 1];
      const preloadAudio = new Audio();
      preloadAudio.crossOrigin = 'anonymous';
      preloadAudio.src = this._buildChunkUrl(nextChunk, lang);
      if (preservesPitch !== undefined) {
        preloadAudio.preservesPitch = preservesPitch;
        preloadAudio.webkitPreservesPitch = preservesPitch;
        preloadAudio.mozPreservesPitch = preservesPitch;
      }
      preloadAudio.playbackRate = playbackRate || 1.0;
      preloadAudio.preload = 'auto';
      this.nextAudio = preloadAudio;
    }

    audio.onended = () => {
      if (!this.isPlaying) return;
      if (audio._mediaSourceNode) {
        try {
          audio._mediaSourceNode.disconnect();
        } catch (e) {}
        audio._mediaSourceNode = null;
      }
      this.currentIndex++;
      this._playNextChunk(lang, {
        onChunkChange,
        playbackRate,
        preservesPitch,
        pitch,
        personaId,
        fullText,
      });
    };

    audio.onerror = (e) => {
      if (!this.isPlaying || this.currentAudio !== audio) return;
      console.warn('Audio playback warning on chunk, moving to next:', e);
      if (audio._mediaSourceNode) {
        try {
          audio._mediaSourceNode.disconnect();
        } catch (err) {}
        audio._mediaSourceNode = null;
      }
      this.currentIndex++;
      if (this.currentIndex < this.queue.length) {
        this._playNextChunk(lang, {
          onChunkChange,
          playbackRate,
          preservesPitch,
          pitch,
          personaId,
          fullText,
        });
      } else {
        this.isPlaying = false;
        if (this.onEndCallback) this.onEndCallback();
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('Audio play request interrupted:', err);
      });
    }
  }

  /**
   * Browser SpeechSynthesis fallback (only if user explicitly selects local OS device voice)
   */
  playBrowserSpeech(text, voiceObj, langCode, { onStart, onEnd, pitch = 1.0, rate = 1.0 } = {}) {
    this.stop();
    if (!text || this.isMuted || typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    const clean = normalizeEnvironmentalSpeech(text, langCode);
    if (!clean) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    if (voiceObj) {
      utterance.voice = voiceObj;
      utterance.lang = voiceObj.lang;
    } else {
      utterance.lang = langCode || 'en-US';
    }

    utterance.rate = Math.max(0.7, Math.min(1.4, rate || 1.0));
    utterance.pitch = Math.max(0.6, Math.min(1.6, pitch || 1.0));

    utterance.onstart = () => {
      this.isPlaying = true;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (err) => {
      this.isPlaying = false;
      if (onEnd) onEnd();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (onEnd) onEnd();
    }
  }
}

export const naturalVoicePlayer = new NaturalVoicePlayer();
