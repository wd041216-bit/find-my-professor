import { describe, it, expect } from 'vitest';
import {
  normalizeUniversity,
  normalizeMajor,
  getUniversitySuggestions,
  getMajorSuggestions,
} from '../shared/translations';

describe('University Translation', () => {
  it('should normalize Chinese university names to English', () => {
    expect(normalizeUniversity('麻省理工学院')).toBe('MIT');
    expect(normalizeUniversity('哈佛大学')).toBe('Harvard University');
    expect(normalizeUniversity('斯坦福大学')).toBe('Stanford University');
    expect(normalizeUniversity('清华大学')).toBe('Tsinghua University');
    expect(normalizeUniversity('北京大学')).toBe('Peking University');
  });

  it('should handle abbreviated Chinese names', () => {
    expect(normalizeUniversity('麻省理工')).toBe('MIT');
    expect(normalizeUniversity('哈佛')).toBe('Harvard University');
    expect(normalizeUniversity('清华')).toBe('Tsinghua University');
    expect(normalizeUniversity('北大')).toBe('Peking University');
  });

  it('should keep English names unchanged', () => {
    expect(normalizeUniversity('MIT')).toBe('MIT');
    expect(normalizeUniversity('Harvard University')).toBe('Harvard University');
    expect(normalizeUniversity('Stanford University')).toBe('Stanford University');
  });

  it('should return original input if no match found', () => {
    expect(normalizeUniversity('Unknown University')).toBe('Unknown University');
    expect(normalizeUniversity('未知大学')).toBe('未知大学');
  });

  it('should handle whitespace correctly', () => {
    expect(normalizeUniversity('  麻省理工学院  ')).toBe('MIT');
    expect(normalizeUniversity('  MIT  ')).toBe('MIT');
  });
});

describe('Major Translation', () => {
  it('should normalize Chinese major names to English', () => {
    expect(normalizeMajor('计算机科学')).toBe('Computer Science');
    expect(normalizeMajor('生物')).toBe('Biology');
    expect(normalizeMajor('物理学')).toBe('Physics');
    expect(normalizeMajor('化学')).toBe('Chemistry');
    expect(normalizeMajor('数学')).toBe('Mathematics');
  });

  it('should handle abbreviated Chinese names', () => {
    expect(normalizeMajor('计算机')).toBe('Computer Science');
    expect(normalizeMajor('物理')).toBe('Physics');
  });

  it('should keep English names unchanged', () => {
    expect(normalizeMajor('Computer Science')).toBe('Computer Science');
    expect(normalizeMajor('Biology')).toBe('Biology');
    expect(normalizeMajor('Physics')).toBe('Physics');
  });

  it('should handle various STEM fields', () => {
    expect(normalizeMajor('电子工程')).toBe('Electrical Engineering');
    expect(normalizeMajor('机械工程')).toBe('Mechanical Engineering');
    expect(normalizeMajor('人工智能')).toBe('Artificial Intelligence');
    expect(normalizeMajor('数据科学')).toBe('Data Science');
  });

  it('should handle business and social science fields', () => {
    expect(normalizeMajor('金融')).toBe('Finance');
    expect(normalizeMajor('会计')).toBe('Accounting');
    expect(normalizeMajor('心理学')).toBe('Psychology');
    expect(normalizeMajor('经济学')).toBe('Economics');
  });

  it('should return original input if no match found', () => {
    expect(normalizeMajor('Unknown Major')).toBe('Unknown Major');
    expect(normalizeMajor('未知专业')).toBe('未知专业');
  });
});

describe('University Suggestions', () => {
  it('should return suggestions for Chinese input', () => {
    const suggestions = getUniversitySuggestions('麻省');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].chinese).toContain('麻省');
  });

  it('should return suggestions for English input', () => {
    const suggestions = getUniversitySuggestions('mit');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.english.toLowerCase().includes('mit'))).toBe(true);
  });

  it('should return suggestions for partial matches', () => {
    const suggestions = getUniversitySuggestions('harvard');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.english.includes('Harvard'))).toBe(true);
  });

  it('should limit suggestions to 10 items', () => {
    const suggestions = getUniversitySuggestions('大学');
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });

  it('should return empty array for empty input', () => {
    const suggestions = getUniversitySuggestions('');
    expect(suggestions).toEqual([]);
  });

  it('should handle case-insensitive English search', () => {
    const suggestions1 = getUniversitySuggestions('STANFORD');
    const suggestions2 = getUniversitySuggestions('stanford');
    expect(suggestions1.length).toBe(suggestions2.length);
  });
});

describe('Major Suggestions', () => {
  it('should return suggestions for Chinese input', () => {
    const suggestions = getMajorSuggestions('计算机');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].chinese).toContain('计算机');
  });

  it('should return suggestions for English input', () => {
    const suggestions = getMajorSuggestions('computer');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.english.toLowerCase().includes('computer'))).toBe(true);
  });

  it('should return suggestions for partial matches', () => {
    const suggestions = getMajorSuggestions('biology');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.english.includes('Biology'))).toBe(true);
  });

  it('should limit suggestions to 10 items', () => {
    const suggestions = getMajorSuggestions('工程');
    expect(suggestions.length).toBeLessThanOrEqual(10);
  });

  it('should return empty array for empty input', () => {
    const suggestions = getMajorSuggestions('');
    expect(suggestions).toEqual([]);
  });

  it('should handle various fields correctly', () => {
    const stemSuggestions = getMajorSuggestions('工程');
    expect(stemSuggestions.length).toBeGreaterThan(0);
    
    const businessSuggestions = getMajorSuggestions('金融');
    expect(businessSuggestions.length).toBeGreaterThan(0);
    
    const scienceSuggestions = getMajorSuggestions('生物');
    expect(scienceSuggestions.length).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  it('should handle mixed Chinese-English input', () => {
    // Should return original if mixed
    expect(normalizeUniversity('MIT大学')).toBe('MIT大学');
    expect(normalizeMajor('Computer科学')).toBe('Computer科学');
  });

  it('should handle special characters', () => {
    expect(normalizeUniversity('St. Louis')).toBe('St. Louis');
    expect(normalizeMajor('AI/ML')).toBe('AI/ML');
  });

  it('should handle very long inputs', () => {
    const longInput = '这是一个非常非常长的大学名称' + '长'.repeat(100);
    expect(normalizeUniversity(longInput)).toBe(longInput);
  });

  it('should handle numeric inputs', () => {
    expect(normalizeUniversity('12345')).toBe('12345');
    expect(normalizeMajor('12345')).toBe('12345');
  });
});
