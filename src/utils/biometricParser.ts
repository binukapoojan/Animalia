/**
 * ANIMALIA — Biometric String & Metric Parser
 * Converts raw field measurements (mm, cm, m, g, kg, t) into standardized centimeters and kilograms.
 * Strictly adheres to GEMINI.md scientific integrity rules (zero fabricated measurements).
 */

export function parseLengthToCm(raw: any, explicitNumeric?: number | null): number | null {
  if (typeof explicitNumeric === 'number' && explicitNumeric > 0) {
    return Math.round(explicitNumeric * 100) / 100;
  }
  if (!raw || typeof raw !== 'string') return null;

  const str = raw.toLowerCase().trim();
  const mainSegment = str.split('+')[0].split(';')[0].trim();

  const regex = /([\d.,]+)\s*(?:[-–—to]+\s*([\d.,]+))?\s*(mm|cm|m|meters|metres|in|ft)?/i;
  const match = mainSegment.match(regex);
  if (!match) return null;

  const numStr = match[2] || match[1];
  const cleanNum = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(cleanNum) || cleanNum <= 0) return null;

  const unit = (match[3] || '').toLowerCase();
  let result = cleanNum;
  if (unit === 'm' || unit === 'meters' || unit === 'metres') {
    result = cleanNum * 100;
  } else if (unit === 'mm') {
    result = cleanNum / 10;
  } else if (unit === 'in') {
    result = cleanNum * 2.54;
  } else if (unit === 'ft') {
    result = cleanNum * 30.48;
  }

  return Math.round(result * 100) / 100;
}

export function parseMassToKg(raw: any, explicitNumeric?: number | null): number | null {
  if (typeof explicitNumeric === 'number' && explicitNumeric > 0) {
    return Math.round(explicitNumeric * 1000) / 1000;
  }
  if (!raw || typeof raw !== 'string') return null;

  const str = raw.toLowerCase().trim();
  const mainSegment = str.split('+')[0].split(';')[0].trim();

  const regex = /([\d.,]+)\s*(?:[-–—to]+\s*([\d.,]+))?\s*(mg|g|grams|kg|kilograms|t|tonnes|tons|lbs)?/i;
  const match = mainSegment.match(regex);
  if (!match) return null;

  const numStr = match[2] || match[1];
  const cleanNum = parseFloat(numStr.replace(/,/g, ''));
  if (isNaN(cleanNum) || cleanNum <= 0) return null;

  const unit = (match[3] || '').toLowerCase();
  let result = cleanNum;
  if (unit === 't' || unit === 'tonnes' || unit === 'tons') {
    result = cleanNum * 1000;
  } else if (unit === 'g' || unit === 'grams') {
    result = cleanNum / 1000;
  } else if (unit === 'mg') {
    result = cleanNum / 1000000;
  } else if (unit === 'lbs') {
    result = cleanNum * 0.453592;
  }

  return Math.round(result * 1000) / 1000;
}
