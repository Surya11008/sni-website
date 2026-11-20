/**
 * Date and Time utilities for Stars Program and Elohim Academy
 */

export function formatDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTimeOnly(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '12:00 PM';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export function formatDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy} • ${formatTimeOnly(d)}`;
}

export function time12To24(time12) {
  if (!time12) return '12:00';
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return '12:00';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

export function time24To12(time24) {
  if (!time24) return '12:00 PM';
  const parts = time24.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export function createStampFromDateAndTime(dateStr, time12Str = '12:00 PM') {
  if (!dateStr) return formatDateTime(new Date());
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}-${mm}-${yyyy} • ${time12Str}`;
  }
  return `${dateStr} • ${time12Str}`;
}

export function parseStampToDateAndTime(stamp) {
  if (!stamp) {
    const today = formatDate(new Date());
    const time = formatTimeOnly(new Date());
    return { date: today, time12: time, time24: time12To24(time), sortableKey: `${today} 12:00` };
  }

  let datePart = '';
  let timePart = '12:00 PM';

  if (typeof stamp === 'string' && stamp.includes('•')) {
    const [d, t] = stamp.split('•');
    datePart = d.trim();
    timePart = t ? t.trim() : '12:00 PM';
  } else if (typeof stamp === 'string') {
    datePart = stamp.trim();
  } else {
    datePart = formatDate(new Date());
  }

  let yyyyMmDd = '';
  const dmyMatch = datePart.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmyMatch) {
    yyyyMmDd = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  } else {
    const ymdMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      yyyyMmDd = `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
    } else {
      try {
        const d = new Date(datePart);
        if (!isNaN(d.getTime())) yyyyMmDd = formatDate(d);
      } catch (e) {
        // fallback
      }
    }
  }

  if (!yyyyMmDd) yyyyMmDd = formatDate(new Date());
  const time24 = time12To24(timePart);

  return {
    date: yyyyMmDd,
    time12: timePart,
    time24,
    sortableKey: `${yyyyMmDd} ${time24}`,
  };
}

export function getCurrentWeekRange(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  // Let week start on Sunday or Monday. Let's make Monday start:
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
  };
}
