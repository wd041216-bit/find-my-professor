import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { analyzeUserProfile, recommendProjectsWithLLM } from "../services/intelligentMatching";
import { ScrapingService } from "../services/scraping";

// Helper function to normalize university names for comparison
function normalizeUniversityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/university|college|institute|lab|center|school/gi, "")
    .trim();
}

// Helper function to check if two university names match
function universitiesMatch(name1: string, name2: string): boolean {
  const normalized1 = normalizeUniversityName(name1);
  const normalized2 = normalizeUniversityName(name2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return true;
  
  // One contains the other (but not just substrings)
  const words1 = normalized1.split(" ").filter(w => w.length > 0);
  const words2 = normalized2.split(" ").filter(w => w.length > 0);
  
  // If one is significantly shorter, check if it's a substring
  if (words1.length > 0 && words2.length > 0) {
    const shorter = words1.length < words2.length ? words1 : words2;
    const longer = words1.length < words2.length ? words2 : words1;
    
    // Check if all words in shorter are in longer
    return shorter.every(word => longer.some(lword => lword.includes(word) || word.includes(lword)));
  }
  
  return false;
}

// Calculate match score between student profile and research project
function calculateMatchScore(
  profile: any,
  activities: any[],
  project: any,
  university: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // BASE SCORE: Give every project a base score so new users can see results
  // This ensures users without profile data still get recommendations
  const hasProfile = profile && (profile.targetMajors || profile.targetUniversities || profile.skills || profile.interests);
  if (!hasProfile) {
    // New user without profile - give base score based on project quality
    score = 50; // Base score for all projects
    reasons.push("Project is open to all academic levels");
    return { score, reasons };
  }

  // Parse project requirements
  const projectMajors = project.majors ? JSON.parse(project.majors) : [];
  const projectAreas = project.researchAreas ? JSON.parse(project.researchAreas) : [];
  const projectRequirements = project.requirements ? JSON.parse(project.requirements) : [];

  // 1. Academic level match (15 points)
  if (project.academicLevel === "all") {
    score += 15;
    reasons.push("Project is open to all academic levels");
  } else if (profile && profile.academicLevel && project.academicLevel) {
    if (project.academicLevel === profile.academicLevel) {
      score += 15;
      reasons.push(`Project is suitable for ${profile.academicLevel} students`);
    } else {
      const levelOrder = ["high_school", "undergraduate", "graduate"];
      const profileIndex = levelOrder.indexOf(profile.academicLevel);
      const projectIndex = levelOrder.indexOf(project.academicLevel);
      if (Math.abs(profileIndex - projectIndex) === 1) {
        score += 5;
        reasons.push("Project may be suitable for your academic level");
      }
    }
  } else {
    // No academic level specified by user, give partial credit
    score += 10;
    reasons.push("Project may be suitable for your academic level");
  }

  // 2. Target major match (30 points) - Increased weight since currentMajor is removed
  if (profile && profile.targetMajors) {
    const targetMajors = JSON.parse(profile.targetMajors);
    const targetMatch = projectMajors.some((major: string) =>
      targetMajors.some((tm: string) =>
        tm.toLowerCase().includes(major.toLowerCase()) ||
        major.toLowerCase().includes(tm.toLowerCase())
      )
    );
    if (targetMatch) {
      score += 30;
      reasons.push("Project matches your target majors");
    }
  }

  // 4. Target university match (20 points)
  if (profile && profile.targetUniversities && university) {
    const targetUniversities = JSON.parse(profile.targetUniversities);
    const univMatch = targetUniversities.some((tu: string) =>
      universitiesMatch(university.name, tu)
    );
    if (univMatch) {
      score += 20;
      reasons.push(`Project is at your target university (${university.name})`);
    }
  }

  // 5. Research interest match (15 points)
  if (profile && profile.interests) {
    const interests = JSON.parse(profile.interests);
    let interestMatchCount = 0;
    projectAreas.forEach((area: string) => {
      if (interests.some((interest: string) =>
        interest.toLowerCase().includes(area.toLowerCase()) ||
        area.toLowerCase().includes(interest.toLowerCase())
      )) {
        interestMatchCount++;
      }
    });
    if (interestMatchCount > 0) {
      const interestScore = Math.min(15, interestMatchCount * 6);
      score += interestScore;
      reasons.push(`${interestMatchCount} research interests match project areas`);
    }
  }

  // 6. Skills match (10 points)
  if (profile && profile.skills) {
    const skills = JSON.parse(profile.skills);
    let skillMatchCount = 0;
    projectRequirements.forEach((req: string) => {
      if (skills.some((skill: string) =>
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase())
      )) {
        skillMatchCount++;
      }
    });
    if (skillMatchCount > 0) {
      const skillScore = Math.min(10, skillMatchCount * 4);
      score += skillScore;
      reasons.push(`${skillMatchCount} skills match project requirements`);
    }
  }

  // 7. GPA match (10 points) - OPTIONAL: Only if user has filled in GPA
  if (profile && profile.gpa && project.minGPA) {
    const studentGPA = parseFloat(profile.gpa);
    const minGPA = parseFloat(project.minGPA);
    const maxGPA = project.maxGPA ? parseFloat(project.maxGPA) : 4.0;
    
    if (studentGPA >= minGPA && studentGPA <= maxGPA) {
      score += 10;
      reasons.push(`Your GPA (${profile.gpa}) meets project requirements`);
    } else if (studentGPA >= minGPA - 0.3) {
      score += 5;
      reasons.push(`Your GPA is close to project requirements`);
    }
  }

  // 8. Enhanced relevant experience (10 points)
  const relevantActivities = activities.filter(activity => {
    const activitySkills = activity.skills ? JSON.parse(activity.skills) : [];
    const activityTitle = activity.title?.toLowerCase() || "";
    const activityDesc = activity.description?.toLowerCase() || "";
    
    const areaMatch = projectAreas.some((area: string) =>
      activityTitle.includes(area.toLowerCase()) ||
      activityDesc.includes(area.toLowerCase())
    );
    
    const skillMatch = activitySkills.some((skill: string) =>
      projectRequirements.some((req: string) =>
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return areaMatch || skillMatch;
  });
  
  if (relevantActivities.length > 0) {
    const expScore = Math.min(10, relevantActivities.length * 3);
    score += expScore;
    const activityReasons = relevantActivities.map(a => a.title).join(", ");
    reasons.push(`${relevantActivities.length} relevant activities: ${activityReasons}`);
  }

  return { score: Math.min(100, score), reasons };
}

export const matchingRouter = router({
  // Calculate matches for current user with intelligent routing
  calculateMatches: protectedProcedure.mutation(async ({ ctx }) => {
    // Step 1: Analyze user profile to determine matching strategy
    const analysis = await analyzeUserProfile(ctx.user.id);
    
    console.log(`[Matching] Profile analysis: completeness=${analysis.profileCompleteness}%, rich=${analysis.hasRichProfile}`);
    
    // Step 2: Choose matching strategy
    if (analysis.hasRichProfile && analysis.targetUniversities.length > 0 && analysis.targetMajors.length > 0) {
      // Strategy A: Rich profile → LLM recommendation from database
      console.log('[Matching] Using Strategy A: LLM recommendation from database');
      
      const recommendation = await recommendProjectsWithLLM(ctx.user.id, analysis);
      
      if (recommendation.projectIds.length > 0) {
        // Save matches to database
        const matches = [];
        for (const projectId of recommendation.projectIds) {
          await db.upsertProjectMatch({
            userId: ctx.user.id,
            projectId,
            matchScore: '85', // High score for LLM recommendations
            matchReasons: JSON.stringify([recommendation.reasoning]),
            viewed: false,
            saved: false,
            applied: false,
          });
          
          matches.push({
            projectId,
            score: 85,
            reasons: [recommendation.reasoning],
          });
        }
        
        return {
          totalMatches: matches.length,
          matches,
          strategy: 'llm_recommendation',
          reasoning: recommendation.reasoning,
        };
      }
      
      console.log('[Matching] LLM recommendation returned no results, falling back to traditional matching');
    }
    
    // Strategy B: Minimal profile or no LLM results → Traditional matching
    console.log('[Matching] Using Strategy B: Traditional matching with crawler support');
    
    const profile = await db.getStudentProfile(ctx.user.id);
    const activities = await db.getUserActivities(ctx.user.id);
    let projects = await db.getAllResearchProjects();

    // STRICT FILTERING: Only show projects from target universities
    // This is a HARD requirement - user only wants to see these universities
    let filteredByUniversity = false;
    if (profile && profile.targetUniversities) {
      try {
        const targetUniversities = JSON.parse(profile.targetUniversities);
        if (targetUniversities && Array.isArray(targetUniversities) && targetUniversities.length > 0) {
          console.log(`[Matching] User has ${targetUniversities.length} target universities:`, targetUniversities);
          
          // STRICT FILTER: Only include projects from target universities
          // Within target universities, show ALL related projects (no major filtering)
          const filteredProjects = [];
          for (const project of projects) {
            const university = await db.getUniversityById(project.universityId);
            if (university) {
              const isMatch = targetUniversities.some((tu: string) => universitiesMatch(university.name, tu));
              if (isMatch) {
                console.log(`[Matching] Project matched: ${project.title} at ${university.name}`);
                filteredProjects.push(project);
              }
            }
          }
          
          console.log(`[Matching] Filtered ${filteredProjects.length} projects from ${projects.length} total`);
          
          // ALWAYS use filtered projects, even if empty
          // This respects user's explicit choice of target universities
          projects = filteredProjects;
          filteredByUniversity = true;
          
          if (projects.length === 0) {
            console.log(`[Matching] No projects found from target universities. User should add more universities or wait for data scraping.`);
          }
        }
      } catch (e) {
        console.error("[Matching] Error parsing targetUniversities:", e);
        // If parsing fails, use all projects
      }
    } else {
      console.log("[Matching] No target universities set, using all projects");
    }

    const matches = [];
    for (const project of projects) {
      const university = await db.getUniversityById(project.universityId);
      const { score, reasons } = calculateMatchScore(profile, activities, project, university);
      
      if (score > 0) {
        await db.upsertProjectMatch({
          userId: ctx.user.id,
          projectId: project.id,
          matchScore: score.toString(),
          matchReasons: JSON.stringify(reasons),
          viewed: false,
          saved: false,
          applied: false,
        });
        
        matches.push({
          projectId: project.id,
          score,
          reasons,
        });
      }
    }

    // Sort by score
    matches.sort((a, b) => b.score - a.score);

    return {
      totalMatches: matches.length,
      matches: matches.slice(0, 10),
      strategy: 'traditional_matching',
    };
  }),

  // Get matches with full project details (with optional randomization)
  getMatchesWithDetails: protectedProcedure
    .input(z.object({ randomize: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
    const profile = await db.getStudentProfile(ctx.user.id);
    let matches = await db.getUserMatches(ctx.user.id);
    
    // SOFT PRIORITY: If user has target universities, try to filter matches from those universities
    // But if no matches found, show all available matches instead of empty results
    if (profile && profile.targetUniversities) {
      try {
        const targetUniversities = JSON.parse(profile.targetUniversities);
        if (targetUniversities && Array.isArray(targetUniversities) && targetUniversities.length > 0) {
          console.log(`[Matching] Filtering matches for ${targetUniversities.length} target universities`);
          
          // Filter matches to only include those from target universities
          const filteredMatches = [];
          for (const match of matches) {
            const project = await db.getResearchProjectById(match.projectId);
            if (project) {
              const university = await db.getUniversityById(project.universityId);
              if (university) {
                const isMatch = targetUniversities.some((tu: string) => universitiesMatch(university.name, tu));
                if (isMatch) {
                  console.log(`[Matching] Match kept: ${project.title} at ${university.name}`);
                  filteredMatches.push(match);
                } else {
                  console.log(`[Matching] Match filtered out: ${project.title} at ${university.name}`);
                }
              }
            }
          }
          
          console.log(`[Matching] Filtered ${filteredMatches.length} matches from ${matches.length} total`);
          
          // IMPORTANT: Only use filtered matches if we found some
          // If no matches found from target universities, show all matches instead of empty results
          if (filteredMatches.length > 0) {
            matches = filteredMatches;
          } else {
            console.log(`[Matching] No matches found from target universities, showing all ${matches.length} matches`);
            // Keep all matches - don't filter
          }
        }
      } catch (e) {
        console.error("[Matching] Error parsing targetUniversities in getMatchesWithDetails:", e);
        // If parsing fails, use all matches
      }
    }
    
    const matchesWithDetails = await Promise.all(
      matches.map(async (match) => {
        const project = await db.getResearchProjectById(match.projectId);
        const professor = project ? await db.getProfessorById(project.professorId) : null;
        const university = project ? await db.getUniversityById(project.universityId) : null;
        
        return {
          ...match,
          matchReasons: match.matchReasons ? JSON.parse(match.matchReasons) : [],
          project: project ? {
            ...project,
            requirements: project.requirements ? JSON.parse(project.requirements) : [],
            researchAreas: project.researchAreas ? JSON.parse(project.researchAreas) : [],
            majors: project.majors ? JSON.parse(project.majors) : [],
          } : null,
          professor: professor ? {
            ...professor,
            researchAreas: professor.researchAreas ? JSON.parse(professor.researchAreas) : [],
          } : null,
          university,
        };
      })
    );

    // If randomize is true, shuffle the results
    if (input?.randomize) {
      for (let i = matchesWithDetails.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matchesWithDetails[i], matchesWithDetails[j]] = [matchesWithDetails[j], matchesWithDetails[i]];
      }
    } else {
      matchesWithDetails.sort((a, b) => {
        const scoreA = parseFloat(a.matchScore || "0");
        const scoreB = parseFloat(b.matchScore || "0");
        return scoreB - scoreA;
      });
    }

    return matchesWithDetails;
  }),
});
