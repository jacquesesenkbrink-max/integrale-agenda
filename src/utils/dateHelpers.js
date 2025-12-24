// src/utils/dateHelpers.js

// Een vaste datum voor als we het niet weten (31 dec 9999)
// Dit zorgt dat items zonder datum netjes onderaan de lijst belanden
const FALLBACK_DATE = new Date(9999, 11, 31);

export function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return FALLBACK_DATE;

    let resultDate = null;

    // 1. Q-notatie check (bijv. "Q1 2026")
    if (dateStr.toLowerCase().includes('q')) {
        const parts = dateStr.split(' ');
        const kwartaal = parts[0].toLowerCase(); // q1, q2 etc
        const jaarStr = parts[1];
        
        if (jaarStr && !isNaN(jaarStr)) {
            const year = parseInt(jaarStr);
            if (kwartaal === 'q1') resultDate = new Date(year, 2, 1);       // 1 Maart
            else if (kwartaal === 'q2') resultDate = new Date(year, 5, 1);  // 1 Juni
            else if (kwartaal === 'q3') resultDate = new Date(year, 8, 1);  // 1 Sept
            else if (kwartaal === 'q4') resultDate = new Date(year, 11, 1); // 1 Dec
        }
    }

    // 2. Alleen jaartal (bijv. "2026")
    else if (dateStr.trim().length === 4 && !isNaN(dateStr)) {
        resultDate = new Date(parseInt(dateStr), 0, 1); // 1 Januari
    }

    // 3. Standaard datum formaat dd-mm-yyyy
    else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // new Date(jaar, maandIndex, dag) -> let op: maand is 0-based in JS (0 = jan)
            const dag = parseInt(parts[0]);
            const maand = parseInt(parts[1]) - 1;
            const jaar = parseInt(parts[2]);
            resultDate = new Date(jaar, maand, dag);
        }
    }
    
    // 4. Laatste poging: laat JavaScript het proberen
    else {
        resultDate = new Date(dateStr);
    }

    // --- DE BELANGRIJKE CHECK ---
    // Is het gelukt? Is het een geldige datum? Zo niet: return fallback.
    if (resultDate instanceof Date && !isNaN(resultDate.getTime())) {
        return resultDate;
    }

    return FALLBACK_DATE;
}

export function getMonthName(dateObj) {
    // Check of de datum geldig is en niet ons '9999' fallback jaar is
    if (!dateObj || isNaN(dateObj.getTime()) || dateObj.getFullYear() === 9999) {
        return 'Datum onbekend';
    }
    
    try {
        const raw = dateObj.toLocaleString('nl-NL', { month: 'long', year: 'numeric' });
        // Hoofdletter fix (november 2025 -> November 2025)
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch (e) {
        return 'Datum onbekend';
    }
}

// Oude helper (voor backward compatibility)
export function getSortDate(item) {
    if (item.schedule) {
        const dates = Object.values(item.schedule).filter(d => d); // filter lege strings
        if (dates.length > 0) return parseDate(dates[0]);
    }
    return FALLBACK_DATE;
}