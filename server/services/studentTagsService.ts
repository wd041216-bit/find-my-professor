/**
 * 学生画像tags提取服务
 * 从学生的研究兴趣、技能等信息中提取标准化的tags
 * 使用基于大学+专业的tags词典，确保与教授tags一致
 */

import { invokeLLM } from "../_core/llm";
import { getAvailableTags, hasDictionary, buildTagsDictionary } from "./tagsDictionaryService";
import type { UserProfile } from "./llmMatching";

export interface StudentProfile {
  researchInterests?: string;
  skills?: string[];
  activities?: string;
  academicBackground?: string;
  targetMajor?: string;
}

/**
 * 从学生画像中提取研究tags
 * @param profile 学生画像（UserProfile或StudentProfile）
 * @param universityName 目标大学名称
 * @param majorName 目标专业名称
 * @returns 标准化的研究tags数组（从词典中选择）
 */
export async function extractStudentTags(
  profile: UserProfile | StudentProfile,
  universityName: string,
  majorName: string
): Promise<string[]> {
  console.log('[StudentTags] Extracting tags from student profile...');
  console.log(`[StudentTags] Using dictionary for ${universityName} - ${majorName}`);
  
  // 检查词典是否存在，不存在则构建
  const dictExists = await hasDictionary(universityName, majorName);
  if (!dictExists) {
    console.log('[StudentTags] Dictionary not found, building...');
    await buildTagsDictionary(universityName, majorName);
  }
  
  // 获取可用tags列表
  const availableTags = await getAvailableTags(universityName, majorName);
  console.log(`[StudentTags] Found ${availableTags.length} available tags in dictionary`);
  
  if (availableTags.length === 0) {
    console.warn('[StudentTags] No tags available in dictionary');
    return [];
  }
  
  // 转换UserProfile为StudentProfile格式
  const studentProfile: StudentProfile = convertToStudentProfile(profile);
  
  // 构建学生信息描述
  const profileDescription = buildProfileDescription(studentProfile);
  
  // 调用LLM从词典中选择tags
  const prompt = `You are a research matching expert. Select 5-10 research tags from the available tags list that best match the student profile.

Student Profile:
${profileDescription}

Available Tags (you MUST only choose from this list):
${availableTags.join(', ')}

Requirements:
1. Select 5-10 tags that best match the student's interests, skills, and background
2. You MUST ONLY choose tags from the available tags list above
3. Do NOT create new tags or modify existing tags
4. Focus on the most relevant tags for this student
5. Return ONLY a JSON array of strings, no explanation

Example output:
["machine learning", "natural language processing", "data science", "human-computer interaction", "user studies"]

Output:`;

  const response = await invokeLLM({
    messages: [
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "student_tags",
        strict: true,
        schema: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Array of research tags"
            }
          },
          required: ["tags"],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const parsed = JSON.parse(content);
  let tags = parsed.tags || [];
  
  // 验证所有tags都在词典中
  const availableTagsSet = new Set(availableTags);
  tags = tags.filter((tag: string) => availableTagsSet.has(tag));
  
  console.log(`[StudentTags] Selected ${tags.length} tags from dictionary:`, tags);
  return tags;
}

/**
 * 转换UserProfile为StudentProfile格式
 */
function convertToStudentProfile(profile: UserProfile | StudentProfile): StudentProfile {
  // 如果已经是StudentProfile格式，直接返回
  if ('researchInterests' in profile || 'academicBackground' in profile) {
    return profile as StudentProfile;
  }
  
  // 转换UserProfile为StudentProfile
  const userProfile = profile as UserProfile;
  return {
    researchInterests: userProfile.interests?.join(', '),
    skills: userProfile.skills,
    activities: userProfile.activities?.map(a => `${a.title} (${a.category}): ${a.description || ''}`).join('; '),
    academicBackground: userProfile.academicLevel,
    targetMajor: undefined,
  };
}

/**
 * 构建学生画像描述
 */
function buildProfileDescription(profile: StudentProfile): string {
  const parts: string[] = [];
  
  if (profile.academicBackground) {
    parts.push(`Academic Background: ${profile.academicBackground}`);
  }
  
  if (profile.targetMajor) {
    parts.push(`Target Major: ${profile.targetMajor}`);
  }
  
  if (profile.researchInterests) {
    parts.push(`Research Interests: ${profile.researchInterests}`);
  }
  
  if (profile.skills && profile.skills.length > 0) {
    parts.push(`Skills: ${profile.skills.join(', ')}`);
  }
  
  if (profile.activities) {
    parts.push(`Activities: ${profile.activities}`);
  }
  
  return parts.join('\n');
}
