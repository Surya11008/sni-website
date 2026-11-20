import { getSaturdayToFridayWeek } from './dateUtils';

// Star calculations for Star Galaxy's 10 Activities
// Strictly adheres to the rules defined in the approved specification.

/**
 * 1. Simple Preaching
 * Rule: 10 Stars per completed 100 preaching count.
 * E.g., 100 -> 10, 500 -> 50, 750 -> 70.
 */
export function calculateSimplePreachingStars(totalCount) {
  const count = Number(totalCount) || 0;
  return Math.floor(count / 100) * 10;
}

/**
 * 2. Connections
 * Rules:
 * - Zion Visit: 10 Stars
 * - FMS-1 to FMS-9: 10 Stars per step
 * - 1-1 to 5-10: 10 Stars for every 2 selections
 * - SOM-1 to SOM-20: 10 Stars for every 4 selections
 */
export function calculateSingleConnectionStars(connection) {
  if (!connection || !connection.selections) return 0;
  let stars = 0;
  const selections = connection.selections;

  // Zion Visit
  if (selections.includes('ZION_VISIT')) {
    stars += 10;
  }

  // FMS-1 to FMS-9
  const fmsCount = selections.filter(s => s.startsWith('FMS-')).length;
  stars += fmsCount * 10;

  // 1-1 to 5-10: Series selections (e.g. "1-1", "2-5", "5-10")
  const seriesRegex = /^[1-5]-(10|[1-9])$/;
  const seriesCount = selections.filter(s => seriesRegex.test(s)).length;
  stars += Math.floor(seriesCount / 2) * 10;

  // SOM-1 to SOM-20
  const somCount = selections.filter(s => s.startsWith('SOM-')).length;
  stars += Math.floor(somCount / 4) * 10;

  return stars;
}

export function calculateTotalConnectionsStars(connections = []) {
  return connections.reduce((acc, curr) => acc + calculateSingleConnectionStars(curr), 0);
}

/**
 * 3. Fruits 🍇
 * Checklist:
 * - New Life: 50 Stars
 * - 1 Attend: 10 Stars
 * - 4 Attend: 10 Stars
 * - Tithe: 10 Stars
 * - NMS (Step-1): 10 Stars
 * - Education Attend: 10 Stars
 */
export function calculateSingleFruitStars(fruit) {
  if (!fruit || !fruit.checks) return 0;
  let stars = 0;
  if (fruit.checks.newLife) stars += 50;
  if (fruit.checks.attend1) stars += 10;
  if (fruit.checks.attend4) stars += 10;
  if (fruit.checks.tithe) stars += 10;
  if (fruit.checks.nmsStep1) stars += 10;
  if (fruit.checks.eduAttend) stars += 10;
  return stars;
}

export function calculateTotalFruitsStars(fruits = []) {
  return fruits.reduce((acc, curr) => acc + calculateSingleFruitStars(curr), 0);
}

/**
 * 4. Lost Sheep 🐑
 * Checklist (Same as Fruits, but "Found" replaces "New Life"):
 * - Found: 50 Stars
 * - 1 Attend: 10 Stars
 * - 4 Attend: 10 Stars
 * - Tithe: 10 Stars
 * - NMS (Step-1): 10 Stars
 * - Education Attend: 10 Stars
 */
export function calculateSingleLostSheepStars(sheep) {
  if (!sheep || !sheep.checks) return 0;
  let stars = 0;
  if (sheep.checks.found) stars += 50;
  if (sheep.checks.attend1) stars += 10;
  if (sheep.checks.attend4) stars += 10;
  if (sheep.checks.tithe) stars += 10;
  if (sheep.checks.nmsStep1) stars += 10;
  if (sheep.checks.eduAttend) stars += 10;
  return stars;
}

export function calculateTotalLostSheepStars(lostSheepList = []) {
  return lostSheepList.reduce((acc, curr) => acc + calculateSingleLostSheepStars(curr), 0);
}

/**
 * 5. Preaching Meeting
 * Rule: Daily Attendance check before appointed time (Default: 9:30 AM).
 * Weekly stars in cycle (Sat to Fri):
 * - 0 to 2 checks: 0 Stars
 * - 3 checks: 10 Stars
 * - 4 checks: 20 Stars
 * - 5 or more checks: 30 Stars
 */
export function calculatePreachingMeetingStars(attendances = []) {
  // Only count on-time attended checks
  const onTimeCount = attendances.filter(a => a.checked && a.onTime).length;
  if (onTimeCount >= 5) return 30;
  if (onTimeCount === 4) return 20;
  if (onTimeCount === 3) return 10;
  return 0;
}

