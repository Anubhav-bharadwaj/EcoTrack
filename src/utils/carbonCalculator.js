// ═══════════════════════════════════════════════════
// ECOTRACK AI — CARBON CALCULATOR ENGINE
// ═══════════════════════════════════════════════════

/**
 * Emission factors in kg CO2 equivalent.
 * Sources: EPA, DEFRA, Our World in Data (averaged/simplified for consumer use).
 */
export const EMISSION_FACTORS = {
  transport: {
    car: 0.21,           // per km
    bus: 0.089,          // per km
    train: 0.041,        // per km
    flight: 0.255,       // per km
    bike: 0,             // per km
    walk: 0,             // per km
    electric_car: 0.05,  // per km
    motorcycle: 0.103,   // per km
  },
  electricity: {
    kwh: 0.42,           // world average per kWh
  },
  food: {
    beef: 6.61,          // per meal
    chicken: 1.82,       // per meal
    pork: 2.41,          // per meal
    fish: 1.34,          // per meal
    vegetarian: 0.51,    // per meal
    vegan: 0.37,         // per meal
  },
  shopping: {
    clothing: 10,        // per item
    electronics: 50,     // per item
    groceries: 3.5,      // per bag
    furniture: 30,       // per item
  },
};

/**
 * Calculate CO2 emissions for a given activity.
 * @param {string} category - transport | electricity | food | shopping
 * @param {string} type - sub-type within the category
 * @param {number} value - quantity (km, kWh, meals, items)
 * @returns {number} CO2 in kg, rounded to 2 decimal places
 */
export function calculateCO2(category, type, value) {
  const normalizedCategory = category.toLowerCase();
  const normalizedType = type.toLowerCase().replace(/\s+/g, '_');

  const categoryFactors = EMISSION_FACTORS[normalizedCategory];
  if (!categoryFactors) {
    console.warn(`Unknown category: ${category}`);
    return 0;
  }

  const factor = categoryFactors[normalizedType];
  if (factor === undefined) {
    console.warn(`Unknown type: ${type} in category: ${category}`);
    return 0;
  }

  return Math.round(factor * value * 100) / 100;
}

/**
 * Calculate the EcoScore (0–100).
 * Starts at 100, deducts based on daily average vs 6.5kg target.
 * Bonuses for streaks and completed challenges.
 * @param {Array} activities - list of activity objects
 * @param {number} completedChallenges - number of completed challenges
 * @returns {number} score clamped to 0–100
 */
