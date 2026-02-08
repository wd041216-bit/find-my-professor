import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { safeGetRows, safeGetCount } from "./dbResultHelper";

export interface UserProfile {
  academicLevel?: string;
  gpa?: string;
  skills?: string[];
  interests?: string[];
  bio?: string;
  activities?: Array<{
    title: string;
    category: string;
    description?: string;
    role?: string;
  }>;
}

export interface MatchedProject {
  projectName: string;
  professorName: string;
  lab?: string;
  researchDirection: string;
  description: string;
  requirements?: string;
  contactEmail?: string;
  url?: string;
  matchScore: number;
  matchReason: string;
}

/**
 * Layer 1: SQL-based coarse filtering
 * Goal: Filter 200+ projects down to ~150 using keyword matching
 * Strategy: Very loose filtering - only exclude obviously irrelevant projects
 */
async function sqlCoarseFilter(
  db: any,
  university: string,
  major: string,
  userProfile: UserProfile
): Promise<any[]> {
  console.log('[Layer 1] Starting SQL coarse filter...');
  
  // Build keyword list from user profile
  const keywords: string[] = [];
  
  // Add skills
  if (userProfile.skills && userProfile.skills.length > 0) {
    keywords.push(...userProfile.skills.map(s => s.toLowerCase()));
  }
  
  // Add interests
  if (userProfile.interests && userProfile.interests.length > 0) {
    keywords.push(...userProfile.interests.map(i => i.toLowerCase()));
  }
  
  // Add activity categories as additional context
  if (userProfile.activities && userProfile.activities.length > 0) {
    const activityKeywords = userProfile.activities
      .map(a => a.category.toLowerCase())
      .filter((v, i, a) => a.indexOf(v) === i); // unique
    keywords.push(...activityKeywords);
  }
  
  // Build SQL LIKE conditions (very loose - OR logic)
  const likeConditions = keywords.map(keyword => 
    `(LOWER(research_area) LIKE '%${keyword}%' OR LOWER(project_description) LIKE '%${keyword}%' OR LOWER(requirements) LIKE '%${keyword}%')`
  ).join(' OR ');
  
  // If no keywords, return all projects (no filtering)
  if (keywords.length === 0) {
    console.log('[Layer 1] No keywords found, returning all projects');
    const result = await db.execute(
      sql`SELECT * FROM scraped_projects 
          WHERE LOWER(university_name) = LOWER(${university}) 
          AND LOWER(major_name) = LOWER(${major}) 
          AND expires_at > NOW() 
          ORDER BY created_at DESC 
          LIMIT 150`
    );
    return safeGetRows(result);
  }
  
  // Execute query with keyword filtering
  const query = `
    SELECT * FROM scraped_projects 
    WHERE LOWER(university_name) = LOWER('${university}') 
    AND LOWER(major_name) = LOWER('${major}') 
    AND expires_at > NOW() 
    AND (${likeConditions})
    ORDER BY created_at DESC 
    LIMIT 150
  `;
  
  const result = await db.execute(sql.raw(query));
  const filtered = safeGetRows(result);
  
  console.log(`[Layer 1] Filtered ${filtered.length} projects using keywords: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? '...' : ''}`);
  
  return filtered;
}

/**
 * Layer 2: LLM batch scoring
 * Goal: Quickly score projects (0-10) and select top 30-40
 * Strategy: Use simple prompts to minimize token usage
 */