/**
 * 6. Worship Arrival
 * Appointed Sessions:
 * - Saturday: 9:15 AM, 1:45 PM, 6:45 PM
 * - Tuesday: 6:45 PM
 * Weekly stars in cycle:
 * - 0 to 1 checks: 0 Stars
 * - 2 checks: 10 Stars
 * - 3 checks: 10 Stars
 * - 4 checks: 20 Stars
 */
export function calculateWorshipArrivalStars(attendances = []) {
  const onTimeCount = attendances.filter(a => a.checked && a.onTime).length;
  if (onTimeCount >= 4) return 20;
  if (onTimeCount >= 2) return 10;
  return 0;
}

/**
 * 7. Education 📚
 * Sessions: Morning, Afternoon, Evening.
 * Rule: Any number of sessions on the same calendar day counts as 1 day attended.
 * Weekly stars in cycle (Sat to Fri):
 * - 0 to 2 days: 0 Stars
 * - 3 to 5 days: 10 Stars
 * - 6 to 7 days: 20 Stars
 */
export function calculateEducationStars(sessionChecks = []) {
  // sessionChecks: array of { date: 'YYYY-MM-DD', session: 'morning'|'afternoon'|'evening' }
  const uniqueDays = new Set(sessionChecks.map(s => s.date));
  const daysCount = uniqueDays.size;

  if (daysCount >= 6) return 20;
  if (daysCount >= 3) return 10;
  return 0;
}

/**
 * 8. Elohim Academy
 * - Levels 1 to 5 (10 checks each = 50 checks)
 *   First 2 checks = 10 Stars.
 *   Thereafter every 1 additional check = +10 Stars.
 * - SOM 1 to 20 (20 checks)
 *   First 4 checks = 10 Stars.
 *   Thereafter every 2 additional checks = +10 Stars.
 */
export function calculateElohimAcademyStars(levelChecks = [], somChecks = []) {
  let stars = 0;
  const levelCount = levelChecks.length;
  if (levelCount >= 2) {
    stars += 10 + (levelCount - 2) * 10;
  }

  const somCount = somChecks.length;
  if (somCount >= 4) {
    stars += 10 + Math.floor((somCount - 4) / 2) * 10;
  }
  return stars;
}

/**
 * Elohim Academy Date-Based Breakdown
 */
export function calculateElohimDateBreakdown(levelChecks = [], somChecks = [], timestamps = {}) {
  // 1. Sort Level checks
  const sortedLevels = [...levelChecks].sort((a, b) => {
    const stampA = timestamps[a] || '';
    const stampB = timestamps[b] || '';
    const dateA = extractDateFromTimestamp(stampA);
    const dateB = extractDateFromTimestamp(stampB);
    if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
    return String(a).localeCompare(String(b));
  });

  // 2. Sort SOM checks
  const sortedSom = [...somChecks].sort((a, b) => {
    const stampA = timestamps[a] || '';
    const stampB = timestamps[b] || '';
    const dateA = extractDateFromTimestamp(stampA);
    const dateB = extractDateFromTimestamp(stampB);
    if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
    return String(a).localeCompare(String(b));
  });

  const starsByDate = {};
  const itemsByDate = {}; // { 'YYYY-MM-DD': [{ key, type: 'level'|'som' }] }
  const milestoneKeys = new Set();

  sortedLevels.forEach((key, index) => {
    const stamp = timestamps[key] || '';
    const date = extractDateFromTimestamp(stamp) || 'unknown';
    if (!itemsByDate[date]) itemsByDate[date] = [];
    itemsByDate[date].push({ key, type: 'level' });

    let milestoneStars = 0;
    if (index === 1) { // 2nd check
      milestoneStars = 10;
      milestoneKeys.add(key);
    } else if (index > 1) { // every 1 check after
      milestoneStars = 10;
      milestoneKeys.add(key);
    }

    if (milestoneStars > 0 && date !== 'unknown') {
      starsByDate[date] = (starsByDate[date] || 0) + milestoneStars;
    }
  });

  sortedSom.forEach((key, index) => {
    const stamp = timestamps[key] || '';
    const date = extractDateFromTimestamp(stamp) || 'unknown';
    if (!itemsByDate[date]) itemsByDate[date] = [];
    itemsByDate[date].push({ key, type: 'som' });

    let milestoneStars = 0;
    if (index === 3) { // 4th check
      milestoneStars = 10;
      milestoneKeys.add(key);
    } else if (index > 3 && (index - 3) % 2 === 0) { // every 2 checks after
      milestoneStars = 10;
      milestoneKeys.add(key);
    }

    if (milestoneStars > 0 && date !== 'unknown') {
      starsByDate[date] = (starsByDate[date] || 0) + milestoneStars;
    }
  });

  return {
    sortedLevels,
    sortedSom,
    starsByDate,
    itemsByDate,
    milestoneKeys,
    totalStars: calculateElohimAcademyStars(levelChecks, somChecks),
    totalCount: levelChecks.length + somChecks.length,
  };
}