export function calculateEcoScore(activities, completedChallenges = 0) {
  if (!activities || activities.length === 0) return 100;

  let score = 100;
  const dailyTarget = 6.5; // kg CO2 per day
  const dailyAvg = getDailyAverage(activities, 30);

  // Deduct points if exceeding daily target
  if (dailyAvg > dailyTarget) {
    const excessRatio = (dailyAvg - dailyTarget) / dailyTarget;
    score -= Math.min(50, Math.round(excessRatio * 40));
  } else {
    // Bonus for being under target
    const underRatio = (dailyTarget - dailyAvg) / dailyTarget;
    score += Math.min(10, Math.round(underRatio * 15));
  }

  // Streak bonus
  const streak = getCurrentStreak(activities);
  if (streak >= 7) score += 5;
  else if (streak >= 3) score += 2;

  // Challenge bonus
  score += Math.min(15, completedChallenges * 3);

  // Green activity bonus (bike, walk, vegan, vegetarian)
  const greenActivities = activities.filter(
    (a) =>
      a.type === 'bike' ||
      a.type === 'walk' ||
      a.type === 'vegan' ||
      a.type === 'vegetarian'
  );
  const greenRatio = greenActivities.length / Math.max(1, activities.length);
  score += Math.round(greenRatio * 10);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get the eco tier label, emoji, and color based on score.
 * @param {number} score - EcoScore 0–100
 * @returns {{ label: string, emoji: string, color: string }}
 */
export function getEcoTier(score) {
  if (score >= 90) return { label: 'Optimal Efficiency', emoji: '✅', color: '#059669' };
  if (score >= 75) return { label: 'High Efficiency', emoji: '📈', color: '#10b981' };
  if (score >= 60) return { label: 'Standard', emoji: '📊', color: '#34d399' };
  if (score >= 45) return { label: 'Below Target', emoji: '⚠️', color: '#fbbf24' };
  if (score >= 30) return { label: 'Low Efficiency', emoji: '📉', color: '#f59e0b' };
  return { label: 'Critical Review', emoji: '🛑', color: '#ef4444' };
}

/**
 * Get fun equivalencies for a given CO2 amount.
 * @param {number} co2Kg - CO2 in kilograms
 * @returns {{ trees: number, drivingKm: number, flights: number, showers: number, smartphones: number, description: string }}
 */
export function getEquivalent(co2Kg) {
  const trees = Math.round(co2Kg / 21 * 100) / 100;          // 1 tree absorbs ~21 kg/year
  const drivingKm = Math.round(co2Kg / 0.21 * 10) / 10;      // avg car emissions
  const flights = Math.round(co2Kg / 255 * 100) / 100;        // ~255 kg per short-haul flight
  const showers = Math.round(co2Kg / 0.4 * 10) / 10;          // ~0.4 kg per 8-min shower
  const smartphones = Math.round(co2Kg / 0.008 * 10) / 10;    // ~8g per full charge

  let description = '';
  if (co2Kg >= 255) {
    description = `That's like ${flights} short flights ✈️`;
  } else if (co2Kg >= 21) {
    description = `That's what ${trees} trees absorb in a year 🌳`;
  } else if (co2Kg >= 5) {
    description = `That's like driving ${drivingKm} km 🚗`;
  } else if (co2Kg >= 1) {
    description = `That's like ${showers} hot showers 🚿`;
  } else {
    description = `That's like charging ${smartphones} smartphones 📱`;
  }

  return { trees, drivingKm, flights, showers, smartphones, description };
}

/**
 * Get the daily average CO2 over a given number of days.
 * @param {Array} activities - list of activity objects
 * @param {number} days - number of past days to consider
 * @returns {number} daily average in kg CO2
 */
export function getDailyAverage(activities, days = 30) {
  if (!activities || activities.length === 0) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const recent = activities.filter((a) => new Date(a.date) >= cutoff);
  const total = recent.reduce((sum, a) => sum + (a.co2 || 0), 0);

  return Math.round((total / days) * 100) / 100;
}

/**
 * Get CO2 breakdown by category.
 * @param {Array} activities - list of activity objects
 * @returns {{ transport: number, electricity: number, food: number, shopping: number }}
 */
export function getCategoryBreakdown(activities) {
  const breakdown = {
    transport: 0,
    electricity: 0,
    food: 0,
    shopping: 0,
  };

  if (!activities) return breakdown;

  activities.forEach((a) => {
    const cat = a.category?.toLowerCase();
    if (breakdown[cat] !== undefined) {
      breakdown[cat] += a.co2 || 0;
    }
  });

  // Round values
  Object.keys(breakdown).forEach((key) => {
    breakdown[key] = Math.round(breakdown[key] * 100) / 100;
  });

  return breakdown;
}

/**
 * Get weekly data for chart rendering.
 * Returns an array of 7 objects for the last 7 days.
 * @param {Array} activities - list of activity objects
 * @returns {Array<{name: string, co2: number}>}
 */
export function getWeeklyData(activities) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayCO2 = (activities || [])
      .filter((a) => {
        const actDate = new Date(a.date);
        return actDate >= date && actDate < nextDay;
      })
      .reduce((sum, a) => sum + (a.co2 || 0), 0);

    data.push({
      name: dayNames[date.getDay()],
      co2: Math.round(dayCO2 * 100) / 100,
    });
  }

  return data;
}

/**
 * Get total CO2 from all activities.
 * @param {Array} activities
 * @returns {number}
 */
export function totalCO2(activities) {
  if (!activities || activities.length === 0) return 0;
  return Math.round(activities.reduce((sum, a) => sum + (a.co2 || 0), 0) * 100) / 100;
}

/**
 * Get CO2 for the current month only.
 * @param {Array} activities
 * @returns {number}
 */
export function monthlyCO2(activities) {
  if (!activities || activities.length === 0) return 0;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthActivities = activities.filter((a) => new Date(a.date) >= monthStart);
  return Math.round(monthActivities.reduce((sum, a) => sum + (a.co2 || 0), 0) * 100) / 100;
}

/**
 * Get CO2 for the last 7 days.
 * @param {Array} activities
 * @returns {number}
 */
export function weeklyCO2(activities) {
  if (!activities || activities.length === 0) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  cutoff.setHours(0, 0, 0, 0);

  const weekActivities = activities.filter((a) => new Date(a.date) >= cutoff);
  return Math.round(weekActivities.reduce((sum, a) => sum + (a.co2 || 0), 0) * 100) / 100;
}

/**
 * Calculate the current streak (consecutive days with at least one activity).
 * @param {Array} activities
 * @returns {number} number of consecutive days
 */
export function getCurrentStreak(activities) {
  if (!activities || activities.length === 0) return 0;

  // Get unique dates (as date strings)
  const dateSet = new Set();
  activities.forEach((a) => {
    const d = new Date(a.date);
    dateSet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;

    if (dateSet.has(key)) {
      streak++;
    } else {
      // Allow today to be missing (streak continues from yesterday)
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

/**
 * Get a unit label for a category.
 * @param {string} category
 * @returns {string}
 */
export function getUnitForCategory(category) {
  switch (category?.toLowerCase()) {
    case 'transport': return 'km';
    case 'electricity': return 'kWh';
    case 'food': return 'meals';
    case 'shopping': return 'items';
    default: return 'units';
  }
}
