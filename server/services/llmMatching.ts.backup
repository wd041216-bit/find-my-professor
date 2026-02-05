import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

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
 * Use LLM to generate 8-10 matched research projects for a user
 * This is the fast frontend response
 */
export async function generateMatchedProjects(
  university: string,
  major: string,
  userProfile: UserProfile,
  language: 'en' | 'zh' = 'en'
): Promise<MatchedProject[]> {
  // First, try to get existing projects from database
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection failed');
  }
  const existingProjects = await db.execute(
    sql`SELECT * FROM scraped_projects 
        WHERE LOWER(university_name) = LOWER(${university}) 
        AND LOWER(major_name) = LOWER(${major}) 
        AND expires_at > NOW() 
        LIMIT 50`
  );

  const projects = (existingProjects as any).rows || [];
  const projectsContext = projects.length > 0
    ? `\n\nExisting projects in our database (use these as reference or select from them):\n${projects.map((p: any, i: number) => 
        `${i + 1}. ${p.project_title} - ${p.professor_name} (${p.lab_name || 'N/A'})\n   Research: ${p.research_area}\n   Description: ${p.project_description}`
      ).join('\n\n')}`
    : '';

  const languageInstruction = language === 'zh' 
    ? 'Please respond in Simplified Chinese (简体中文). All project names, descriptions, requirements, and match reasons should be in Chinese.'
    : 'Please respond in English.';

  const prompt = `You are a research opportunity matching expert. ${languageInstruction} Generate 8-10 highly relevant research projects for a student.

**Student Profile:**
- Academic Level: ${userProfile.academicLevel || 'Not specified'}
- GPA: ${userProfile.gpa || 'Not specified'}
- Skills: ${userProfile.skills?.join(', ') || 'Not specified'}
- Research Interests: ${userProfile.interests?.join(', ') || 'Not specified'}
- Bio: ${userProfile.bio || 'Not specified'}
${userProfile.activities && userProfile.activities.length > 0 ? `- Activities:\n${userProfile.activities.map(a => `  * ${a.title} (${a.category})${a.role ? ` - ${a.role}` : ''}${a.description ? `\n    ${a.description}` : ''}`).join('\n')}` : ''}

**Target:**
- University: ${university}
- Major: ${major}
${projectsContext}

**Task:**
Generate 8-10 research projects that match this student's profile. Each project should include:
1. Project name
2. Professor name
3. Lab name (if applicable)
4. Research direction
5. Project description
6. Requirements (what skills/background needed)
7. Contact email (if available)
8. URL (if available)
9. Match score (0-100, how well it matches the student)
10. Match reason (why this project is a good fit)

${existingProjects.length > 0 ? 'Prioritize selecting and ranking projects from the existing database, but you can also generate new ones if needed.' : 'Generate realistic research projects based on typical research areas in this field at this university.'}

Return ONLY a JSON array with this exact structure:
[
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
    "matchReason": "string"
  }
]`;

  try {
    // Note: LLM has web search capabilities enabled by default
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a research opportunity matching expert with access to real-time web information. Use your web search capabilities to find the latest research projects, professor information, and lab details from the target university's official website and academic databases. Always return valid JSON." },
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

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("Empty or invalid response from LLM");
    }

    const parsed = JSON.parse(content);
    const projects: MatchedProject[] = parsed.projects;

    // Sort by match score descending
    projects.sort((a, b) => b.matchScore - a.matchScore);

    return projects;
  } catch (error) {
    console.error('[LLM Matching] Error generating matches:', error);
    throw error;
  }
}

/**
 * Trigger background crawler to scrape all projects for this university/major
 * This runs asynchronously and doesn't block the user
 */
export async function triggerBackgroundCrawler(
  university: string,
  major: string
): Promise<void> {
  // Import dynamically to avoid circular dependencies
  const { ScrapingService } = await import('./scraping');
  
  // Run in background (don't await)
  ScrapingService.triggerScrapingTask(university, major)
    .then((result: any) => {
      console.log(`[Background Crawler] Task created for ${university} - ${major}, taskId: ${result.taskId}`);
    })
    .catch((error: any) => {
      console.error(`[Background Crawler] Failed to create task for ${university} - ${major}:`, error);
    });
}