export function calculateElohimAcademyStarsInRange(levelChecks = [], somChecks = [], timestamps = {}, startDate, endDate) {
  if (!startDate || !endDate) {
    return {
      stars: calculateElohimAcademyStars(levelChecks, somChecks),
      count: levelChecks.length + somChecks.length,
      activeItems: [...levelChecks, ...somChecks],
    };
  }

  const { starsByDate, itemsByDate } = calculateElohimDateBreakdown(levelChecks, somChecks, timestamps);
  let rangeStars = 0;
  const activeItems = [];

  Object.entries(itemsByDate).forEach(([date, list]) => {
    if (date >= startDate && date <= endDate) {
      activeItems.push(...list);
    }
  });

  Object.entries(starsByDate).forEach(([date, stars]) => {
    if (date >= startDate && date <= endDate) {
      rangeStars += stars;
    }
  });

  return {
    stars: rangeStars,
    count: activeItems.length,
    activeItems,
  };
}

/**
 * 9. Preaching Academy 📖
 * Books 1 to 12 (10 checks each = 120 checks)
 * Rule:
 * First 5 checks = 10 Stars.
 * Thereafter every 2 additional checks = +10 Stars.
 * (5-6 = 10⭐, 7-8 = 20⭐, 9-10 = 30⭐, 11-12 = 40⭐)
 */
export function calculatePreachingAcademyStars(bookChecks = []) {
  const count = bookChecks.length;
  if (count < 5) return 0;
  return 10 + Math.floor((count - 5) / 2) * 10;
}

/**
 * Preaching Academy Date-Based Breakdown
 */
export function calculatePreachingAcademyDateBreakdown(bookChecks = [], timestamps = {}) {
  const sorted = [...bookChecks].sort((a, b) => {
    const stampA = timestamps[a] || '';
    const stampB = timestamps[b] || '';
    const dateA = extractDateFromTimestamp(stampA);
    const dateB = extractDateFromTimestamp(stampB);
    if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
    return String(a).localeCompare(String(b));
  });

  const starsByDate = {};
  const itemsByDate = {};
  const milestoneKeys = new Set();

  sorted.forEach((key, index) => {
    const stamp = timestamps[key] || '';
    const date = extractDateFromTimestamp(stamp) || 'unknown';
    if (!itemsByDate[date]) itemsByDate[date] = [];
    itemsByDate[date].push(key);

    let milestoneStars = 0;
    if (index === 4) { // 5th check
      milestoneStars = 10;
      milestoneKeys.add(key);
    } else if (index > 4 && (index - 4) % 2 === 0) { // every 2 checks thereafter
      milestoneStars = 10;
      milestoneKeys.add(key);
    }

    if (milestoneStars > 0 && date !== 'unknown') {
      starsByDate[date] = (starsByDate[date] || 0) + milestoneStars;
    }
  });

  return {
    sortedBooks: sorted,
    starsByDate,
    itemsByDate,
    milestoneKeys,
    totalStars: calculatePreachingAcademyStars(bookChecks),
    totalCount: bookChecks.length,
  };
}

export function calculatePreachingAcademyStarsInRange(bookChecks = [], timestamps = {}, startDate, endDate) {
  if (!startDate || !endDate) {
    return {
      stars: calculatePreachingAcademyStars(bookChecks),
      count: bookChecks.length,
      activeItems: bookChecks,
    };
  }

  const { starsByDate, itemsByDate } = calculatePreachingAcademyDateBreakdown(bookChecks, timestamps);
  let rangeStars = 0;
  const activeItems = [];

  Object.entries(itemsByDate).forEach(([date, list]) => {
    if (date >= startDate && date <= endDate) {
      activeItems.push(...list);
    }
  });

  Object.entries(starsByDate).forEach(([date, stars]) => {
    if (date >= startDate && date <= endDate) {
      rangeStars += stars;
    }
  });

  return {
    stars: rangeStars,
    count: activeItems.length,
    activeItems,
  };
}

/**
 * 10. New Song Academy 🎶
 * Weekly Cycle Rule (Saturday to Friday):
 * - Within a single week cycle:
 *   - 0 to 5 checks = 0 Stars
 *   - 6 checks = 10 Stars
 *   - Every 3 additional checks in that same week cycle = +10 Stars (9 -> 20, 12 -> 30, 15 -> 40...)
 * - Weekly cycle resets every Saturday! Songs do not carry over between cycles.
 *   (e.g., if 3 checked last week and 3 checked this week, 0 stars for each week!)
 */
export function calculateNewSongWeekCycleStars(count = 0) {
  const num = Number(count) || 0;
  if (num < 6) return 0;
  return 10 + Math.floor((num - 6) / 3) * 10;
}

