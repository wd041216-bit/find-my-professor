import type { StudentProfile } from "../../drizzle/schema";

/**
 * 检测学生profile是否只填写了最低限度的信息
 * 最低限度信息：academicLevel, targetMajors
 * 完整信息还包括：skills, gpa, interests等
 */
export function isMinimalProfile(student: StudentProfile): boolean {
  // 检查是否填写了额外的详细信息
  const hasSkills = !!student.skills && student.skills.trim().length > 0;
  const hasGpa = !!student.gpa;
  const hasInterests = !!student.interests && student.interests.trim().length > 0;
  const hasBio = !!student.bio && student.bio.trim().length > 0;

  // 只要填写了任何额外信息（skills/GPA/interests/bio），就不是 minimal profile
  const hasAnyAdditionalInfo = hasSkills || hasGpa || hasInterests || hasBio;

  // 如果有额外信息，就显示匹配分数；否则显示提示信息
  return !hasAnyAdditionalInfo;
}

/**
 * 获取profile完整度百分比（可选功能，用于未来的profile完善进度条）
 */
export function getProfileCompleteness(student: StudentProfile): number {
  const fields = [
    !!student.academicLevel,
    !!student.targetMajors,
    !!student.skills && student.skills.trim().length > 0,
    !!student.gpa,
    !!student.interests && student.interests.trim().length > 0,
    !!student.bio && student.bio.trim().length > 0,
  ];

  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}
