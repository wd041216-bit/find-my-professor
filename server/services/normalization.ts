import { invokeLLM } from "../_core/llm";
import mysql from 'mysql2/promise';
import { ENV } from '../_core/env';

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

// Database connection pool
let connectionPool: mysql.Pool | null = null;

function getConnectionPool(): mysql.Pool {
  if (!connectionPool && process.env.DATABASE_URL) {
    connectionPool = mysql.createPool(process.env.DATABASE_URL);
  }
  if (!connectionPool) {
    throw new Error('Database connection not available');
  }
  return connectionPool;
}

/**
 * Normalization Service
 * 
 * Handles AI-driven identification and normalization of university and major names.
 * Implements "one LLM call, permanent reuse" strategy with database caching.
 */
export class NormalizationService {
  
  /**
   * Normalize university name with database caching
   * Strategy: Check cache first, call LLM only if cache miss, then store result
   */
  static async normalizeUniversity(rawInput: string, userId?: number): Promise<UniversityIdentification> {
    const normalizedInput = rawInput.trim().toLowerCase();
    
    // Step 1: Check cache
    const cached = await this.getCachedUniversity(normalizedInput);
    if (cached) {
      console.log(`[Normalization] Cache HIT for university: "${rawInput}"`);
      
      // Update usage count and last used timestamp
      await this.updateUniversityCacheUsage(cached.id);
      
      // Log user input history
      if (userId) {
        await this.logUserInput(userId, 'university', rawInput, cached.id);
      }
      
      return {
        normalizedName: cached.normalized_name,
        aliases: JSON.parse(cached.aliases),
        country: cached.country,
        region: cached.region,
        confidence: parseFloat(cached.confidence),
        reasoning: cached.reasoning
      };
    }
    
    // Step 2: Cache MISS - Call LLM
    console.log(`[Normalization] Cache MISS for university: "${rawInput}" - calling LLM`);
    const result = await this.identifyUniversity(rawInput);
    
    // Step 3: Store result in cache
    const cacheId = await this.cacheUniversityResult(normalizedInput, result);
    
    // Step 4: Log user input history
    if (userId) {
      await this.logUserInput(userId, 'university', rawInput, cacheId);
    }
    
    return result;
  }

  /**
   * Normalize major name with database caching
   * Strategy: Check cache first, call LLM only if cache miss, then store result
   */
  static async normalizeMajor(rawInput: string, userId?: number): Promise<MajorIdentification> {
    const normalizedInput = rawInput.trim().toLowerCase();
    
    // Step 1: Check cache
    const cached = await this.getCachedMajor(normalizedInput);
    if (cached) {
      console.log(`[Normalization] Cache HIT for major: "${rawInput}"`);
      
      // Update usage count and last used timestamp
      await this.updateMajorCacheUsage(cached.id);
      
      // Log user input history
      if (userId) {
        await this.logUserInput(userId, 'major', rawInput, cached.id);
      }
      
      return {
        normalizedName: cached.normalized_name,
        aliases: JSON.parse(cached.aliases),
        category: cached.category,
        field: cached.field,
        relatedMajors: JSON.parse(cached.related_majors),
        confidence: parseFloat(cached.confidence),
        reasoning: cached.reasoning
      };
    }
    
    // Step 2: Cache MISS - Call LLM
    console.log(`[Normalization] Cache MISS for major: "${rawInput}" - calling LLM`);
    const result = await this.identifyMajor(rawInput);
    
    // Step 3: Store result in cache
    const cacheId = await this.cacheMajorResult(normalizedInput, result);
    
    // Step 4: Log user input history
    if (userId) {
      await this.logUserInput(userId, 'major', rawInput, cacheId);
    }
    
    return result;
  }

  /**
   * Get cached university normalization result
   */
  private static async getCachedUniversity(normalizedInput: string): Promise<any | null> {
    try {
      const pool = getConnectionPool();
      const [rows] = await pool.execute(
        'SELECT * FROM university_normalization WHERE raw_input = ? LIMIT 1',
        [normalizedInput]
      );
      return (rows as any[]).length > 0 ? (rows as any[])[0] : null;
    } catch (error) {
      console.error('[Normalization] Error getting cached university:', error);
      return null;
    }
  }

  /**
   * Get cached major normalization result
   */
  private static async getCachedMajor(normalizedInput: string): Promise<any | null> {
    try {
      const pool = getConnectionPool();
      const [rows] = await pool.execute(
        'SELECT * FROM major_normalization WHERE raw_input = ? LIMIT 1',
        [normalizedInput]
      );
      return (rows as any[]).length > 0 ? (rows as any[])[0] : null;
    } catch (error) {
      console.error('[Normalization] Error getting cached major:', error);
      return null;
    }
  }

