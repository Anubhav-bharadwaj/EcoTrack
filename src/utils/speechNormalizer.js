// ═══════════════════════════════════════════════════
// ECOTRACK AI — ENVIRONMENTAL SPEECH NORMALIZER
// Translates environmental terminology, units, numbers, and formulas
// into natural, conversational spoken pronunciation.
// ═══════════════════════════════════════════════════

/**
 * Normalizes text for text-to-speech engines so that technical units,
 * formulas, and metrics sound natural and conversational.
 * 
 * @param {string} text - Raw input text from LLM
 * @param {string} lang - 'en' | 'hi' | 'hinglish'
 * @returns {string} - Phonetically smoothed spoken text
 */
export function normalizeEnvironmentalSpeech(text, lang = 'en') {
  if (!text) return '';

  let spoken = text;

  // 1. Remove markdown formatting, bold/italics, bullet symbols
  spoken = spoken
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/[*#_~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^[-•*]\s+/gm, '')
    .replace(/["“”'‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const isHindiMode = lang === 'hi' || /[\u0900-\u097F]/.test(spoken);

  if (isHindiMode) {
    // Hindi / Hinglish phonetic substitutions for natural speech
    spoken = spoken
      // Emissions units
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO2e\b/gi, '$1 किलोग्राम कार्बन समतुल्य')
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO₂e\b/gi, '$1 किलोग्राम कार्बन समतुल्य')
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO2\b/gi, '$1 किलोग्राम कार्बन डाईऑक्साइड')
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO₂\b/gi, '$1 किलोग्राम कार्बन डाईऑक्साइड')
      .replace(/\bkg\s*CO2e\b/gi, 'किलोग्राम कार्बन समतुल्य')
      .replace(/\bCO2e\b/gi, 'कार्बन समतुल्य')
      .replace(/\bCO2\b/gi, 'कार्बन डाईऑक्साइड')
      .replace(/\bCO₂\b/gi, 'कार्बन डाईऑक्साइड')

      // Energy & distance
      .replace(/\b(\d+(?:\.\d+)?)\s*kWh\b/gi, '$1 किलोवॉट घंटे')
      .replace(/\bkWh\b/gi, 'किलोवॉट घंटे')
      .replace(/\b(\d+(?:\.\d+)?)\s*km\b/gi, '$1 किलोमीटर')
      .replace(/\bkm\b/gi, 'किलोमीटर')
      .replace(/\b(\d+(?:\.\d+)?)\s*AQI\b/gi, 'वायु गुणवत्ता सूचकांक $1')
      .replace(/\bAQI\b/gi, 'वायु गुणवत्ता सूचकांक')
      .replace(/\bPM2\.5\b/gi, 'पीएम टू पॉइंट फाइव')
      .replace(/\bPM10\b/gi, 'पीएम टेन')
      .replace(/\bµg\/m³\b/gi, 'माइक्रोग्राम प्रति क्यूबिक मीटर')
      .replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 प्रतिशत')
      .replace(/₹\s*(\d+)/g, '$1 रुपये');
  } else {
    // English pronunciation normalization
    spoken = spoken
      // Specific compound units
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO2e\b/gi, '$1 kilograms of CO2 equivalent')
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO₂e\b/gi, '$1 kilograms of CO2 equivalent')
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO2\b/gi, '$1 kilograms of carbon dioxide')
      .replace(/\b(\d+(?:\.\d+)?)\s*kg\s*CO₂\b/gi, '$1 kilograms of carbon dioxide')
      .replace(/\bkg\s*CO2e\b/gi, 'kilograms of CO2 equivalent')
      .replace(/\bCO2e\b/gi, 'CO2 equivalent')
      .replace(/\bCO2\b/gi, 'carbon dioxide')
      .replace(/\bCO₂\b/gi, 'carbon dioxide')

      // Energy & measurements
      .replace(/\b(\d+(?:\.\d+)?)\s*kWh\b/gi, '$1 kilowatt-hours')
      .replace(/\bkWh\b/gi, 'kilowatt-hours')
      .replace(/\b(\d+(?:\.\d+)?)\s*km\b/gi, '$1 kilometers')
      .replace(/\b(\d+(?:\.\d+)?)\s*kms\b/gi, '$1 kilometers')
      .replace(/\b(\d+(?:\.\d+)?)\s*mi\b/gi, '$1 miles')
      .replace(/\bAQI\b/g, 'A-Q-I')
      .replace(/\bPM2\.5\b/gi, 'P-M 2.5')
      .replace(/\bPM10\b/gi, 'P-M 10')
      .replace(/\bµg\/m³\b/gi, 'micrograms per cubic meter')
      .replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent')
      .replace(/\$(\d+(?:\.\d+)?)/g, '$1 dollars')
      .replace(/₹\s*(\d+(?:\.\d+)?)/g, '$1 rupees');
  }

  // 2. Clean punctuation and spaces
  spoken = spoken
    .replace(/\s*([,;:.!?])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();

  return spoken;
}
