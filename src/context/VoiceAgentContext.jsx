// ═══════════════════════════════════════════════════
// ECOTRACK AI — MULTILINGUAL NEURAL VOICE AGENT ENGINE
// Studio-Quality AI Eco-Coach with Selectable Male & Female Voices,
// Real-Time Sentence Streaming, and Context-Aware Personalization
// ═══════════════════════════════════════════════════

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage } from '../utils/agentBot';
import { naturalVoicePlayer } from '../services/naturalVoiceService';
import { useApp } from '../store/AppContext';
import {
  totalCO2,
  weeklyCO2,
  calculateEcoScore,
  getEcoTier,
  getCategoryBreakdown,
} from '../utils/carbonCalculator';
import { normalizeEnvironmentalSpeech } from '../utils/speechNormalizer';

const VoiceAgentContext = createContext(null);

export const VOICE_PERSONAS = [
  {
    id: 'aditi',
    name: 'Aditi (Indian Female)',
    gender: 'female',
    cloudLang: 'hi',
    englishLang: 'en-IN',
    playbackRate: 1.07, // 1.07x light formant shift
    preservesPitch: false, // Pitch shifts up +1.17 semitones for a natural, bright feminine register (~215-225 Hz)
    pitch: 1.15,
    sub: 'Crisp, light & articulate',
    icon: '🌸',
    previewPhrase: {
      hi: 'नमस्ते! मैं अदिति हूँ, आपकी पर्यावरण साथी। बताइये आज क्या मदद करूँ?',
      en: 'Hello! I am Aditi, your sustainability coach. How can I assist with your carbon footprint today?',
    },
  },
  {
    id: 'aarav',
    name: 'Aarav (Indian Male)',
    gender: 'male',
    cloudLang: 'hi',
    englishLang: 'en-IN',
    playbackRate: 0.95, // 0.95x speed for a natural, fluent conversational male cadence
    preservesPitch: false, // Disables pitch correction so voice sounds authentically masculine
    pitch: 0.80,
    sub: 'Friendly, clear & grounded',
    icon: '🌿',
    previewPhrase: {
      hi: 'नमस्ते! मैं आरव हूँ, आपकी सहायता के लिए तैयार हूँ।',
      en: 'Hi there! I am Aarav, ready to help you track emissions and make greener choices.',
    },
  },
];

export const LANGUAGES = [
  { id: 'hinglish', label: 'Hinglish', sub: 'हिंदी + English Mix', flag: '🇮🇳' },
  { id: 'hi', label: 'हिंदी (Hindi)', sub: 'शुद्ध हिंदी', flag: '🇮🇳' },
  { id: 'en', label: 'English', sub: 'Standard English', flag: '🌐' },
];

/**
 * Robust JSON extraction helper from LLM chat completions
 */
function extractVoiceResponse(rawResponse) {
  if (!rawResponse) return { display: '', speech: '', userQueryDisplay: '' };

  let text = rawResponse.trim();

  // Try extracting code block content
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Look for outer JSON object
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      const display = parsed.displayText || parsed.speechText || rawResponse;
      const speech = parsed.speechText || parsed.displayText || rawResponse;
      const userQueryDisplay = parsed.userQueryDisplay || parsed.englishQuery || '';
      return { display, speech, userQueryDisplay };
    } catch (e) {}
  }

  try {
    const parsed = JSON.parse(text);
    const display = parsed.displayText || parsed.speechText || rawResponse;
    const speech = parsed.speechText || parsed.displayText || rawResponse;
    const userQueryDisplay = parsed.userQueryDisplay || parsed.englishQuery || '';
    return { display, speech, userQueryDisplay };
  } catch (e) {
    const cleaned = rawResponse
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*#_~`]/g, '')
      .trim();
    return { display: cleaned, speech: cleaned, userQueryDisplay: '' };
  }
}

/**
 * Matches installed system device voices if user toggles to Local Device Voices
 */