async function llmBatchScoring(
  projects: any[],
  userProfile: UserProfile,
  university: string,
  major: string
): Promise<Array<{project: any, score: number}>> {
  console.log(`[Layer 2] Starting LLM batch scoring for ${projects.length} projects...`);
  
  const batchSize = 50;
  const scoredProjects: Array<{project: any, score: number}> = [];
  
  // Split into batches
  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(projects.length / batchSize);
    
    console.log(`[Layer 2] Processing batch ${batchNum}/${totalBatches} (${batch.length} projects)...`);
    
    // Build simplified project list
    const projectList = batch.map((p, idx) => 
      `${idx + 1}. ${p.project_title || 'Untitled'} - ${p.professor_name || 'Unknown'}
   Research: ${p.research_area || 'Not specified'}
   Description: ${(p.project_description || '').substring(0, 150)}...`
    ).join('\n\n');
    
    const prompt = `You are a research matching expert. Rate each project's relevance to this student (0-10 scale).

**Student Profile:**
- Target: ${major} at ${university}
- Academic Level: ${userProfile.academicLevel || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
${userProfile.activities && userProfile.activities.length > 0 ? `- Activities: ${userProfile.activities.map(a => a.title).join(', ')}` : ''}

**Projects to Rate:**
${projectList}

**Rating Criteria (0-10) - BE GENEROUS:**
- 8-10: Strong match (skills align OR strong interest fit OR appropriate level)
- 6-7: Good match (some skills match OR related interests OR could work)
- 4-5: Possible match (transferable skills, growth opportunity)
- 2-3: Weak but possible (tangential interests, learning opportunity)
- 0-1: Completely unrelated (different field entirely)

**IMPORTANT: Be INCLUSIVE. Most projects in the same major should score 5+.**

Return ONLY a JSON array of ${batch.length} numbers: {"scores": [score1, score2, ...]}`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a research matching expert. Return only valid JSON with scores." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "project_scores",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scores: {
                  type: "array",
                  items: { type: "number" }
                }
              },
              required: ["scores"],
              additionalProperties: false
            }
          }
        }
      });
      
      const content = response.choices[0].message.content;
      if (!content || typeof content !== 'string') {
        console.error(`[Layer 2] Batch ${batchNum} returned empty response`);
        // Assign default score of 5 to all projects in this batch
        batch.forEach(project => {
          scoredProjects.push({ project, score: 5 });
        });
        continue;
      }
      
      const parsed = JSON.parse(content);
      const scores = parsed.scores || [];
      
      // Associate scores with projects
      batch.forEach((project, idx) => {
        scoredProjects.push({
          project,
          score: scores[idx] !== undefined ? scores[idx] : 5 // default to 5 if missing
        });
      });
      
      console.log(`[Layer 2] Batch ${batchNum} completed. Score range: ${Math.min(...scores)}-${Math.max(...scores)}`);
      
    } catch (error) {
      console.error(`[Layer 2] Batch ${batchNum} failed:`, error);
      // Assign default scores on error
      batch.forEach(project => {
        scoredProjects.push({ project, score: 5 });
      });
    }
  }
  
  // Sort by score descending and take top 40
  scoredProjects.sort((a, b) => b.score - a.score);
  const topProjects = scoredProjects.slice(0, 40);
  
  console.log(`[Layer 2] Completed. Top 40 projects selected. Score range: ${topProjects[0]?.score}-${topProjects[topProjects.length - 1]?.score}`);
  
  return topProjects;
}

/**
 * Layer 3: LLM deep matching
 * Goal: Perform detailed analysis and return final 8-10 matches with reasons
 * Strategy: Use comprehensive prompts with full project details
 */
