import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";

// Calculate match score between student profile and research project
function calculateMatchScore(
  profile: any,
  activities: any[],
  project: any
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Parse project requirements
  const projectMajors = project.majors ? JSON.parse(project.majors) : [];
  const projectAreas = project.researchAreas ? JSON.parse(project.researchAreas) : [];
  const projectRequirements = project.requirements ? JSON.parse(project.requirements) : [];

  // 1. Major match (30 points)
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

  // 2. Target major match (15 points)
  if (profile && profile.targetMajors) {
    const targetMajors = JSON.parse(profile.targetMajors);
    const targetMatch = projectMajors.some((major: string) =>
      targetMajors.some((tm: string) =>
        tm.toLowerCase().includes(major.toLowerCase()) ||
        major.toLowerCase().includes(tm.toLowerCase())
      )
    );
    if (targetMatch) {
      score += 15;
      reasons.push("Project matches your target majors");
    }
  }

  // 3. Research interest match (25 points)
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
      const interestScore = Math.min(25, interestMatchCount * 10);
      score += interestScore;
      reasons.push(`${interestMatchCount} research interests match project areas`);
    }
  }

  // 4. Skills match (20 points)
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
      const skillScore = Math.min(20, skillMatchCount * 7);
      score += skillScore;
      reasons.push(`${skillMatchCount} skills match project requirements`);
    }
  }

  // 5. Relevant experience (10 points)
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
    const expScore = Math.min(10, relevantActivities.length * 5);
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
      const { score, reasons } = calculateMatchScore(profile, activities, project);
      
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

  // Get matches with full project details
  getMatchesWithDetails: protectedProcedure.query(async ({ ctx }) => {
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

    return matchesWithDetails;
  }),
});
