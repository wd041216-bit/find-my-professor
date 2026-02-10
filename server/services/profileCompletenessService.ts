import type { StudentProfile } from "../../drizzle/schema";

/**
 * 检测学生profile是否只填写了最低限度的信息
 * 最低限度信息：academicLevel, targetUniversities, targetMajors
 * 完整信息还包括：skills, gpa, interests等
 */
export function isMinimalProfile(student: StudentProfile): boolean {
  // 检查是否填写了基本的必填字段
  const hasBasicInfo =
    !!student.academicLevel && !!student.targetUniversities && !!student.targetMajors;

  if (!hasBasicInfo) {
    // 如果连基本信息都没填，也算作minimal
    return true;
  }

  // 检查是否填写了额外的详细信息
  const hasSkills = !!student.skills && student.skills.trim().length > 0;
  const hasGpa = !!student.gpa;
  const hasInterests = !!student.interests && student.interests.trim().length > 0;
  const hasBio = !!student.bio && student.bio.trim().length > 0;

  // 如果没有填写任何额外信息，则为minimal profile
  const hasAnyAdditionalInfo = hasSkills || hasGpa || hasInterests || hasBio;

  return !hasAnyAdditionalInfo;
}

/**
 * 获取profile完整度百分比（可选功能，用于未来的profile完善进度条）
 */
export function getProfileCompleteness(student: StudentProfile): number {
  const fields = [
    !!student.academicLevel,
    !!student.targetUniversities,
    !!student.targetMajors,
    !!student.skills && student.skills.trim().length > 0,
    !!student.gpa,
    !!student.interests && student.interests.trim().length > 0,
    !!student.bio && student.bio.trim().length > 0,
  ];

  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}