export function calculateNewSongAcademyStars(songChecks = [], timestamps = {}) {
  if (timestamps && Object.keys(timestamps).length > 0) {
    return calculateNewSongDateBreakdown(songChecks, timestamps).totalStars;
  }
  return calculateNewSongWeekCycleStars(songChecks.length);
}

/**
 * Extract YYYY-MM-DD from any timestamp format (DD-MM-YYYY, YYYY-MM-DD, or ISO)
 */
export function extractDateFromTimestamp(stamp) {
  if (!stamp) return '';
  const clean = stamp.includes('•') ? stamp.split('•')[0].trim() : stamp.trim();
  const dmyMatch = clean.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  const ymdMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch (e) {}
  return '';
}

/**
 * Calculate New Song Academy stars broken down by weekly cycles and dates.
 * Weekly cycle condition:
 * - Within each Saturday-to-Friday week cycle:
 *   - 6th song completed in that week = 10⭐
 *   - Every 3rd song thereafter in that same week (9th, 12th, 15th...) = +10⭐
 * - If last week 3 checked and this week 3 checked, 0 stars for each week!
 */
export function calculateNewSongDateBreakdown(songChecks = [], timestamps = {}) {
  const songsByWeek = {}; // { [weekStartDate]: [songNum, ...] }
  const songsByDate = {}; // { [dateStr]: [songNum, ...] }
  const starsByDate = {}; // { [dateStr]: number }
  const milestoneSongs = new Set();

  // First sort all songs chronologically
  const sorted = [...songChecks].sort((a, b) => {
    const stampA = timestamps[a] || '';
    const stampB = timestamps[b] || '';
    const dateA = extractDateFromTimestamp(stampA);
    const dateB = extractDateFromTimestamp(stampB);
    if (dateA && dateB && dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return a - b;
  });

  sorted.forEach(songNum => {
    const stamp = timestamps[songNum] || '';
    const dStr = extractDateFromTimestamp(stamp) || 'unknown';

    if (!songsByDate[dStr]) songsByDate[dStr] = [];
    songsByDate[dStr].push(songNum);

    let weekKey = 'unknown';
    if (dStr !== 'unknown') {
      try {
        const week = getSaturdayToFridayWeek(new Date(dStr));
        weekKey = week.startDate;
      } catch (e) {
        weekKey = 'unknown';
      }
    }

    if (!songsByWeek[weekKey]) songsByWeek[weekKey] = [];
    songsByWeek[weekKey].push(songNum);
  });

  let totalAllTimeStars = 0;

  // Process each week cycle independently!
  Object.entries(songsByWeek).forEach(([weekKey, weekSongList]) => {
    // Within this week cycle, the 6th song (index 5) earns 10 stars,
    // and every 3rd song thereafter (index 8, 11, 14...) earns +10 stars.
    weekSongList.forEach((songNum, indexInWeek) => {
      const stamp = timestamps[songNum] || '';
      const songDate = extractDateFromTimestamp(stamp) || 'unknown';

      let milestoneStars = 0;
      if (indexInWeek === 5) {
        milestoneStars = 10;
        milestoneSongs.add(songNum);
      } else if (indexInWeek > 5 && (indexInWeek - 5) % 3 === 0) {
        milestoneStars = 10;
        milestoneSongs.add(songNum);
      }

      if (milestoneStars > 0) {
        totalAllTimeStars += milestoneStars;
        if (songDate !== 'unknown') {
          starsByDate[songDate] = (starsByDate[songDate] || 0) + milestoneStars;
        }
      }
    });
  });

  return {
    sortedSongs: sorted,
    songsByWeek,
    starsByDate,
    songsByDate,
    milestoneSongs,
    totalStars: totalAllTimeStars,
    totalCount: songChecks.length,
  };
}

/**
 * Calculate New Song Academy stars and songs within a specific date range (or week cycle)
 */
export function calculateNewSongAcademyStarsInRange(songChecks = [], timestamps = {}, startDate, endDate) {
  if (!startDate || !endDate) {
    const breakdown = calculateNewSongDateBreakdown(songChecks, timestamps);
    return {
      stars: breakdown.totalStars,
      count: songChecks.length,
      activeSongs: songChecks,
    };
  }

  // Filter songs that were completed between startDate and endDate
  const activeSongs = [];
  songChecks.forEach(songNum => {
    const stamp = timestamps[songNum] || '';
    const dStr = extractDateFromTimestamp(stamp);
    if (dStr && dStr >= startDate && dStr <= endDate) {
      activeSongs.push(songNum);
    }
  });

  // Calculate stars earned directly within this week cycle
  const rangeStars = calculateNewSongWeekCycleStars(activeSongs.length);

  return {
    stars: rangeStars,
    count: activeSongs.length,
    activeSongs,
  };
}
