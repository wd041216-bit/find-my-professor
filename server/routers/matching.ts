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

  // 1. Academic level match (15 points)
  if (profile && profile.academicLevel && project.academicLevel) {
    if (project.academicLevel === "all") {
      score += 15;
      reasons.push("Project is open to all academic levels");
    } else if (project.academicLevel === profile.academicLevel) {
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
  }

  // 2. Major match (30 points)
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

  // 3. Target major match (30 points)
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
  // If user has not filled in GPA, skip GPA matching (no penalty)

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
  // Calculate matches for current user
  calculateMatches: protectedProcedure.mutation(async ({ ctx }) => {
    const profile = await db.getStudentProfile(ctx.user.id);
    const activities = await db.getUserActivities(ctx.user.id);
    let projects = await db.getAllResearchProjects();

    // PRIORITY: If user has target universities, ONLY search in those universities
    if (profile && profile.targetUniversities) {
      try {
        const targetUniversities = JSON.parse(profile.targetUniversities);
        if (targetUniversities && targetUniversities.length > 0) {
          // Filter projects to only include those from target universities
          const filteredProjects = [];
          for (const project of projects) {
            const university = await db.getUniversityById(project.universityId);
            if (university && targetUniversities.some((tu: string) =>
              university.name.toLowerCase().includes(tu.toLowerCase()) ||
              tu.toLowerCase().includes(university.name.toLowerCase())
            )) {
              filteredProjects.push(project);
            }
          }
          projects = filteredProjects;
        }
      } catch (e) {
        // If parsing fails, use all projects
      }
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
