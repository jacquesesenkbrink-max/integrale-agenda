// src/utils/dateHelpers.js

// Deze functie zet strings als "25-11-2025" of "Q1 2026" om naar een echt Date object
export function parseDate(dateStr) {
    if (!dateStr) return new Date(9999, 11, 31); // Fallback: ver in de toekomst

    // 1. Q-notatie (bijv. "Q1 2026" of "Q3 2027")
    if (dateStr.toLowerCase().includes('q')) {
        const year = parseInt(dateStr.slice(-4));
        if (dateStr.includes('Q1')) return new Date(year, 2, 1);  // 1 Maart
        if (dateStr.includes('Q2')) return new Date(year, 5, 1);  // 1 Juni
        if (dateStr.includes('Q3')) return new Date(year, 8, 1);  // 1 Sept
        if (dateStr.includes('Q4')) return new Date(year, 11, 1); // 1 Dec
    }

    // 2. Alleen jaartal (bijv. "2026")
    if (dateStr.length === 4 && !isNaN(dateStr)) {
        return new Date(parseInt(dateStr), 0, 1); // 1 Januari
    }

    // 3. Standaard datum formaat dd-mm-yyyy
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        // new Date(jaar, maandIndex, dag) -> let op: maand is 0-based in JS (0 = jan)
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    return new Date(dateStr); // Laatste poging voor overige formaten
}

// Helper voor mooie maandnamen (bijv. "November 2025")
export function getMonthName(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return 'Datum onbekend';
    // Zorgt voor hoofdletter aan het begin (nl-NL geeft soms kleine letters)
    const raw = dateObj.toLocaleString('nl-NL', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Oude helper (voor backward compatibility met je oude code, als die nog ergens staat)
export function getSortDate(item) {
    // Pakt de eerste datum die hij kan vinden in het schedule
    if (item.schedule) {
        const dates = Object.values(item.schedule);
        if (dates.length > 0) return parseDate(dates[0]);
    }
    return new Date(9999, 11, 31);
}