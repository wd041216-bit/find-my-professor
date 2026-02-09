/**
 * 分数转换服务
 * 将实际覆盖率转换为更友好的展示分数
 */

/**
 * 慷慨的分段线性映射
 * 将覆盖率（0-100%）转换为展示分数（0-100分）
 * 
 * 转换规则（更慷慨版本 v2）：
 * - 0%   → 0分
 * - 10%  → 60分  （对低匹配非常友好）
 * - 30%  → 75分
 * - 40%  → 85分
 * - 50%  → 92分  （顶端教授显示90+分）
 * - 60%  → 95分
 * - 70%  → 97分
 * - 100% → 100分
 * 
 * @param coverageRate 实际覆盖率（0-1）
 * @returns 展示分数（0-100）
 */
export function convertCoverageToDisplayScore(coverageRate: number): number {
  // 确保输入在有效范围内
  const rate = Math.max(0, Math.min(1, coverageRate));
  
  let displayScore: number;
  
  if (rate >= 0.7) {
    // 70%-100%: 97分 → 100分
    // 斜率: (100-97)/(1-0.7) = 3/0.3 = 10
    displayScore = 97 + (rate - 0.7) * 10;
  } else if (rate >= 0.6) {
    // 60%-70%: 95分 → 97分
    // 斜率: (97-95)/(0.7-0.6) = 2/0.1 = 20
    displayScore = 95 + (rate - 0.6) * 20;
  } else if (rate >= 0.5) {
    // 50%-60%: 92分 → 95分
    // 斜率: (95-92)/(0.6-0.5) = 3/0.1 = 30
    displayScore = 92 + (rate - 0.5) * 30;
  } else if (rate >= 0.4) {
    // 40%-50%: 85分 → 92分
    // 斜率: (92-85)/(0.5-0.4) = 7/0.1 = 70
    displayScore = 85 + (rate - 0.4) * 70;
  } else if (rate >= 0.3) {
    // 30%-40%: 75分 → 85分
    // 斜率: (85-75)/(0.4-0.3) = 10/0.1 = 100
    displayScore = 75 + (rate - 0.3) * 100;
  } else if (rate >= 0.1) {
    // 10%-30%: 60分 → 75分
    // 斜率: (75-60)/(0.3-0.1) = 15/0.2 = 75
    displayScore = 60 + (rate - 0.1) * 75;
  } else {
    // 0%-10%: 0分 → 60分
    // 斜率: 60/0.1 = 600
    displayScore = rate * 600;
  }
  
  // 四舍五入到整数
  return Math.round(displayScore);
}

/**
 * 获取转换映射表（用于文档和调试）
 */
export function getConversionTable(): Array<{ coverage: string; score: number }> {
  const testPoints = [0, 5, 10, 15, 20, 25, 30, 35, 40, 44, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
  
  return testPoints.map(cp => ({
    coverage: `${cp}%`,
    score: convertCoverageToDisplayScore(cp / 100)
  }));
}

/**
 * 批量转换（用于匹配结果列表）
 */
export function convertMatchScores(
  results: Array<{ matchScore: number; [key: string]: any }>
): Array<{ matchScore: number; displayScore: number; [key: string]: any }> {
  return results.map(result => ({
    ...result,
    displayScore: convertCoverageToDisplayScore(result.matchScore / 100)
  }));
}
