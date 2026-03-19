import data from '../data/_list.json' assert { type: 'json' };

/**
 * Numbers of decimal digits to round to
 */
const scale = 3;

/**
 * Oblicza punkty na podstawie rankingu z pliku JSON
 */
export function score(rank, percent, minPercent) {
    // Konwertujemy wejścia na liczby, na wypadek gdyby przyszły jako stringi
    const r = Number(rank);
    const p = Number(percent);
    const mp = Number(minPercent);

    // 1. Sprawdzamy czy gracz osiągnął wymagany procent
    if (r > 0 && p < mp) {
        return 0;
    }

    // 2. Pobieramy długość listy z JSONa
    const maxRank = data.length + 1;

    // Zabezpieczenie na wypadek pustej listy lub błędu wczytywania
    if (!maxRank || maxRank === 0) return 0;
    
    // Jeśli jest tylko jeden poziom, dajemy 500 pkt
    if (maxRank === 1) return (r === 1) ? 500 : 0;

    const exponent = 2.8;

    // 3. Obliczamy bazę (nieliniowo)
    // Pilnujemy, żeby rank nie wyszedł poza zakres 1 - maxRank
    const safeRank = Math.max(1, Math.min(r, maxRank));
    const normalizedRank = (safeRank - 1) / (maxRank - 1);
    
    // Wzór: 500 na początku, 1 na końcu, spadek potęgowy
    const baseScore = 1 + (500 - 1) * Math.pow(1 - normalizedRank, exponent);

    // 4. Mnożnik procentowy (skalowanie progresu)
    const percentMultiplier = (p - (mp - 1)) / (100 - (mp - 1));
    let finalScore = baseScore * percentMultiplier;

    // 5. Kara za brak 100% (odejmujemy 1/3)
    if (p !== 100) {
        return round(finalScore * (2 / 3)); 
    }

    return Math.max(round(finalScore), 0);
}

export function round(num) {
    if (isNaN(num)) return 0;
    if (!('' + num).includes('e')) {
        return +(Math.round(num + 'e+' + scale) + 'e-' + scale);
    } else {
        var arr = ('' + num).split('e');
        var sig = '';
        if (+arr[1] + scale > 0) {
            sig = '+';
        }
        return +(
            Math.round(+arr[0] + 'e' + sig + (+arr[1] + scale)) +
            'e-' +
            scale
        );
    }
}