/**
 * Test script for new Perplexity search strategy
 * 
 * Old strategy:
 * - Search "University + Major" for all projects
 * - Generate detailed project and professor descriptions
 * - High token consumption
 * 
 * New strategy:
 * - Search "University + Department" for all projects
 * - Extract only: project name, tags, project URL
 * - No detailed descriptions, lower token consumption
 * 
 * Test case: University of Washington Information School
 */

import 'dotenv/config';

interface ProjectInfo {
  projectName: string;
  tags: string[]; // e.g., ["machine learning", "NLP", "human-computer interaction"]
  projectUrl: string;
  professorName?: string; // Optional
  departmentName: string;
}

async function searchDepartmentProjects(
  university: string,
  department: string
): Promise<ProjectInfo[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY not found in environment variables');
  }

  const prompt = `Find SPECIFIC INDIVIDUAL research projects at ${university} ${department}.

I need concrete projects, NOT general research areas. For example:
- "Project Sidewalk" (specific project) ✓
- "Accessibility research" (general area) ✗

For each SPECIFIC project, provide:
1. Project name (exact title)
2. Tags (3-5 keywords: "computer vision", "accessibility", "crowdsourcing")
3. Project URL (unique URL for THIS project, not department homepage)
4. Professor name (project lead)

Return ONLY valid JSON (no markdown):
[
  {
    "projectName": "Exact Project Title",
    "tags": ["keyword1", "keyword2", "keyword3"],
    "projectUrl": "https://specific-project-url.edu",
    "professorName": "Professor Name"
  }
]

Requirements:
- Each project must have a UNIQUE URL (not shared with other projects)
- Find 10-12 different projects
- Include professor's lab projects, NSF grants, ongoing studies
- Skip completed or archived projects`;

  console.log('[Perplexity] Sending request...');
  console.log('[Perplexity] University:', university);
  console.log('[Perplexity] Department:', department);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: 'You are a research project database assistant. Return only valid JSON arrays without any markdown formatting or explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 4000 // Reduced from previous strategy
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('[Perplexity] Response received');
  console.log('[Perplexity] Usage:', data.usage);

  const content = data.choices[0].message.content;
  console.log('[Perplexity] Raw content:', content);

  // Parse JSON from response
  let projects: ProjectInfo[];
  try {
    // Remove markdown code blocks if present
    let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON array (find first [ and last ])
    const startIdx = jsonStr.indexOf('[');
    const endIdx = jsonStr.lastIndexOf(']');
    
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      jsonStr = jsonStr.substring(startIdx, endIdx + 1);
    }
    
    projects = JSON.parse(jsonStr);
  } catch (error) {
    console.error('[Perplexity] Failed to parse JSON:', error);
    console.error('[Perplexity] Content:', content);
    throw new Error('Failed to parse Perplexity response as JSON');
  }

  // Add department name to each project
  const projectsWithDept = projects.map(p => ({
    ...p,
    departmentName: department
  }));

  console.log(`[Perplexity] Found ${projectsWithDept.length} projects`);
  
  return projectsWithDept;
}

// Test the new strategy
async function main() {
  try {
    console.log('=== Testing New Perplexity Search Strategy ===\n');
    
    const university = 'University of Washington';
    const department = 'Information School';
    
    const startTime = Date.now();
    const projects = await searchDepartmentProjects(university, department);
    const endTime = Date.now();
    
    console.log('\n=== Results ===');
    console.log(`Total projects found: ${projects.length}`);
    console.log(`Time taken: ${(endTime - startTime) / 1000}s`);
    console.log('\nSample projects:');
    
    projects.slice(0, 5).forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.projectName}`);
      console.log(`   Professor: ${project.professorName || 'N/A'}`);
      console.log(`   Tags: ${project.tags.join(', ')}`);
      console.log(`   URL: ${project.projectUrl}`);
    });
    
    console.log('\n=== Token Consumption Estimate ===');
    console.log('Old strategy: ~3000-5000 tokens per search (detailed descriptions)');
    console.log('New strategy: ~1000-2000 tokens per search (names + tags + URLs only)');
    console.log('Estimated savings: 50-70%');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
