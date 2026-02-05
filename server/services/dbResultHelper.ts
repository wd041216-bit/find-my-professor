/**
 * Helper function to safely extract rows from database query results
 * Handles different result formats from drizzle-orm
 */
export function safeGetRows<T = any>(result: any): T[] {
  if (!result) {
    return [];
  }

  try {
    // Format 1: { rows: [...] }
    if (typeof result === 'object' && !Array.isArray(result) && Array.isArray(result.rows)) {
      return result.rows as T[];
    }

    // Format 2: [[...], fields] (mysql2 format)
    if (Array.isArray(result) && result.length >= 1 && Array.isArray(result[0])) {
      return result[0] as T[];
    }

    // Format 3: [...] (direct array of rows)
    if (Array.isArray(result)) {
      return result as T[];
    }

    // Unknown format, return empty array
    console.warn('[safeGetRows] Unknown result format:', typeof result, result);
    return [];
  } catch (e) {
    console.error('[safeGetRows] Error parsing result:', e);
    return [];
  }
}

/**
 * Safely get count from a COUNT(*) query result
 */
export function safeGetCount(result: any): number {
  const rows = safeGetRows(result);
  if (rows.length === 0) {
    return 0;
  }

  const firstRow = rows[0] as any;
  if (!firstRow) {
    return 0;
  }

  // Try different column names
  const count = firstRow.count ?? firstRow.COUNT ?? firstRow['COUNT(*)'] ?? 0;
  const parsed = parseInt(String(count), 10);
  return isNaN(parsed) ? 0 : parsed;
}
