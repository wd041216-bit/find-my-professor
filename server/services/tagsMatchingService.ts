/**
 * 基于tags的匹配算法服务
 * 计算学生tags和教授tags的相似度
 */

export interface MatchResult {
  professorName: string;
  projectTitle: string;
  professorTags: string[];
  matchScore: number;  // 0-100
  matchedTags: string[];  // 匹配上的tags
  sourceUrl?: string;
}

/**
 * 计算两个tags数组的Jaccard相似度
 * Jaccard Similarity = |A ∩ B| / |A ∪ B|
 */
function calculateJaccardSimilarity(tags1: string[], tags2: string[]): number {
  const set1 = new Set(tags1.map(t => t.toLowerCase()));
  const set2 = new Set(tags2.map(t => t.toLowerCase()));
  
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * 计算tags的部分匹配度（考虑子串匹配）
 * 例如："machine-learning" 和 "machine" 有部分匹配
 */
function calculatePartialMatch(tags1: string[], tags2: string[]): number {
  const normalized1 = tags1.map(t => t.toLowerCase());
  const normalized2 = tags2.map(t => t.toLowerCase());
  
  let partialMatches = 0;
  
  for (const tag1 of normalized1) {
    for (const tag2 of normalized2) {
      // 完全匹配
      if (tag1 === tag2) {
        partialMatches += 1;
      }
      // 部分匹配（一个是另一个的子串）
      else if (tag1.includes(tag2) || tag2.includes(tag1)) {
        partialMatches += 0.5;
      }
      // 词根匹配（去掉连字符后比较）
      else {
        const words1 = tag1.split('-');
        const words2 = tag2.split('-');
        const commonWords = words1.filter(w => words2.includes(w));
        if (commonWords.length > 0) {
          partialMatches += 0.3 * commonWords.length;
        }
      }
    }
  }
  
  return partialMatches;
}

/**
 * 计算匹配分数（0-100）
 * @param studentTags 学生的研究tags
 * @param professorTags 教授的研究tags
 * @returns 匹配分数（0-100）
 */
export function calculateMatchScore(
  studentTags: string[],
  professorTags: string[]
): number {
  if (studentTags.length === 0 || professorTags.length === 0) {
    return 0;
  }
  
  // 计算Jaccard相似度（权重60%）
  const jaccardScore = calculateJaccardSimilarity(studentTags, professorTags);
  
  // 计算部分匹配度（权重40%）
  const partialMatches = calculatePartialMatch(studentTags, professorTags);
  const maxPossibleMatches = Math.max(studentTags.length, professorTags.length);
  const partialScore = Math.min(partialMatches / maxPossibleMatches, 1);
  
  // 综合分数
  const finalScore = (jaccardScore * 0.6 + partialScore * 0.4) * 100;
  
  return Math.round(finalScore);
}

/**
 * 找出匹配上的tags
 */
export function getMatchedTags(
  studentTags: string[],
  professorTags: string[]
): string[] {
  const normalized1 = studentTags.map(t => t.toLowerCase());
  const normalized2 = professorTags.map(t => t.toLowerCase());
  
  const matched = new Set<string>();
  
  for (let i = 0; i < studentTags.length; i++) {
    for (let j = 0; j < professorTags.length; j++) {
      if (normalized1[i] === normalized2[j]) {
        matched.add(professorTags[j]);  // 使用原始大小写
      } else if (normalized1[i].includes(normalized2[j]) || normalized2[j].includes(normalized1[i])) {
        matched.add(professorTags[j]);
      }
    }
  }
  
  return Array.from(matched);
}

/**
 * 对教授列表按匹配度排序
 */
export function rankProfessorsByMatch(
  studentTags: string[],
  professors: Array<{ professorName: string; projectTitle: string; tags: string[]; sourceUrl?: string }>
): MatchResult[] {
  const results: MatchResult[] = professors.map(prof => {
    const matchScore = calculateMatchScore(studentTags, prof.tags);
    const matchedTags = getMatchedTags(studentTags, prof.tags);
    
    return {
      professorName: prof.professorName,
      projectTitle: prof.projectTitle,
      professorTags: prof.tags,
      matchScore,
      matchedTags,
      sourceUrl: prof.sourceUrl
    };
  });
  
  // 按匹配分数降序排序
  results.sort((a, b) => b.matchScore - a.matchScore);
  
  return results;
}
