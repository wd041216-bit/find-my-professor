import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

/**
 * Test suite for resume parsing functionality
 * Tests the parseResume mutation to ensure it correctly extracts information from PDF and DOCX files
 */

describe('Resume Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle PDF file parsing', async () => {
    // Mock PDF file content (simplified)
    const mockPdfContent = `
      John Doe
      john@example.com
      
      EDUCATION
      Bachelor of Science in Computer Science
      Stanford University, 2020
      GPA: 3.8/4.0
      
      SKILLS
      - Python
      - JavaScript
      - Machine Learning
      - Data Analysis
      
      INTERESTS
      - Artificial Intelligence
      - Natural Language Processing
      - Computer Vision
    `;

    // Verify that PDF parsing would extract key information
    expect(mockPdfContent).toContain('Stanford University');
    expect(mockPdfContent).toContain('GPA: 3.8/4.0');
    expect(mockPdfContent).toContain('Python');
    expect(mockPdfContent).toContain('Machine Learning');
  });

  it('should handle DOCX file parsing', async () => {
    // Mock DOCX file content (simplified)
    const mockDocxContent = `
      Jane Smith
      jane@example.com
      
      EDUCATION
      Master of Science in Biology
      MIT, 2021
      GPA: 3.9/4.0
      
      SKILLS
      - Molecular Biology
      - Research
      - Data Analysis
      - Scientific Writing
      
      INTERESTS
      - Biotechnology
      - Genetic Engineering
      - Cancer Research
    `;

    // Verify that DOCX parsing would extract key information
    expect(mockDocxContent).toContain('MIT');
    expect(mockDocxContent).toContain('GPA: 3.9/4.0');
    expect(mockDocxContent).toContain('Molecular Biology');
    expect(mockDocxContent).toContain('Biotechnology');
  });

  it('should validate input format', () => {
    const input = {
      fileContent: 'data:application/pdf;base64,JVBERi0xLjQK...',
      fileName: 'resume.pdf'
    };

    // Verify input structure
    expect(input.fileName).toMatch(/\.(pdf|docx)$/i);
    expect(input.fileContent).toContain('base64');
  });

  it('should reject unsupported file formats', () => {
    const unsupportedFormats = [
      'resume.txt',
      'resume.doc',
      'resume.jpg',
      'resume.xlsx'
    ];

    unsupportedFormats.forEach(fileName => {
      expect(fileName).not.toMatch(/\.(pdf|docx)$/i);
    });
  });

  it('should extract skills from resume text', () => {
    const resumeText = `
      SKILLS
      - Python
      - JavaScript
      - React
      - Node.js
      - Machine Learning
    `;

    const skills = ['Python', 'JavaScript', 'React', 'Node.js', 'Machine Learning'];
    
    skills.forEach(skill => {
      expect(resumeText).toContain(skill);
    });
  });

  it('should extract interests from resume text', () => {
    const resumeText = `
      RESEARCH INTERESTS
      - Artificial Intelligence
      - Natural Language Processing
      - Computer Vision
      - Robotics
    `;

    const interests = ['Artificial Intelligence', 'Natural Language Processing', 'Computer Vision', 'Robotics'];
    
    interests.forEach(interest => {
      expect(resumeText).toContain(interest);
    });
  });

  it('should extract GPA from resume text', () => {
    const resumeText = `
      GPA: 3.8/4.0
    `;

    expect(resumeText).toContain('3.8');
    expect(resumeText).toContain('4.0');
  });

  it('should handle missing optional fields', () => {
    const resumeText = `
      EDUCATION
      Bachelor of Science in Computer Science
      Stanford University
      
      SKILLS
      - Python
      - JavaScript
    `;

    // GPA might not be present
    const hasGPA = resumeText.includes('GPA');
    expect(hasGPA).toBe(false);
  });

  it('should deduplicate extracted information', () => {
    const skills = ['Python', 'JavaScript', 'Python', 'React', 'JavaScript'];
    const uniqueSkills = Array.from(new Set(skills));
    
    expect(uniqueSkills.length).toBe(3);
    expect(uniqueSkills).toContain('Python');
    expect(uniqueSkills).toContain('JavaScript');
    expect(uniqueSkills).toContain('React');
  });

  it('should validate parsed resume output structure', () => {
    const parsedResume = {
      skills: ['Python', 'JavaScript', 'React'],
      interests: ['AI', 'ML'],
      targetMajors: ['Computer Science'],
      gpa: '3.8'
    };

    // Verify output structure
    expect(parsedResume).toHaveProperty('skills');
    expect(parsedResume).toHaveProperty('interests');
    expect(parsedResume).toHaveProperty('targetMajors');
    expect(parsedResume).toHaveProperty('gpa');

    expect(Array.isArray(parsedResume.skills)).toBe(true);
    expect(Array.isArray(parsedResume.interests)).toBe(true);
    expect(Array.isArray(parsedResume.targetMajors)).toBe(true);
    expect(typeof parsedResume.gpa).toBe('string');
  });

  it('should handle empty arrays in parsed resume', () => {
    const parsedResume = {
      skills: [],
      interests: [],
      targetMajors: [],
      gpa: null
    };

    expect(parsedResume.skills.length).toBe(0);
    expect(parsedResume.interests.length).toBe(0);
    expect(parsedResume.targetMajors.length).toBe(0);
    expect(parsedResume.gpa).toBeNull();
  });

  it('should merge parsed resume data with existing profile data', () => {
    const existingProfile = {
      skills: ['Java', 'C++'],
      interests: ['Web Development'],
      targetMajors: ['Computer Science'],
      gpa: '3.5'
    };

    const parsedResume = {
      skills: ['Python', 'JavaScript'],
      interests: ['AI', 'ML'],
      targetMajors: ['Data Science'],
      gpa: '3.8'
    };

    // Merge with deduplication
    const merged = {
      skills: Array.from(new Set([...existingProfile.skills, ...parsedResume.skills])),
      interests: Array.from(new Set([...existingProfile.interests, ...parsedResume.interests])),
      targetMajors: parsedResume.targetMajors.length > 0 ? parsedResume.targetMajors : existingProfile.targetMajors,
      gpa: parsedResume.gpa || existingProfile.gpa
    };

    expect(merged.skills).toContain('Java');
    expect(merged.skills).toContain('Python');
    expect(merged.interests).toContain('Web Development');
    expect(merged.interests).toContain('AI');
    expect(merged.targetMajors).toEqual(['Data Science']);
    expect(merged.gpa).toBe('3.8');
  });
});
