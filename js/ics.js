// "Add to your calendar": the next session as an .ics file (Apple, Outlook, Google and the rest open it) or a Google
// Calendar link. Pure, so it can be tested. A session is taken to last four hours unless said otherwise.

const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20261031T190000Z
// Text values escape backslashes, semicolons, commas and newlines; long lines fold at 75 octets (approximated by
// characters, which is safe for the short texts here).
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const fold = (line) => { const out = []; let s = line; while (s.length > 74) { out.push(s.slice(0, 74)); s = ` ${s.slice(74)}`; } out.push(s); return out.join('\r\n'); };

export function sessionIcs({ start, hours = 4, title, url = '', description = '', uid, now = new Date() }) {
  const end = new Date(Date.parse(start) + hours * 3600000);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DMs Satchel//Next session//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${uid}`, `DTSTAMP:${utc(now)}`, `DTSTART:${utc(start)}`, `DTEND:${utc(end)}`, `SUMMARY:${esc(title)}`,
    description || url ? `DESCRIPTION:${esc([description, url].filter(Boolean).join('\n'))}` : null, url ? `URL:${url}` : null,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean);
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

export function googleCalendarUrl({ start, hours = 4, title, url = '', description = '' }) {
  const end = new Date(Date.parse(start) + hours * 3600000);
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${utc(start)}/${utc(end)}`, details: [description, url].filter(Boolean).join('\n') });
  return `https://calendar.google.com/calendar/render?${q}`;
}