async function llmDeepMatching(
  projects: any[],
  userProfile: UserProfile,
  university: string,
  major: string,
  language: 'en' | 'zh'
): Promise<MatchedProject[]> {
  console.log(`[Layer 3] Starting LLM deep matching for ${projects.length} projects...`);
  
  const projectsContext = projects.map((p, i) => 
    `${i + 1}. ${p.project_title || 'Untitled Project'}
   Professor: ${p.professor_name || 'Unknown'}
   Lab: ${p.lab_name || 'Not specified'}
   Research Area: ${p.research_area || 'Not specified'}
   Description: ${p.project_description || 'No description available'}
   Requirements: ${p.requirements || 'Not specified'}
   Contact: ${p.contact_email || 'Not available'}
   URL: ${p.project_url || 'Not available'}`
  ).join('\n\n');
  
  // Generate content in the user's preferred language for better UX
  // Cover letters will be translated to English when generated
  const languageInstruction = language === 'zh' 
    ? 'Please respond in Simplified Chinese (简体中文). All project names, professor names, research directions, descriptions, requirements, and match reasons should be in Chinese.'
    : 'Please respond in English. All project names, professor names, research directions, descriptions, requirements, and match reasons should be in English.';
  
  const prompt = `You are a research opportunity matching expert. ${languageInstruction}

**Student Profile:**
- Target: ${major} at ${university}
- Academic Level: ${userProfile.academicLevel || 'Not specified'}
- GPA: ${userProfile.gpa || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Research Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Bio: ${userProfile.bio || 'Not specified'}
${userProfile.activities && userProfile.activities.length > 0 ? `- Activities:\n${userProfile.activities.map(a => `  * ${a.title} (${a.category})${a.role ? ` - ${a.role}` : ''}${a.description ? `\n    ${a.description}` : ''}`).join('\n')}` : ''}

**Candidate Projects (Pre-screened):**
${projectsContext}

**Task:**
Select EXACTLY 10 projects for this student (or all projects if fewer than 10 available).

**IMPORTANT: You MUST select exactly 10 projects. No more, no less (unless fewer available).**

**Matching Philosophy (BE INCLUSIVE):**
- Show ALL relevant lab opportunities, not just perfect matches
- Include projects that are broadly related to the major
- Prioritize diversity of research opportunities
- Include both "perfect fit" AND "growth opportunity" projects
- A student can learn and grow - don't be too strict!

For each selected project, provide:
1. **Match Score (60-100)**: Be generous - most related projects should score 70+
2. **Match Reason**: Explain:
   - How the student could contribute (even with transferable skills)
   - What they would learn from this opportunity
   - Why this is a valuable experience for their career

**Selection Criteria (INCLUSIVE):**
- Include projects where student's skills could apply (even indirectly)
- Value transferable skills broadly (e.g., any programming → any technical project)
- Consider growth potential, not just current fit
- Include diverse research directions to give students options

Return ONLY a JSON array with this exact structure:
{
  "projects": [
    {
      "projectName": "string",
      "professorName": "string",
      "lab": "string or null",
      "researchDirection": "string",
      "description": "string",
      "requirements": "string or null",
      "contactEmail": "string or null",
      "url": "string or null",
      "matchScore": number (0-100),
      "matchReason": "string (detailed explanation)"
    }
  ]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a research opportunity matching expert. Provide detailed, personalized match analysis. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "matched_projects",
          strict: true,
          schema: {
            type: "object",
            properties: {
              projects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    projectName: { type: "string" },
                    professorName: { type: "string" },
                    lab: { type: ["string", "null"] },
                    researchDirection: { type: "string" },
                    description: { type: "string" },
                    requirements: { type: ["string", "null"] },
                    contactEmail: { type: ["string", "null"] },
                    url: { type: ["string", "null"] },
                    matchScore: { type: "number" },
                    matchReason: { type: "string" }
                  },
                  required: ["projectName", "professorName", "researchDirection", "description", "matchScore", "matchReason"],
                  additionalProperties: false
                }
              }
            },
            required: ["projects"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("Empty or invalid response from LLM");
    }
    
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('[Layer 3] JSON parse error:', e, 'Content:', content);
      throw new Error("Failed to parse LLM response as JSON");
    }
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error("LLM response is not an object");
    }
    
    if (!Array.isArray(parsed.projects)) {
      console.error('[Layer 3] Invalid projects structure:', parsed);
      throw new Error("LLM response missing 'projects' array");
    }
    
    const matchedProjects: MatchedProject[] = parsed.projects.filter((p: any) => p && typeof p === 'object');
    
    // Sort by match score descending
    matchedProjects.sort((a, b) => b.matchScore - a.matchScore);
    
    // Warn if we got fewer than expected
    if (matchedProjects.length < 8) {
      console.warn(`[Layer 3] WARNING: Only ${matchedProjects.length} matches generated, expected 8-10`);
    }
    
    console.log(`[Layer 3] Completed. ${matchedProjects.length} final matches generated.`);
    
    return matchedProjects;
    
  } catch (error) {
    console.error('[Layer 3] Deep matching failed:', error);
    throw error;
  }
}

/**
 * Main function: Three-layer intelligent filtering architecture
 * Automatically selects strategy based on project count
 */
export async function generateMatchedProjects(
  university: string,
  major: string,
  userProfile: UserProfile,
  language: 'en' | 'zh' = 'en'
): Promise<MatchedProject[]> {
  
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }
  
  // Step 1: Query total project count
  const countResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM scraped_projects 
        WHERE LOWER(university_name) = LOWER(${university}) 
        AND LOWER(major_name) = LOWER(${major}) 
        AND expires_at > NOW()`
  );
  
  // Use safe helper to extract count
  const totalProjects = safeGetCount(countResult);
  console.log(`\n========================================`);
  console.log(`[Matching] Starting match for ${university} - ${major}`);
  console.log(`[Matching] Total projects in database: ${totalProjects}`);
  console.log(`========================================\n`);
  
  // Step 2: Select strategy based on project count
  if (totalProjects === 0) {
    // No projects in database - use LLM to generate from scratch
    console.log(`[Strategy] No projects found. Using LLM generation mode.`);
    return await generateProjectsFromScratch(university, major, userProfile, language);
    
  } else if (totalProjects <= 50) {
    // Strategy A: Direct deep matching
    console.log(`[Strategy A] Direct deep matching (${totalProjects} projects)`);
    
    const projects = await db.execute(
      sql`SELECT * FROM scraped_projects 
          WHERE LOWER(university_name) = LOWER(${university}) 
          AND LOWER(major_name) = LOWER(${major}) 
          AND expires_at > NOW() 
          ORDER BY created_at DESC`
    );
    
    return await llmDeepMatching(safeGetRows(projects), userProfile, university, major, language);
    
  } else if (totalProjects <= 200) {
    // Strategy B: Two-stage LLM filtering
    console.log(`[Strategy B] Two-stage LLM filtering (${totalProjects} projects)`);
    
    const projects = await db.execute(
      sql`SELECT * FROM scraped_projects 
          WHERE LOWER(university_name) = LOWER(${university}) 
          AND LOWER(major_name) = LOWER(${major}) 
          AND expires_at > NOW() 
          ORDER BY created_at DESC`
    );
    
    // Layer 2: Batch scoring
    const scoredProjects = await llmBatchScoring(safeGetRows(projects), userProfile, university, major);
    
    // Layer 3: Deep matching
    return await llmDeepMatching(
      scoredProjects.map(sp => sp.project),
      userProfile,
      university,
      major,
      language
    );
    
  } else {
    // Strategy C: Three-layer filtering
    console.log(`[Strategy C] Three-layer filtering (${totalProjects} projects)`);
    
    // Layer 1: SQL coarse filter
    const coarseFiltered = await sqlCoarseFilter(db, university, major, userProfile);
    
    // Layer 2: LLM batch scoring
    const scoredProjects = await llmBatchScoring(coarseFiltered, userProfile, university, major);
    
    // Layer 3: LLM deep matching
    return await llmDeepMatching(
      scoredProjects.map(sp => sp.project),
      userProfile,
      university,
      major,
      language
    );
  }
}

