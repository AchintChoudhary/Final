// Mobile number validator for Indian 10-digit mobile numbers
export const isValidIndianMobile = (mobile) => {
  if (!mobile) return false;
  const cleaned = mobile.toString().replace(/[\s+-]/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(cleaned);
};

export const normalizeIndianMobile = (mobile) => {
  if (!mobile) return '';
  return mobile.toString().replace(/[\s+-]/g, '').slice(-10);
};

// Indian vehicle plate number format (e.g., MP09AB1234, DL01A1234, etc.)
export const isValidPlateNumber = (plate) => {
  if (!plate || typeof plate !== 'string') return false;
  const cleaned = plate.replace(/[\s-]/g, '').toUpperCase();
  // State code (2) + District (2) + Optional series (1-3 letters) + 4 digits
  return /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/.test(cleaned);
};

export const normalizePlateNumber = (plate) => {
  if (!plate) return '';
  return plate.replace(/[\s-]/g, '').toUpperCase();
};

export const isValidCoordinates = (lng, lat) => {
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
};
