/**
 * Generates a unique family token in the format: <prefix>-<XXXXXX>
 * e.g. BAL-A1B2C3
 * @param {string} prefix - District/area prefix (defaults to process.env.DISTRICT_PREFIX or 'BAL')
 * @param {number} length - Number of random alphanumeric characters
 * @returns {string}
 */
function generateFamilyToken(prefix = process.env.DISTRICT_PREFIX || 'BAL', length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${token}`;
}

/**
 * Generates a unique member reference ID tied to the family token.
 * e.g. BAL-A1B2C3-M01
 * @param {string} familyToken - The parent family's token
 * @param {number} index - 1-based position of the member in the family
 * @returns {string}
 */
function generateMemberId(familyToken, index) {
  const paddedIndex = String(index).padStart(2, '0');
  return `${familyToken}-M${paddedIndex}`;
}

module.exports = { generateFamilyToken, generateMemberId };