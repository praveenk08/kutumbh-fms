const crypto = require('crypto');

const generateFamilyToken = (districtPrefix = 'BAL') => {
  const year = new Date().getFullYear();
  const randomBytes = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars hex
  return `${districtPrefix}-${year}-${randomBytes}`;
};

module.exports = { generateFamilyToken };