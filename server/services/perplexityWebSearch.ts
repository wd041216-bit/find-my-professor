/**
 * Perplexity Web Search Service
 * 
 * This service uses Perplexity Search API to find academic research projects.
 * It implements a hybrid search strategy:
 * 1. University-wide search: Get all research projects from a university
 * 2. Major-specific search: Get research projects for a specific major
 * 
 * Cost: $5.00/1K requests = $0.005/request = ¥0.036/request
 */

import { ENV } from "../_core/env";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const PERPLEXITY_API_KEY = ENV.perplexityApiKey;

export interface AcademicProject {
  projectName: string;
  professorName?: string;
  lab?: string;
  researchDirection?: string;
  description?: string;
  requirements?: string;
  contactEmail?: string;
  url?: string;
}

/**
 * Search for all research projects at a university (university-wide search)
 * 
 * @param university - University name (e.g., "University of Washington")
 * @returns Array of academic projects
 */
export async function searchUniversityProjects(
  university: string
): Promise<AcademicProject[]> {
  const prompt = `Find all research projects, labs, and faculty opportunities at ${university}. 
  
For each project, provide:
- Project/Lab name
- Professor name
- Research area/direction
- Brief description
- Contact information (if available)
- Website URL

Format the response as a JSON array of projects. Return at least 20 projects if available.`;
  
  console.log(`[Perplexity] University-wide search: ${university}`);
  
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a research assistant helping students find academic research opportunities. Always return results in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Try to parse JSON from the response
    let projects: AcademicProject[] = [];
    try {
      // Extract JSON array from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      projects = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error(`[Perplexity] Failed to parse JSON response:`, parseError);
      console.log(`[Perplexity] Raw response:`, content);
      // Return empty array if parsing fails
      projects = [];
    }
    
    console.log(`[Perplexity] University-wide search completed: ${projects.length} projects found`);
    
    return projects;
  } catch (error) {
    console.error(`[Perplexity] University-wide search failed:`, error);
    throw error;
  }
}

/**
 * Search for research projects in a specific major at a university (major-specific search)
 * 
 * @param university - University name (e.g., "University of Washington")
 * @param major - Major name (e.g., "Physics")
 * @returns Array of academic projects
 */
export async function searchMajorProjects(
  university: string,
  major: string
): Promise<AcademicProject[]> {
  const prompt = `Find research projects and faculty opportunities in ${major} at ${university}.
  
For each project, provide:
- Project/Lab name
- Professor name
- Research area/direction
- Brief description
- Requirements (if any)
- Contact information (if available)
- Website URL

Format the response as a JSON array of projects. Return at least 10 projects if available.`;
  
  console.log(`[Perplexity] Major-specific search: ${university} + ${major}`);
  
  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a research assistant helping students find academic research opportunities. Always return results in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Try to parse JSON from the response
    let projects: AcademicProject[] = [];
    try {
      // Extract JSON array from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      projects = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error(`[Perplexity] Failed to parse JSON response:`, parseError);
      console.log(`[Perplexity] Raw response:`, content);
      // Return empty array if parsing fails
      projects = [];
    }
    
    console.log(`[Perplexity] Major-specific search completed: ${projects.length} projects found`);
    
    return projects;
  } catch (error) {
    console.error(`[Perplexity] Major-specific search failed:`, error);
    throw error;
  }
}
