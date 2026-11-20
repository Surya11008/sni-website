import { parseStampToDateAndTime } from './dateUtils';

/**
 * Calculates all-time stars earned across Levels (L1-1 to L5-10) and SOM (SOM-1 to SOM-20)
 */
export function calculateElohimAcademyStars(levelChecks = [], somChecks = []) {
  const levelCount = levelChecks.length;
  const levelStars = levelCount < 2 ? 0 : 10 + (Math.min(50, levelCount) - 2) * 10;

  const somCount = somChecks.length;
  const somStars = somCount < 4 ? 0 : 10 + Math.floor((Math.min(20, somCount) - 4) / 2) * 10;

  return levelStars + somStars;
}

/**
 * Breaks down star milestones by date chronologically
 */
export function calculateElohimDateBreakdown(levelChecks = [], somChecks = [], timestamps = {}) {
  const starsByDate = {};
  const milestoneKeys = new Set();

  // Helper to add stars to a specific date
  const addStarsToDate = (date, stars) => {
    if (!date || !stars) return;
    starsByDate[date] = (starsByDate[date] || 0) + stars;
  };

  // 1. Sort Level checks chronologically by timestamp
  const sortedLevel = [...levelChecks].map(key => {
    const stamp = timestamps[key];
    const parsed = parseStampToDateAndTime(stamp);
    return { key, stamp, parsed };
  }).sort((a, b) => a.parsed.sortableKey.localeCompare(b.parsed.sortableKey));

  // Level milestones:
  // Item 0: 0 stars
  // Item 1 (2nd lesson): Milestone 1 -> +10 stars
  // Item 2 (3rd lesson): Milestone 2 -> +10 stars
  // ...
  // Item 49 (50th lesson): Milestone 49 -> +10 stars
  sortedLevel.slice(0, 50).forEach((item, index) => {
    if (index >= 1) { // 2nd lesson onwards
      milestoneKeys.add(item.key);
      addStarsToDate(item.parsed.date, 10);
    }
  });

  // 2. Sort SOM checks chronologically by timestamp
  const sortedSom = [...somChecks].map(key => {
    const stamp = timestamps[key];
    const parsed = parseStampToDateAndTime(stamp);
    return { key, stamp, parsed };
  }).sort((a, b) => a.parsed.sortableKey.localeCompare(b.parsed.sortableKey));

  // SOM milestones:
  // Items 0, 1, 2: 0 stars
  // Item 3 (4th check): Milestone 1 -> +10 stars
  // Item 4: 0 stars
  // Item 5 (6th check): Milestone 2 -> +10 stars
  // Item 6: 0 stars
  // Item 7 (8th check): Milestone 3 -> +10 stars
  // ...
  // Item 19 (20th check): Milestone 9 -> +10 stars
  sortedSom.slice(0, 20).forEach((item, index) => {
    if (index === 3 || (index >= 5 && index % 2 === 1)) {
      milestoneKeys.add(item.key);
      addStarsToDate(item.parsed.date, 10);
    }
  });

  return {
    starsByDate,
    milestoneKeys,
  };
}

/**
 * Calculates stars and completed items in a given date range [startDate, endDate]
 */
export function calculateElohimAcademyStarsInRange(
  levelChecks = [],
  somChecks = [],
  timestamps = {},
  startDate = '',
  endDate = ''
) {
  const { starsByDate } = calculateElohimDateBreakdown(levelChecks, somChecks, timestamps);

  let stars = 0;
  if (startDate && endDate) {
    Object.keys(starsByDate).forEach(date => {
      if (date >= startDate && date <= endDate) {
        stars += starsByDate[date] || 0;
      }
    });
  } else {
    // If no range specified, sum all
    stars = Object.values(starsByDate).reduce((sum, v) => sum + v, 0);
  }

  // Count items completed in the date range
  let count = 0;
  const allKeys = [...levelChecks, ...somChecks];
  allKeys.forEach(key => {
    const stamp = timestamps[key];
    if (!stamp) return;
    const parsed = parseStampToDateAndTime(stamp);
    if (!startDate || !endDate) {
      count++;
    } else if (parsed.date >= startDate && parsed.date <= endDate) {
      count++;
    }
  });

  return { stars, count };
}
