/**
 * @file tokenGenerator.test.js
 * @description Unit tests for Family Token Generator utility.
 */

const { generateFamilyToken } = require('../../src/utils/tokenGenerator');

describe('Token Generator Utility - Unit Tests', () => {
  it('should generate a token adhering to the standard format (PREFIX-YEAR-RANDOM)', () => {
    const token = generateFamilyToken('BAL');
    const currentYear = new Date().getFullYear();

    // Regex match: BAL-2026-XXXXXX (6 hex/alphanumeric characters)
    const pattern = new RegExp(`^BAL-${currentYear}-[A-F0-9]{6}$`);
    expect(token).toMatch(pattern);
  });

  it('should support dynamic district prefix parameter', () => {
    const token = generateFamilyToken('VAR');
    expect(token.startsWith('VAR-')).toBe(true);
  });

  it('should produce distinct tokens on consecutive invocations', () => {
    const token1 = generateFamilyToken('BAL');
    const token2 = generateFamilyToken('BAL');
    expect(token1).not.toBe(token2);
  });
});