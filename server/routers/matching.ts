import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

// Calculate match score between student profile and research project
function calculateMatchScore(
  profile: any,
  activities: any[],
  project: any,
  university: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Parse project requirements
  const projectMajors = project.majors ? JSON.parse(project.majors) : [];
  const projectAreas = project.researchAreas ? JSON.parse(project.researchAreas) : [];
  const projectRequirements = project.requirements ? JSON.parse(project.requirements) : [];

  // 1. Academic level match (15 points) - New criterion
  if (profile && profile.academicLevel && project.academicLevel) {
    if (project.academicLevel === "all") {
      // Project accepts all levels
      score += 15;
      reasons.push("Project is open to all academic levels");
    } else if (project.academicLevel === profile.academicLevel) {
      // Exact match
      score += 15;
      reasons.push(`Project is suitable for ${profile.academicLevel} students`);
    } else {
      // Partial credit for adjacent levels
      const levelOrder = ["high_school", "undergraduate", "graduate"];
      const profileIndex = levelOrder.indexOf(profile.academicLevel);
      const projectIndex = levelOrder.indexOf(project.academicLevel);
      if (Math.abs(profileIndex - projectIndex) === 1) {
        score += 5;
        reasons.push("Project may be suitable for your academic level");
      }
    }
  }

  // 2. Major match (25 points) - Current major (reduced from 30)
  if (profile && profile.currentMajor) {
    const majorMatch = projectMajors.some((major: string) =>
      profile.currentMajor.toLowerCase().includes(major.toLowerCase()) ||
      major.toLowerCase().includes(profile.currentMajor.toLowerCase())
    );
    if (majorMatch) {
      score += 30;
      reasons.push(`Your major (${profile.currentMajor}) aligns with project requirements`);
    }
  }

  // 3. Target major match (25 points) - Target majors (reduced from 30)
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
      university.name.toLowerCase().includes(tu.toLowerCase()) ||
      tu.toLowerCase().includes(university.name.toLowerCase())
    );
    if (univMatch) {
      score += 20;
      reasons.push(`Project is at your target university (${university.name})`);
    }
  }

  // 5. Research interest match (15 points) - Reduced from 20
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

  // 6. Skills match (10 points) - Reduced from 15
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

  // 7. Relevant experience (5 points)
  const relevantActivities = activities.filter(activity => {
    const activitySkills = activity.skills ? JSON.parse(activity.skills) : [];
    return projectAreas.some((area: string) =>
      activity.title.toLowerCase().includes(area.toLowerCase()) ||
      activity.description?.toLowerCase().includes(area.toLowerCase()) ||
      activitySkills.some((skill: string) =>
        area.toLowerCase().includes(skill.toLowerCase())
      )
    );
  });
  if (relevantActivities.length > 0) {
    const expScore = Math.min(5, relevantActivities.length * 2);
    score += expScore;
    reasons.push(`${relevantActivities.length} relevant activities found`);
  }

  return { score: Math.min(100, score), reasons };
}

export const matchingRouter = router({
  // Calculate matches for current user
  calculateMatches: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await db.getStudentProfile(ctx.user.id);
    const activities = await db.getUserActivities(ctx.user.id);
    const projects = await db.getAllResearchProjects();

    const matches = [];
    for (const project of projects) {
      const university = await db.getUniversityById(project.universityId);
      const { score, reasons } = calculateMatchScore(profile, activities, project, university);
      
      if (score > 0) {
        // Save or update match
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
      matches: matches.slice(0, 10), // Return top 10
    };
  }),

  // Get matches with full project details (with optional randomization)
  getMatchesWithDetails: protectedProcedure
    .input(z.object({ randomize: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
    const matches = await db.getUserMatches(ctx.user.id);
    
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
      // Fisher-Yates shuffle algorithm
      for (let i = matchesWithDetails.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matchesWithDetails[i], matchesWithDetails[j]] = [matchesWithDetails[j], matchesWithDetails[i]];
      }
    } else {
      // Sort by match score (descending)
      matchesWithDetails.sort((a, b) => {
        const scoreA = parseFloat(a.matchScore || "0");
        const scoreB = parseFloat(b.matchScore || "0");
        return scoreB - scoreA;
      });
    }

    return matchesWithDetails;
  }),
});