export function findMatchingBrowserVoice(personaId, currentLang, browserVoices) {
  if (!browserVoices || browserVoices.length === 0) return null;

  const persona =
    VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];
  const isFemale = persona.gender === 'female';

  // 1. If Indian persona and Hindi / Hinglish requested
  if (currentLang === 'hi' || currentLang === 'hinglish') {
    const hindiVoice = browserVoices.find((v) => {
      const l = (v.lang || '').toLowerCase();
      const n = (v.name || '').toLowerCase();
      if (!l.startsWith('hi')) return false;
      if (isFemale) return !n.includes('male') && !n.includes('hemant') && !n.includes('prabhat');
      return n.includes('male') || n.includes('hemant') || n.includes('prabhat') || n.includes('madhur');
    }) || browserVoices.find((v) => (v.lang || '').toLowerCase().startsWith('hi'));

    if (hindiVoice) return hindiVoice;
  }

  // 2. Indian English voice match
  const inVoice = browserVoices.find((v) => {
    const l = (v.lang || '').toLowerCase();
    const n = (v.name || '').toLowerCase();
    if (!l.includes('in') && !n.includes('india')) return false;
    if (isFemale) return n.includes('female') || n.includes('neerja') || n.includes('heera') || n.includes('swara') || n.includes('aditi');
    return n.includes('male') || n.includes('prabhat') || n.includes('ravi') || n.includes('hemant');
  });

  if (inVoice) return inVoice;

  // 3. Gender matching for English / Global
  const genderVoice = browserVoices.find((v) => {
    const n = (v.name || '').toLowerCase();
    if (isFemale) {
      return n.includes('female') || n.includes('zira') || n.includes('jenny') || n.includes('samantha') || n.includes('victoria');
    } else {
      return n.includes('male') || n.includes('david') || n.includes('mark') || n.includes('guy') || n.includes('george');
    }
  });

  if (genderVoice) return genderVoice;

  return browserVoices[0];
}