/**
 * Fallback: Generate projects from scratch when database is empty
 * Uses LLM with web search capabilities
 */
async function generateProjectsFromScratch(
  university: string,
  major: string,
  userProfile: UserProfile,
  language: 'en' | 'zh'
): Promise<MatchedProject[]> {
  console.log('[Fallback] Generating projects from scratch using LLM...');
  
  // Generate content in the user's preferred language for better UX
  // Cover letters will be translated to English when generated
  const languageInstruction = language === 'zh' 
    ? 'Please respond in Simplified Chinese (简体中文). All project names, professor names, research directions, descriptions, requirements, and match reasons should be in Chinese.'
    : 'Please respond in English. All project names, professor names, research directions, descriptions, requirements, and match reasons should be in English.';
  
  const prompt = `You are a research opportunity matching expert with web search capabilities. ${languageInstruction}

**Student Profile:**
- Target: ${major} at ${university}
- Academic Level: ${userProfile.academicLevel || 'Not specified'}
- GPA: ${userProfile.gpa || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Research Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Bio: ${userProfile.bio || 'Not specified'}
${userProfile.activities && userProfile.activities.length > 0 ? `- Activities:\n${userProfile.activities.map(a => `  * ${a.title} (${a.category})`).join('\n')}` : ''}

**Task:**
Generate EXACTLY 10 realistic research projects at ${university} in the ${major} department.

**IMPORTANT: You MUST generate exactly 10 projects. No more, no less.**

**Matching Philosophy:**
- Be INCLUSIVE rather than exclusive - show ALL relevant lab opportunities
- Include projects that are broadly related to the major, not just perfect matches
- Prioritize showing the diversity of research opportunities available
- Include both "perfect fit" projects AND "growth opportunity" projects

Use your knowledge to find:
- Real professors and labs at this university
- Current research areas in this department
- Typical project requirements and opportunities

For each project, provide:
1. Match Score (60-100): Be generous - most related projects should score 70+
2. Match Reason: Explain how the student could contribute and what they would learn

Return JSON array with EXACTLY 10 projects.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a research opportunity matching expert with access to real-time web information. Use your web search capabilities to find accurate, current information. Always return valid JSON." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "matched_projects",
        strict: true,
        schema: {
          type: "object",
          properties: {
            projects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  projectName: { type: "string" },
                  professorName: { type: "string" },
                  lab: { type: ["string", "null"] },
                  researchDirection: { type: "string" },
                  description: { type: "string" },
                  requirements: { type: ["string", "null"] },
                  contactEmail: { type: ["string", "null"] },
                  url: { type: ["string", "null"] },
                  matchScore: { type: "number" },
                  matchReason: { type: "string" }
                },
                required: ["projectName", "professorName", "researchDirection", "description", "matchScore", "matchReason"],
                additionalProperties: false
              }
            }
          },
          required: ["projects"],
          additionalProperties: false
        }
      }
    }
  });
  
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("Empty or invalid response from LLM");
    }
    
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('[Fallback] JSON parse error:', e, 'Content:', content);
      throw new Error("Failed to parse LLM response as JSON");
    }
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error("LLM response is not an object");
    }
    
    if (!Array.isArray(parsed.projects)) {
      console.error('[Fallback] Invalid projects structure:', parsed);
      throw new Error("LLM response missing 'projects' array");
    }
    
    const projects: MatchedProject[] = parsed.projects.filter((p: any) => p && typeof p === 'object');
  
  projects.sort((a, b) => b.matchScore - a.matchScore);
  
  // Warn if we got fewer than expected
  if (projects.length < 8) {
    console.warn(`[Fallback] WARNING: Only ${projects.length} projects generated, expected 8-10`);
  }
  
  console.log(`[Fallback] Generated ${projects.length} projects from scratch`);
  
  return projects;
}

/**
 * Trigger background search using Perplexity to find all projects for this university/major
 * This runs asynchronously and doesn't block the user
 */
export async function triggerBackgroundCrawler(
  university: string,
  major: string
): Promise<void> {
  console.log(`[Background Search] ===== TRIGGERED ===== for ${university} - ${major}`);
  console.log(`[Background Search] Timestamp: ${new Date().toISOString()}`);
  
  // Run in background (don't await)
  (async () => {
    try {
      console.log(`[Background Search] Inside async block, starting import...`);
      const { searchMajorProjects } = await import('./perplexityWebSearch');
      console.log(`[Background Search] Imported searchMajorProjects successfully`);
      
      const { getDb } = await import('../db');
      const db = await getDb();
      console.log(`[Background Search] Database connection: ${db ? 'SUCCESS' : 'FAILED'}`);
      
      if (!db) {
        throw new Error('Database connection failed');
      }
      
      // Trigger major-specific search
      console.log(`[Background Search] Calling Perplexity API for ${university} - ${major}`);
      const projects = await searchMajorProjects(university, major);
      console.log(`[Background Search] Perplexity API returned successfully`);
      
      console.log(`[Background Search] Perplexity returned ${projects.length} projects`);
      console.log(`[Background Search] Sample project:`, projects[0]);
      
      // Save to scraped_projects table
      console.log(`[Background Search] Starting to save projects to database...`);
      let savedCount = 0;
      for (const project of projects) {
        try {
          await db.insert(schema.scrapedProjects).values({
            universityName: university,
            majorName: major,
            projectTitle: project.projectName,
            professorName: project.professorName || null,
            labName: project.lab || null,
            researchArea: project.researchDirection || null,
            projectDescription: project.description || null,
            requirements: project.requirements || null,
            contactEmail: project.contactEmail || null,
            sourceUrl: project.url || null,
            searchScope: 'major_specific',
          });
          savedCount++;
        } catch (error) {
          console.error(`[Background Search] Failed to save project "${project.projectName}":`, error);
        }
      }
      console.log(`[Background Search] Saved ${savedCount}/${projects.length} projects to database`);
      
      console.log(`[Background Search] ===== COMPLETED ===== for ${university} - ${major}: ${savedCount} projects saved`);
    } catch (error) {
      console.error(`[Background Search] ===== FAILED ===== for ${university} - ${major}:`, error);
      console.error(`[Background Search] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    }
  })();
  
  console.log(`[Background Search] Async task launched, returning immediately`);
}
