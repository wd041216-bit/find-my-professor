import { invokeLLM } from "../_core/llm";

/**
 * University identification result from LLM
 */
export interface UniversityIdentification {
  normalizedName: string;
  aliases: string[];
  country: string;
  region: string;
  confidence: number;
  reasoning: string;
}

/**
 * Major identification result from LLM
 */
export interface MajorIdentification {
  normalizedName: string;
  aliases: string[];
  category: string;
  field: string;
  relatedMajors: string[];
  confidence: number;
  reasoning: string;
}

/**
 * Normalization Service
 * 
 * Handles AI-driven identification and normalization of university and major names.
 * Phase 1: Core LLM identification (database caching to be implemented later)
 */
export class NormalizationService {
  
  /**
   * Normalize university name using LLM
   * TODO: Add database caching in Phase 2
   */
  static async normalizeUniversity(rawInput: string): Promise<UniversityIdentification> {
    return await this.identifyUniversity(rawInput);
  }

  /**
   * Normalize major name using LLM
   * TODO: Add database caching in Phase 2
   */
  static async normalizeMajor(rawInput: string): Promise<MajorIdentification> {
    return await this.identifyMajor(rawInput);
  }

  /**
   * Identify university using LLM
   */
  static async identifyUniversity(rawInput: string): Promise<UniversityIdentification> {
    const prompt = `You are a university identification expert. Given a user's input about a university name, identify the official university name and provide relevant information.

User input: "${rawInput}"

Your task:
1. Identify the official, full name of the university
2. List common aliases, abbreviations, or alternative names
3. Identify the country and region
4. Provide a confidence score (0.0-1.0)
5. Explain your reasoning

Important notes:
- Handle abbreviations (e.g., "MIT" → "Massachusetts Institute of Technology")
- Handle informal names (e.g., "UC Berkeley" → "University of California, Berkeley")
- Handle different languages (e.g., "清华大学" → "Tsinghua University")
- Handle typos and misspellings
- If multiple universities match, choose the most famous one
- If unsure, provide your best guess with lower confidence

Respond in JSON format:
{
  "normalizedName": "Official University Name",
  "aliases": ["Alias 1", "Alias 2", "Abbreviation"],
  "country": "Country Name",
  "region": "Region/State/Province",
  "confidence": 0.95,
  "reasoning": "Explanation of your identification"
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a university identification expert. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "university_identification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              normalizedName: { type: "string", description: "Official full name of the university" },
              aliases: { 
                type: "array", 
                items: { type: "string" },
                description: "Common aliases, abbreviations, or alternative names"
              },
              country: { type: "string", description: "Country where the university is located" },
              region: { type: "string", description: "Region, state, or province" },
              confidence: { type: "number", description: "Confidence score between 0.0 and 1.0" },
              reasoning: { type: "string", description: "Explanation of the identification" }
            },
            required: ["normalizedName", "aliases", "country", "region", "confidence", "reasoning"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("LLM returned empty or invalid response");
    }

    return JSON.parse(content);
  }

  /**
   * Identify major using LLM
   */
  static async identifyMajor(rawInput: string): Promise<MajorIdentification> {
    const prompt = `You are a major/field of study identification expert. Given a user's input about their major or field of study, identify the standard major name and provide relevant information.

User input: "${rawInput}"

Your task:
1. Identify the standard, official name of the major
2. List common aliases or alternative names
3. Identify the major category (e.g., "STEM", "Humanities", "Social Sciences", "Business", "Arts")
4. Identify the specific field (e.g., "Computer Science", "Biology", "Economics")
5. List related majors that might be relevant
6. Provide a confidence score (0.0-1.0)
7. Explain your reasoning

Important notes:
- Handle abbreviations (e.g., "CS" → "Computer Science")
- Handle informal names (e.g., "Bio" → "Biology")
- Handle different languages (e.g., "计算机科学" → "Computer Science")
- Handle interdisciplinary fields (e.g., "Bioinformatics" relates to both Biology and Computer Science)
- If multiple majors match, choose the most common one
- If unsure, provide your best guess with lower confidence

Respond in JSON format:
{
  "normalizedName": "Standard Major Name",
  "aliases": ["Alias 1", "Alias 2", "Abbreviation"],
  "category": "Major Category",
  "field": "Specific Field",
  "relatedMajors": ["Related Major 1", "Related Major 2"],
  "confidence": 0.95,
  "reasoning": "Explanation of your identification"
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a major/field of study identification expert. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "major_identification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              normalizedName: { type: "string", description: "Standard official name of the major" },
              aliases: { 
                type: "array", 
                items: { type: "string" },
                description: "Common aliases or alternative names"
              },
              category: { type: "string", description: "Major category (STEM, Humanities, etc.)" },
              field: { type: "string", description: "Specific field within the category" },
              relatedMajors: { 
                type: "array", 
                items: { type: "string" },
                description: "Related majors that might be relevant"
              },
              confidence: { type: "number", description: "Confidence score between 0.0 and 1.0" },
              reasoning: { type: "string", description: "Explanation of the identification" }
            },
            required: ["normalizedName", "aliases", "category", "field", "relatedMajors", "confidence", "reasoning"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("LLM returned empty or invalid response");
    }

    return JSON.parse(content);
  }

  /**
   * Batch normalize universities
   */
  static async normalizeUniversities(rawInputs: string[]): Promise<UniversityIdentification[]> {
    const results = [];
    for (const rawInput of rawInputs) {
      const result = await this.normalizeUniversity(rawInput);
      results.push(result);
    }
    return results;
  }

  /**
   * Batch normalize majors
   */
  static async normalizeMajors(rawInputs: string[]): Promise<MajorIdentification[]> {
    const results = [];
    for (const rawInput of rawInputs) {
      const result = await this.normalizeMajor(rawInput);
      results.push(result);
    }
    return results;
  }
}