export function VoiceAgentProvider({ children }) {
  // Pull live EcoTrack state
  const appContext = useApp();
  const activities = appContext?.state?.activities || [];

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [contextData, setContextData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100 for visualizer
  const [supported, setSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Persistent Persona & Language State
  const [personaId, setPersonaId] = useState(() => {
    try {
      return localStorage.getItem('ecotrack_voice_persona') || 'aditi';
    } catch (e) {
      return 'aditi';
    }
  });

  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('ecotrack_voice_language') || 'hinglish';
    } catch (e) {
      return 'hinglish';
    }
  });

  const [browserVoices, setBrowserVoices] = useState([]);
  const [useNeuralVoice, setUseNeuralVoice] = useState(true);

  // Multi-Turn Conversation Memory
  const conversationHistoryRef = useRef([]);

  // References
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const isListeningRef = useRef(false);
  const statusRef = useRef('idle');
  const languageRef = useRef(language);
  const personaRef = useRef(personaId);
  const useNeuralVoiceRef = useRef(useNeuralVoice);

  // Keep refs in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    languageRef.current = language;
    try {
      localStorage.setItem('ecotrack_voice_language', language);
    } catch (e) {}
  }, [language]);

  useEffect(() => {
    personaRef.current = personaId;
    try {
      localStorage.setItem('ecotrack_voice_persona', personaId);
    } catch (e) {}
  }, [personaId]);

  useEffect(() => {
    useNeuralVoiceRef.current = useNeuralVoice;
  }, [useNeuralVoice]);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const available = window.speechSynthesis.getVoices() || [];
        setBrowserVoices(available);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition && !window.speechSynthesis) {
      setSupported(false);
    }
  }, []);

  // Sync mute state
  useEffect(() => {
    naturalVoicePlayer.isMuted = isMuted;
    if (isMuted) {
      naturalVoicePlayer.stop();
    }
  }, [isMuted]);

  // Stop microphone stream & audio analyser
  const stopAudioAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Start real microphone frequency analyser for visualizer
  const startAudioAnalyser = async () => {
    try {
      stopAudioAnalyser();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current || statusRef.current !== 'listening') {
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn('Microphone stream access for visualizer failed:', err);
    }
  };

  // Dynamic visualizer animation when assistant is speaking
  useEffect(() => {
    let interval = null;
    if (status === 'speaking') {
      interval = setInterval(() => {
        const simulated = Math.round(30 + Math.random() * 60);
        setAudioLevel(simulated);
      }, 90);
    } else if (status !== 'listening') {
      setAudioLevel(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Execute Fluent TTS Speech (Neural Studio Voice or Browser Voice)
  const speakResponse = useCallback(
    (textToSpeak, onComplete) => {
      if (isMuted || !textToSpeak) {
        if (onComplete) onComplete();
        return;
      }

      // Immediately disarm microphone recognition before audio playback begins
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      isListeningRef.current = false;
      stopAudioAnalyser();

      naturalVoicePlayer.stop();

      const currentLang = languageRef.current;
      const persona =
        VOICE_PERSONAS.find((p) => p.id === personaRef.current) || VOICE_PERSONAS[0];

      // 1. Primary: Ultra-Fluent Neural Studio Voice via /api/tts
      if (useNeuralVoiceRef.current) {
        let ttsLang = 'hi';
        const hasDevanagari = /[\u0900-\u097F]/.test(textToSpeak);

        if (currentLang === 'en') {
          ttsLang = persona.englishLang || 'en';
        } else if (hasDevanagari) {
          ttsLang = 'hi';
        } else if (currentLang === 'hinglish') {
          ttsLang = 'en-IN'; // Indian English accent for non-Devanagari words
        } else {
          ttsLang = 'hi';
        }

        // Apply environmental phonetic normalization to ensure CO2, kWh, etc. sound natural
        const smoothedSpeech = normalizeEnvironmentalSpeech(textToSpeak, ttsLang);

        naturalVoicePlayer.playNeuralSpeech(smoothedSpeech, ttsLang, {
          playbackRate: persona.playbackRate,
          preservesPitch: persona.preservesPitch,
          pitch: persona.pitch,
          personaId: persona.id,
          onStart: () => setStatus('speaking'),
          onEnd: () => {
            if (onComplete) onComplete();
          },
        });
        return;
      }

      // 2. Direct Browser System Voice (Only if explicitly selected from Device Voices)
      const selectedVoice =
        browserVoices.find((v) => v.voiceURI === personaRef.current || v.name === personaRef.current) ||
        findMatchingBrowserVoice(persona.id, currentLang, browserVoices);

      const targetLang =
        currentLang === 'hi' ? 'hi-IN' : currentLang === 'hinglish' ? 'en-IN' : 'en-US';

      naturalVoicePlayer.playBrowserSpeech(textToSpeak, selectedVoice, targetLang, {
        pitch: persona.pitch,
        rate: persona.playbackRate,
        onStart: () => setStatus('speaking'),
        onEnd: () => {
          if (onComplete) onComplete();
        },
      });
    },
    [isMuted, browserVoices]
  );

  // Send query to Groq and handle the response with personalized EcoTrack data
  const handleQuery = useCallback(
    async (query) => {
      if (!query || !query.trim()) return;

      setStatus('thinking');
      setUserTranscript(query.trim());
      setErrorMessage(null);

      try {
        // Construct user carbon stats for personalized coaching
        let userStatsContext = '';
        if (activities && activities.length > 0) {
          const totalKg = totalCO2(activities).toFixed(1);
          const weeklyKg = weeklyCO2(activities).toFixed(1);
          const score = calculateEcoScore(activities);
          const tier = getEcoTier(score);
          const breakdown = getCategoryBreakdown(activities);
          const topCategory = breakdown[0]?.name || 'general';

          userStatsContext = `User's Actual Logged EcoTrack Carbon Data:
- Total Logged Carbon Footprint: ${totalKg} kg CO2e
- This Week's Emissions: ${weeklyKg} kg CO2e
- Eco Score: ${score} / 100 (${tier.name})
- Main Emission Source: ${topCategory}
- Total Logged Activities: ${activities.length} entries
- Recent Logs: ${JSON.stringify(activities.slice(-3))}`;
        } else {
          userStatsContext = `User has not logged any activities in EcoTrack yet. Ask exploratory questions about their daily commute (car, bike, public transport, walking), electricity use, or food choices to help calculate their emissions.`;
        }

        let cityContext = '';
        if (contextData?.cityName) {
          cityContext = `Active Radar City: ${contextData.cityName}. AQI: ${contextData.liveAqi?.usAqi || 'N/A'}, PM2.5: ${contextData.liveAqi?.pm25 || 'N/A'} µg/m³.`;
        }

        const currentLang = languageRef.current;
        let systemPrompt = '';

        if (currentLang === 'hinglish') {
          systemPrompt = `You are EcoBot, a warm, intelligent AI Eco-Coach for EcoTrack users.
You speak naturally and conversationally like a friendly sustainability mentor.
Rules:
1. Explain sustainability, transportation, energy, and carbon footprints in simple, accessible terms.
2. Give practical, realistic daily suggestions (carpooling, public transport, switching off idle electronics, plant-rich meals).
3. Ground your advice in the user's actual data if available. If no data, ask a short conversational question (e.g. "Do you usually travel by car, bike, or public transport?").
4. Keep spoken responses short (2-3 concise sentences max).
5. Never invent or falsify user statistics, savings, or emission factors. Clearly distinguish estimates from measured data.
6. Pronounce CO2 as carbon dioxide or C-O-2, and kWh as kilowatt-hours.
7. Return a valid JSON object matching this schema:
{
  "displayText": "2-3 short conversational sentences in natural Hinglish written in Latin alphabet (e.g. 'Agar aap roz gaadi se travel karte hain, toh hafte mein do din carpool ya public transport lena try karein. Isse aapke monthly transport emissions mein acchi bachat ho sakti hai. Aapka regular travel distance kitna hai?')",
  "speechText": "The exact same message written in natural, fluent Hindi in Devanagari script for native studio voice synthesis (e.g. 'अगर आप रोज़ गाड़ी से यात्रा करते हैं, तो हफ़्ते में दो दिन कारपूल या पब्लिक ट्रांसपोर्ट अपनाकर देखें। इससे आपके मासिक कार्बन उत्सर्जन में अच्छी कमी आ सकती है। आपकी रोज़ाना यात्रा की दूरी कितनी है?')",
  "userQueryDisplay": "The user query transcribed into readable Latin Hinglish/English text (e.g. 'Now speak in English' or 'Mera carbon score kya hai'). If already in Latin alphabet, repeat as-is."
}
CRITICAL: Valid JSON ONLY. No markdown ticks, no asterisks, no bullets.`;
        } else if (currentLang === 'hi') {
          systemPrompt = `You are EcoBot, a respectful, friendly AI Eco-Coach in EcoTrack.
Rules:
1. Speak in warm, clear, simple Hindi (हिंदी).
2. Give practical tips to reduce carbon emissions and live greener.
3. Keep spoken replies short (2-3 sentences max).
4. Return a valid JSON object:
{
  "displayText": "2-3 clear sentences in respectful Hindi (Devanagari).",
  "speechText": "Same text in Devanagari Hindi for speech output."
}
CRITICAL: Valid JSON ONLY. No markdown, no asterisks.`;
        } else {
          systemPrompt = `You are EcoBot, an approachable, intelligent AI Eco-Coach for EcoTrack.
Rules:
1. Speak naturally and conversationally in English, like a trusted sustainability partner.
2. Give practical, realistic suggestions (e.g., carpooling, biking, renewable power, cutting phantom electricity).
3. Use available user carbon data to personalize advice. If no activities are logged, ask concise follow-up questions to understand their daily routine.
4. Keep spoken responses short and conversational in English (2-3 sentences max).
5. Never invent or falsify user data, carbon savings, or emission statistics. Distinguish estimates from measured data.
6. Never claim to be human.
7. Return a valid JSON object:
{
  "displayText": "A friendly, conversational 2-3 sentence spoken reply in clean English.",
  "speechText": "The clean spoken version of the reply with natural phrasing in English.",
  "userQueryDisplay": "The user query translated or transcribed into clean English text (e.g. 'Now speak in English' if they said 'नाउ स्पीक इन इंग्लिश'). If already clean English, repeat as-is."
}
CRITICAL: Valid JSON ONLY. No markdown ticks, no asterisks.`;
        }

        // Include recent conversation turns for contextual continuity
        const history = conversationHistoryRef.current.slice(-4);
        const fullPrompt = `${systemPrompt}\n\n${userStatsContext}\n\n${cityContext}\n\nUser Voice Query: "${query.trim()}"`;

        // Format history for Groq chat completion
        const messages = history.map((t) => ({ role: t.role, content: t.content }));
        messages.push({ role: 'user', content: fullPrompt });

        const rawResponse = await sendChatMessage(fullPrompt, history, activities);
        const { display, speech, userQueryDisplay } = extractVoiceResponse(rawResponse);

        // If English or Hinglish mode is active and the user query was in Devanagari,
        // update the displayed transcript to the clean readable Latin/English text
        const resolvedQuery =
          (currentLang === 'en' || currentLang === 'hinglish') &&
          userQueryDisplay &&
          /[\u0900-\u097F]/.test(query)
            ? userQueryDisplay
            : query.trim();

        if (resolvedQuery !== query.trim()) {
          setUserTranscript(resolvedQuery);
        }

        // Update conversation turns memory
        conversationHistoryRef.current = [
          ...conversationHistoryRef.current.slice(-5),
          { role: 'user', content: resolvedQuery },
          { role: 'assistant', content: display },
        ];

        setAssistantReply(display);

        // Speak response using our neural voice engine
        speakResponse(speech, () => {
          if (continuousMode && isOpen) {
            setTimeout(() => {
              startListening();
            }, 600);
          } else {
            setStatus('idle');
          }
        });
      } catch (err) {
        console.error('Voice agent query error:', err);
        const fallback =
          languageRef.current === 'hi'
            ? 'माफ़ कीजिए, अभी कनेक्ट करने में थोड़ी परेशानी हो रही है। कृपया दोबारा पूछें।'
            : languageRef.current === 'hinglish'
            ? 'Sorry, thoda network issue ho gaya. Please ek baar dobara bolein!'
            : "I'm having trouble connecting right now. Please try asking again.";

        setAssistantReply(fallback);
        speakResponse(fallback, () => {
          if (continuousMode && isOpen) {
            startListening();
          } else {
            setStatus('idle');
          }
        });
      }
    },
    [activities, contextData, continuousMode, isOpen, speakResponse]
  );

  // Start Speech Recognition with clean error handling
  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition is not supported in this browser.');
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    naturalVoicePlayer.stop();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    // Set recognition language
    const currentLang = languageRef.current;
    if (currentLang === 'hi' || currentLang === 'hinglish') {
      recognition.lang = 'hi-IN';
    } else {
      // Pure English: strictly en-US to guarantee 100% Latin English text output
      recognition.lang = 'en-US';
    }

    recognition.onstart = () => {
      isListeningRef.current = true;
      setStatus('listening');
      setErrorMessage(null);
      setUserTranscript(
        currentLang === 'hi'
          ? 'सुन रहा हूँ... बोलिए'
          : currentLang === 'hinglish'
          ? 'Listening in Hinglish... Kuch bhi puchiye'
          : 'Listening in English... Speak now'
      );
      startAudioAnalyser();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim) {
        setUserTranscript(interim);
      }

      if (final && final.trim()) {
        setUserTranscript(final.trim());
        stopAudioAnalyser();
        isListeningRef.current = false;
        try {
          recognition.abort();
        } catch (e) {}
        handleQuery(final.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition event error:', event.error);
      stopAudioAnalyser();
      isListeningRef.current = false;

      // Handle specific error codes gracefully
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser bar.');
        setStatus('idle');
        return;
      }

      if (event.error === 'network') {
        setErrorMessage('Network error during speech recognition. Please check your internet connection.');
        setStatus('idle');
        return;
      }

      // Do not restart listening if bot is already thinking or speaking
      if (statusRef.current === 'thinking' || statusRef.current === 'speaking') {
        return;
      }

      if (event.error === 'no-speech' && continuousMode && isOpen) {
        setTimeout(() => {
          if (statusRef.current === 'listening' || statusRef.current === 'idle') {
            startListening();
          }
        }, 1200);
      } else {
        setStatus('idle');
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      stopAudioAnalyser();
      if (statusRef.current === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (e) {
      console.warn('Error starting speech recognition:', e);
    }
  }, [continuousMode, isOpen, handleQuery]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    stopAudioAnalyser();
    setStatus('idle');
  }, []);

  // Immediate Interruption handling: stops audio within 5ms and resumes listening
  const interrupt = useCallback(() => {
    naturalVoicePlayer.stop();
    setStatus('idle');
    setTimeout(() => {
      startListening();
    }, 200);
  }, [startListening]);

  // Open Voice Agent Session
  const openVoiceAgent = useCallback(
    (context = null) => {
      setContextData(context);
      setIsOpen(true);
      setUserTranscript('');
      setAssistantReply('');
      setStatus('idle');
      setErrorMessage(null);

      setTimeout(() => {
        startListening();
      }, 350);
    },
    [startListening]
  );

  // Close Voice Agent Session
  const closeVoiceAgent = useCallback(() => {
    stopListening();
    naturalVoicePlayer.stop();
    stopAudioAnalyser();
    setIsOpen(false);
    setStatus('idle');
    setUserTranscript('');
    setAssistantReply('');
    setErrorMessage(null);
  }, [stopListening]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      naturalVoicePlayer.isMuted = next;
      if (next) naturalVoicePlayer.stop();
      return next;
    });
  }, []);

  // Switch Language with persistence and immediate recognition re-alignment
  const changeLanguage = useCallback(
    (newLang) => {
      setLanguage(newLang);
      languageRef.current = newLang;
      try {
        localStorage.setItem('ecotrack_voice_language', newLang);
      } catch (e) {}

      // If speech synthesis is active, stop it cleanly
      naturalVoicePlayer.stop();

      // If recognition is active or overlay is open, abort and restart with new language model
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
      isListeningRef.current = false;
      stopAudioAnalyser();

      if (isOpen) {
        setUserTranscript(
          newLang === 'hi'
            ? 'सुन रहा हूँ... बोलिए'
            : newLang === 'hinglish'
            ? 'Listening in Hinglish... Kuch bhi puchiye'
            : 'Listening in English... Speak now'
        );
        setTimeout(() => {
          startListening();
        }, 150);
      } else {
        setUserTranscript('');
      }
    },
    [isOpen, startListening]
  );

  // Switch Voice Persona with persistence and immediate distinct audible preview
  const changePersona = useCallback(
    (newPersonaId, isBrowserVoice = false) => {
      setPersonaId(newPersonaId);
      personaRef.current = newPersonaId;

      try {
        localStorage.setItem('ecotrack_voice_persona', newPersonaId);
      } catch (e) {}

      if (isBrowserVoice) {
        setUseNeuralVoice(false);
        useNeuralVoiceRef.current = false;
      } else {
        setUseNeuralVoice(true);
        useNeuralVoiceRef.current = true;
      }

      const persona =
        VOICE_PERSONAS.find((p) => p.id === newPersonaId) || VOICE_PERSONAS[0];
      const currentLang = languageRef.current;
      const isHindi = currentLang === 'hi' || currentLang === 'hinglish';
      const phrase = isHindi ? persona.previewPhrase.hi : persona.previewPhrase.en;

      // Play immediate audible preview so user hears the distinct male or female voice
      speakResponse(phrase);
    },
    [speakResponse]
  );

  return (
    <VoiceAgentContext.Provider
      value={{
        isOpen,
        status,
        userTranscript,
        assistantReply,
        contextData,
        isMuted,
        continuousMode,
        audioLevel,
        supported,
        errorMessage,
        language,
        personaId,
        browserVoices,
        useNeuralVoice,
        changeLanguage,
        changePersona,
        setUseNeuralVoice,
        openVoiceAgent,
        closeVoiceAgent,
        startListening,
        stopListening,
        interrupt,
        toggleMute,
        setContinuousMode,
        handleQuery,
      }}
    >
      {children}
    </VoiceAgentContext.Provider>
  );
}

export function useVoiceAgent() {
  const context = useContext(VoiceAgentContext);
  if (!context) {
    throw new Error('useVoiceAgent must be used within a VoiceAgentProvider');
  }
  return context;
}
