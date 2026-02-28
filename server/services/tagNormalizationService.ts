/**
 * Tag Normalization Service
 *
 * When a student saves their profile, this service asynchronously calls the LLM
 * to map their free-text skills/interests to the standardized professor tag vocabulary.
 * The result is stored in student_profiles.normalized_tags for use in match scoring.
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { studentProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Fetch the top N most-frequent tags from the research_tags_dictionary.
 * These represent the canonical vocabulary used by professors.
 */
async function getTopDictionaryTags(limit = 500): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(
      `SELECT tag FROM research_tags_dictionary ORDER BY frequency DESC LIMIT ${limit}`
    ) as any;
    const data = Array.isArray(rows) ? rows[0] : rows;
    if (!Array.isArray(data)) return [];
    return data.map((r: any) => r.tag).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Normalize student skills/interests to professor tag vocabulary using LLM.
 * Returns an array of canonical tags from the dictionary.
 */
export async function normalizeStudentTags(
  userId: number,
  skills: string[],
  interests: string[],
  targetMajors: string[],
  bio?: string
): Promise<void> {
  // Skip if no meaningful input
  const allInput = [...skills, ...interests, ...targetMajors, bio || ""].filter(Boolean);
  if (allInput.length === 0) return;

  try {
    // Get top dictionary tags for reference
    const dictTags = await getTopDictionaryTags(500);
    if (dictTags.length === 0) return;

    const prompt = `You are a research tag normalization assistant. Your job is to map a student's academic background to standardized research tags used by university professors.

STUDENT PROFILE:
- Skills: ${skills.length > 0 ? skills.join(", ") : "Not specified"}
- Research Interests: ${interests.length > 0 ? interests.join(", ") : "Not specified"}
- Target Majors: ${targetMajors.length > 0 ? targetMajors.join(", ") : "Not specified"}
- Bio/Background: ${bio || "Not specified"}

PROFESSOR TAG VOCABULARY (top 500 most common tags used by professors):
${dictTags.slice(0, 500).join(", ")}

TASK:
Select 10-20 tags from the vocabulary above that best match this student's academic interests and background. 
- Prioritize tags that directly match their skills and interests
- Include related/adjacent tags that represent areas they might be interested in
- Only use tags from the provided vocabulary list
- Return ONLY a JSON array of tag strings, nothing else

Example output: ["Machine Learning", "Deep Learning", "Computer Vision", "Natural Language Processing"]`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a precise tag normalization assistant. Return only valid JSON arrays." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "normalized_tags",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Array of normalized research tags from the professor vocabulary"
              }
            },
            required: ["tags"],
            additionalProperties: false
          }
        }
      }
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent : null;
    if (!content) return;

    let parsed: { tags: string[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return;
    }

    if (!parsed?.tags || !Array.isArray(parsed.tags) || parsed.tags.length === 0) return;

    // Filter to only include tags that are actually in our dictionary (case-insensitive)
    const dictTagsLower = new Set(dictTags.map(t => t.toLowerCase()));
    const validTags = parsed.tags.filter(t => 
      typeof t === 'string' && t.trim() && dictTagsLower.has(t.toLowerCase())
    );

    if (validTags.length === 0) return;

    // Update the student profile with normalized tags
    const db = await getDb();
    if (!db) return;

    await db.update(studentProfiles)
      .set({ normalizedTags: JSON.stringify(validTags) })
      .where(eq(studentProfiles.userId, userId));

    console.log(`[TagNorm] Normalized ${validTags.length} tags for user ${userId}:`, validTags.slice(0, 5).join(", "), "...");
  } catch (err) {
    // Non-fatal: normalization failure should never break profile saving
    console.error("[TagNorm] Failed to normalize tags for user", userId, err);
  }
}
