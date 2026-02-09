/**
 * 匹配等级定义服务
 * 根据匹配分数返回等级、颜色、图标等展示信息
 */

export type MatchLevel = 'excellent' | 'good' | 'fair' | 'low';

export interface MatchLevelInfo {
  level: MatchLevel;
  label: string;           // 中文标签
  labelEn: string;         // 英文标签
  color: string;           // Tailwind颜色类
  icon: string;            // 图标emoji
  description: string;     // 描述
}

/**
 * 根据展示分数获取匹配等级信息
 * @param displayScore 展示分数（0-100），已经过转换
 * @returns 匹配等级信息
 */
export function getMatchLevel(displayScore: number): MatchLevelInfo {
  if (displayScore >= 85) {
    return {
      level: 'excellent',
      label: '优秀匹配',
      labelEn: 'Excellent Match',
      color: 'green',
      icon: '🔥',
      description: '研究方向高度匹配，强烈推荐'
    };
  } else if (displayScore >= 75) {
    return {
      level: 'good',
      label: '良好匹配',
      labelEn: 'Good Match',
      color: 'blue',
      icon: '⭐',
      description: '研究方向较为匹配，值得考虑'
    };
  } else if (displayScore >= 60) {
    return {
      level: 'fair',
      label: '一般匹配',
      labelEn: 'Fair Match',
      color: 'yellow',
      icon: '✓',
      description: '有部分共同研究方向'
    };
  } else {
    return {
      level: 'low',
      label: '低匹配',
      labelEn: 'Low Match',
      color: 'gray',
      icon: '',
      description: '研究方向差异较大'
    };
  }
}

/**
 * 获取匹配等级的Tailwind CSS类
 */
export function getMatchLevelClasses(displayScore: number): {
  badge: string;
  text: string;
  bg: string;
} {
  const level = getMatchLevel(displayScore);
  
  const colorMap = {
    green: {
      badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950'
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950'
    },
    yellow: {
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950'
    },
    gray: {
      badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      text: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-900'
    }
  };
  
  return colorMap[level.color as keyof typeof colorMap];
}

/**
 * 格式化展示分数
 */
export function formatDisplayScore(displayScore: number): string {
  return `${displayScore}分`;
}

/**
 * 获取匹配度的详细说明
 */
export function getMatchDescription(displayScore: number, matchedCount: number, totalCount: number): string {
  const level = getMatchLevel(displayScore);
  const coverageRate = Math.round((matchedCount / totalCount) * 100);
  return `${level.label}：覆盖了您 ${matchedCount}/${totalCount} 个研究方向（${coverageRate}%）`;
}
