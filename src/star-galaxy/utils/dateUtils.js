// Date utility functions for Star Galaxy
// Star Galaxy cycle runs from Saturday to Friday!

export function getSaturdayToFridayWeek(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  
  // Calculate difference to previous or current Saturday
  // Saturday is day 6. If day is 6 (Sat), diff = 0.
  // If day is 0 (Sun), diff = -1.
  // If day is 1 (Mon), diff = -2.
  // If day is 5 (Fri), diff = -6.
  const diffToSaturday = day === 6 ? 0 : -(day + 1);
  
  const saturday = new Date(d);
  saturday.setDate(d.getDate() + diffToSaturday);
  saturday.setHours(0, 0, 0, 0);

  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  friday.setHours(23, 59, 59, 999);

  return {
    startDate: formatDate(saturday),
    endDate: formatDate(friday),
    startObj: saturday,
    endObj: friday,
  };
}

export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date = new Date()) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const formattedHours = String(hours).padStart(2, '0');

  return `${day}-${month}-${year} • ${formattedHours}:${minutes} ${ampm}`;
}

export function formatTimeOnly(date = new Date()) {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export function isDateInRange(dateStr, startDateStr, endDateStr) {
  if (!dateStr || !startDateStr || !endDateStr) return true;
  return dateStr >= startDateStr && dateStr <= endDateStr;
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const modifier = match[3]?.toUpperCase();
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  // fallback split
  const parts = clean.split(/[: ]+/);
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const modifier = parts[2]?.toUpperCase();
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Universal comparator extractor for news & moments posts
 * Strictly prioritizes post.date and post.time so New Date is UP and Old Date is DOWN.
 */
export function getPostSortTime(post) {
  if (!post) return 0;

  // 1. Primary: Post's Date and Time fields (e.g., '2026-11-02' & '06:45 PM')
  // New date UP, Old date DOWN as explicitly requested by user.
  if (post.date) {
    const ymd = String(post.date).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    const dmy = String(post.date).match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    let year = 0, month = 0, day = 0;
    if (ymd) {
      year = parseInt(ymd[1], 10);
      month = parseInt(ymd[2], 10) - 1;
      day = parseInt(ymd[3], 10);
    } else if (dmy) {
      day = parseInt(dmy[1], 10);
      month = parseInt(dmy[2], 10) - 1;
      year = parseInt(dmy[3], 10);
    }
    if (year > 1970 && day > 0) {
      let hours = 0, minutes = 0;
      if (post.time) {
        const tMatch = String(post.time).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (tMatch) {
          hours = parseInt(tMatch[1], 10);
          minutes = parseInt(tMatch[2], 10);
          const ampm = tMatch[3]?.toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
        }
      }
      const d = new Date(year, month, day, hours, minutes);
      if (!isNaN(d.getTime()) && d.getTime() > 0) return d.getTime();
    }
  }

  // 2. String createdAt (ISO or formatted string e.g. '2026-11-02T13:15:10Z' or '02-11-2026 • 06:45 PM')
  if (typeof post.createdAt === 'string' && post.createdAt.trim()) {
    const ddmmyyyy = post.createdAt.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s*[•,]?\s*(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      let hours = ddmmyyyy[4] ? parseInt(ddmmyyyy[4], 10) : 0;
      const minutes = ddmmyyyy[5] ? parseInt(ddmmyyyy[5], 10) : 0;
      const ampm = ddmmyyyy[6]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const d = new Date(year, month, day, hours, minutes);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    const t = new Date(post.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 3. Embedded timestamp in post ID (e.g. 'post-1793463503791')
  const idStr = String(post.id || post._id || '');
  const idMatch = idStr.match(/\b(?:post-)?(\d{12,14})\b/);
  if (idMatch) {
    const num = parseInt(idMatch[1], 10);
    if (!isNaN(num) && num > 1000000000000) return num;
  }

  // 4. Numeric timestamp / Firestore Timestamp object
  if (typeof post.timestamp === 'number' && !isNaN(post.timestamp) && post.timestamp > 0) {
    return post.timestamp;
  }
  if (post.timestamp && typeof post.timestamp.toMillis === 'function') {
    return post.timestamp.toMillis();
  }
  if (post.timestamp?.seconds) {
    return post.timestamp.seconds * 1000 + (post.timestamp.nanoseconds ? Math.floor(post.timestamp.nanoseconds / 1000000) : 0);
  }

  // 5. Numeric createdAt
  if (typeof post.createdAt === 'number' && !isNaN(post.createdAt) && post.createdAt > 0) {
    return post.createdAt;
  }
  if (post.createdAt && typeof post.createdAt.toMillis === 'function') {
    return post.createdAt.toMillis();
  }
  if (post.createdAt?.seconds) {
    return post.createdAt.seconds * 1000 + (post.createdAt.nanoseconds ? Math.floor(post.createdAt.nanoseconds / 1000000) : 0);
  }

  return 0;
}
