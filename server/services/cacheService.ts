/**
 * Cache Service
 * 缓存常用数据以提升性能
 */

// Filter options缓存（学校和学院列表）
interface FilterOptions {
  universities: string[];
  departments: string[];
  timestamp: number;
}

let filterOptionsCache: FilterOptions | null = null;
const FILTER_CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 获取缓存的filter options
 */
export function getCachedFilterOptions(): FilterOptions | null {
  if (!filterOptionsCache) return null;
  
  // 检查缓存是否过期
  const now = Date.now();
  if (now - filterOptionsCache.timestamp > FILTER_CACHE_TTL) {
    filterOptionsCache = null;
    return null;
  }
  
  return filterOptionsCache;
}

/**
 * 设置filter options缓存
 */
export function setCachedFilterOptions(universities: string[], departments: string[]): void {
  filterOptionsCache = {
    universities,
    departments,
    timestamp: Date.now(),
  };
}

/**
 * 清除filter options缓存
 */
export function clearFilterOptionsCache(): void {
  filterOptionsCache = null;
}

// Profile完整度检查缓存
const profileCompletenessCache = new Map<number, { isMinimal: boolean; timestamp: number }>();
const PROFILE_CACHE_TTL = 2 * 60 * 1000; // 2分钟缓存

/**
 * 获取缓存的profile完整度检查结果
 */
export function getCachedProfileCompleteness(userId: number): boolean | null {
  const cached = profileCompletenessCache.get(userId);
  if (!cached) return null;
  
  // 检查缓存是否过期
  const now = Date.now();
  if (now - cached.timestamp > PROFILE_CACHE_TTL) {
    profileCompletenessCache.delete(userId);
    return null;
  }
  
  return cached.isMinimal;
}

/**
 * 设置profile完整度检查缓存
 */
export function setCachedProfileCompleteness(userId: number, isMinimal: boolean): void {
  profileCompletenessCache.set(userId, {
    isMinimal,
    timestamp: Date.now(),
  });
}

/**
 * 清除特定用户的profile完整度缓存
 */
export function clearProfileCompletenessCache(userId: number): void {
  profileCompletenessCache.delete(userId);
}

/**
 * 清除所有profile完整度缓存
 */
export function clearAllProfileCompletenessCache(): void {
  profileCompletenessCache.clear();
}