  /**
   * Cache university normalization result
   */
  private static async cacheUniversityResult(rawInput: string, result: UniversityIdentification): Promise<number> {
    try {
      const pool = getConnectionPool();
      const [insertResult] = await pool.execute(
        `INSERT INTO university_normalization 
         (raw_input, normalized_name, aliases, country, region, confidence, reasoning, usage_count, last_used_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())`,
        [
          rawInput,
          result.normalizedName,
          JSON.stringify(result.aliases),
          result.country,
          result.region,
          result.confidence.toString(),
          result.reasoning
        ]
      );
      return (insertResult as any).insertId;
    } catch (error) {
      console.error('[Normalization] Error caching university result:', error);
      return 0;
    }
  }

  /**
   * Cache major normalization result
   */
  private static async cacheMajorResult(rawInput: string, result: MajorIdentification): Promise<number> {
    try {
      const pool = getConnectionPool();
      const [insertResult] = await pool.execute(
        `INSERT INTO major_normalization 
         (raw_input, normalized_name, aliases, category, field, related_majors, confidence, reasoning, usage_count, last_used_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())`,
        [
          rawInput,
          result.normalizedName,
          JSON.stringify(result.aliases),
          result.category,
          result.field,
          JSON.stringify(result.relatedMajors),
          result.confidence.toString(),
          result.reasoning
        ]
      );
      return (insertResult as any).insertId;
    } catch (error) {
      console.error('[Normalization] Error caching major result:', error);
      return 0;
    }
  }

  /**
   * Update university cache usage statistics
   */
  private static async updateUniversityCacheUsage(cacheId: number): Promise<void> {
    try {
      const pool = getConnectionPool();
      await pool.execute(
        'UPDATE university_normalization SET usage_count = usage_count + 1, last_used_at = NOW() WHERE id = ?',
        [cacheId]
      );
    } catch (error) {
      console.error('[Normalization] Error updating university cache usage:', error);
    }
  }

  /**
   * Update major cache usage statistics
   */
  private static async updateMajorCacheUsage(cacheId: number): Promise<void> {
    try {
      const pool = getConnectionPool();
      await pool.execute(
        'UPDATE major_normalization SET usage_count = usage_count + 1, last_used_at = NOW() WHERE id = ?',
        [cacheId]
      );
    } catch (error) {
      console.error('[Normalization] Error updating major cache usage:', error);
    }
  }

  /**
   * Log user input history
   */
  private static async logUserInput(userId: number, inputType: 'university' | 'major', rawInput: string, normalizationId: number): Promise<void> {
    try {
      const pool = getConnectionPool();
      await pool.execute(
        `INSERT INTO user_input_history 
         (user_id, input_type, raw_input, normalization_id, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [userId, inputType, rawInput, normalizationId]
      );
    } catch (error) {
      console.error('[Normalization] Error logging user input:', error);
    }
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
  static async normalizeUniversities(rawInputs: string[], userId?: number): Promise<UniversityIdentification[]> {
    const results = [];
    for (const rawInput of rawInputs) {
      const result = await this.normalizeUniversity(rawInput, userId);
      results.push(result);
    }
    return results;
  }

  /**
   * Batch normalize majors
   */
  static async normalizeMajors(rawInputs: string[], userId?: number): Promise<MajorIdentification[]> {
    const results = [];
    for (const rawInput of rawInputs) {
      const result = await this.normalizeMajor(rawInput, userId);
      results.push(result);
    }
    return results;
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{ universities: number; majors: number; totalUsage: number }> {
    try {
      const pool = getConnectionPool();
      
      const [univRows] = await pool.execute('SELECT COUNT(*) as count, SUM(usage_count) as total_usage FROM university_normalization');
      const [majorRows] = await pool.execute('SELECT COUNT(*) as count, SUM(usage_count) as total_usage FROM major_normalization');
      
      const univData = (univRows as any)[0];
      const majorData = (majorRows as any)[0];
      
      const univCount = univData?.count || 0;
      const majorCount = majorData?.count || 0;
      const univUsage = univData?.total_usage || 0;
      const majorUsage = majorData?.total_usage || 0;
      
      return {
        universities: univCount,
        majors: majorCount,
        totalUsage: univUsage + majorUsage
      };
    } catch (error) {
      console.error('[Normalization] Error getting cache stats:', error);
      return { universities: 0, majors: 0, totalUsage: 0 };
    }
  }
}
