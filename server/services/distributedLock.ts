/**
 * Distributed Lock Service
 * 
 * 使用数据库的唯一约束实现分布式锁，防止多用户同时处理相同内容时重复调用LLM
 * 
 * 工作原理：
 * 1. 用户A输入"MIT" → 尝试获取锁 → 成功 → 调用LLM
 * 2. 用户B输入"MIT" → 尝试获取锁 → 失败（锁已被占用）→ 等待并查询缓存
 * 3. 用户A完成处理 → 释放锁 → 用户B获取缓存数据
 */

import mysql from 'mysql2/promise';

// Database connection pool
let connectionPool: mysql.Pool | null = null;

function getConnectionPool(): mysql.Pool {
  if (!connectionPool && process.env.DATABASE_URL) {
    connectionPool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 50,
      queueLimit: 100,
      waitForConnections: true,
      connectTimeout: 10000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }
  if (!connectionPool) {
    throw new Error('Database connection not available');
  }
  return connectionPool;
}

export class DistributedLock {
  
  /**
   * 尝试获取锁
   * @param lockKey 锁的唯一标识
   * @param lockType 锁的类型（university/major/scraping）
   * @param expiresInSeconds 锁的过期时间（秒），默认60秒
   * @returns 是否成功获取锁
   */
  static async acquireLock(
    lockKey: string,
    lockType: 'university' | 'major' | 'scraping',
    expiresInSeconds: number = 60
  ): Promise<boolean> {
    const db = getConnectionPool();
    
    try {
      const tableName = lockType === 'scraping' ? 'scraping_locks' : 'normalization_locks';
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
      
      if (lockType === 'scraping') {
        // 爬取锁表
        await db.execute(
          `INSERT INTO ${tableName} (lock_key, status, expires_at) VALUES (?, 'processing', ?)`,
          [lockKey, expiresAt]
        );
      } else {
        // 规范化锁表
        await db.execute(
          `INSERT INTO ${tableName} (lock_key, lock_type, status, expires_at) VALUES (?, ?, 'processing', ?)`,
          [lockKey, lockType, expiresAt]
        );
      }
      
      console.log(`[DistributedLock] Acquired lock: ${lockKey} (${lockType})`);
      return true;
    } catch (error: any) {
      // 唯一约束冲突 = 锁已被占用
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`[DistributedLock] Lock already held: ${lockKey} (${lockType})`);
        return false;
      }
      throw error;
    }
  }
  
  /**
   * 释放锁
   * @param lockKey 锁的唯一标识
   * @param lockType 锁的类型
   */
  static async releaseLock(
    lockKey: string,
    lockType: 'university' | 'major' | 'scraping'
  ): Promise<void> {
    const db = getConnectionPool();
    const tableName = lockType === 'scraping' ? 'scraping_locks' : 'normalization_locks';
    
    await db.execute(
      `DELETE FROM ${tableName} WHERE lock_key = ?`,
      [lockKey]
    );
    
    console.log(`[DistributedLock] Released lock: ${lockKey} (${lockType})`);
  }
  
  /**
   * 等待锁释放并重试
   * @param lockKey 锁的唯一标识
   * @param maxRetries 最大重试次数
   * @param retryDelayMs 重试间隔（毫秒）
   * @returns 是否成功（锁已释放）
   */
  static async waitForLockRelease(
    lockKey: string,
    lockType: 'university' | 'major' | 'scraping',
    maxRetries: number = 10,
    retryDelayMs: number = 1000
  ): Promise<boolean> {
    const db = getConnectionPool();
    const tableName = lockType === 'scraping' ? 'scraping_locks' : 'normalization_locks';
    
    for (let i = 0; i < maxRetries; i++) {
      // 检查锁是否已释放
      const [rows] = await db.execute(
        `SELECT status FROM ${tableName} WHERE lock_key = ?`,
        [lockKey]
      ) as any;
      
      if (rows.length === 0) {
        // 锁已释放
        console.log(`[DistributedLock] Lock released after ${i + 1} retries: ${lockKey}`);
        return true;
      }
      
      // 等待后重试
      console.log(`[DistributedLock] Waiting for lock release (${i + 1}/${maxRetries}): ${lockKey}`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
    
    // 超时
    console.log(`[DistributedLock] Timeout waiting for lock: ${lockKey}`);
    return false;
  }
  
  /**
   * 清理过期的锁
   */
  static async cleanupExpiredLocks(): Promise<void> {
    const db = getConnectionPool();
    
    const [result1] = await db.execute(
      `DELETE FROM normalization_locks WHERE expires_at < NOW()`
    ) as any;
    
    const [result2] = await db.execute(
      `DELETE FROM scraping_locks WHERE expires_at < NOW()`
    ) as any;
    
    const total = (result1.affectedRows || 0) + (result2.affectedRows || 0);
    if (total > 0) {
      console.log(`[DistributedLock] Cleaned up ${total} expired locks`);
    }
  }
}

/**
 * 辅助函数：使用分布式锁执行操作
 * @param lockKey 锁的唯一标识
 * @param lockType 锁的类型
 * @param operation 要执行的操作
 * @param onLockHeld 锁被占用时的回调（可选）
 * @returns 操作结果
 */
export async function withDistributedLock<T>(
  lockKey: string,
  lockType: 'university' | 'major' | 'scraping',
  operation: () => Promise<T>,
  onLockHeld?: () => Promise<T>
): Promise<T> {
  // 尝试获取锁
  const acquired = await DistributedLock.acquireLock(lockKey, lockType);
  
  if (acquired) {
    try {
      // 执行操作
      const result = await operation();
      return result;
    } finally {
      // 释放锁
      await DistributedLock.releaseLock(lockKey, lockType);
    }
  } else {
    // 锁被占用，等待释放
    if (onLockHeld) {
      await DistributedLock.waitForLockRelease(lockKey, lockType);
      return await onLockHeld();
    } else {
      throw new Error(`Lock is held by another process: ${lockKey}`);
    }
  }
}
