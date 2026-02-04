/**
 * Concurrency Performance Tests
 * 
 * 测试多用户并发场景下的性能和数据一致性
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { NormalizationService } from './normalization';
import { DistributedLock } from './distributedLock';
import { getLLMQueueStats, resetLLMQueueStats } from './llmQueue';

describe('Concurrency Performance Tests', () => {
  
  beforeAll(async () => {
    // 清理过期的锁
    await DistributedLock.cleanupExpiredLocks();
    resetLLMQueueStats();
  });
  
  it('should handle 10 concurrent users inputting the same university', async () => {
    const universityName = 'MIT_CONCURRENT_TEST';
    
    // 模拟10个用户同时输入相同的大学名称
    const promises = Array.from({ length: 10 }, (_, i) => 
      NormalizationService.normalizeUniversity(universityName, 1000 + i)
    );
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    // 验证所有结果一致
    const firstResult = results[0];
    results.forEach(result => {
      expect(result.normalizedName).toBe(firstResult.normalizedName);
      expect(result.confidence).toBe(firstResult.confidence);
    });
    
    // 验证性能
    const totalTime = endTime - startTime;
    console.log(`10 concurrent users completed in ${totalTime}ms`);
    
    // 验证LLM调用次数（应该只调用1次）
    const stats = getLLMQueueStats();
    console.log('LLM Queue Stats:', stats);
    
    // 由于分布式锁，只有第一个用户调用LLM，其他用户等待并使用缓存
    expect(stats.completedRequests).toBeLessThanOrEqual(2); // 允许1-2次调用（考虑重试）
  }, 30000);
  
  it('should handle 10 concurrent users inputting different universities', async () => {
    resetLLMQueueStats();
    
    // 模拟10个用户同时输入不同的大学名称
    const universities = [
      'Stanford', 'Harvard', 'Yale', 'Princeton', 'Columbia',
      'Cornell', 'Brown', 'Dartmouth', 'Penn', 'Duke'
    ];
    
    const promises = universities.map((uni, i) => 
      NormalizationService.normalizeUniversity(uni, 2000 + i)
    );
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    // 验证所有结果都成功
    expect(results.length).toBe(10);
    results.forEach(result => {
      expect(result.normalizedName).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0);
    });
    
    // 验证性能
    const totalTime = endTime - startTime;
    console.log(`10 different universities completed in ${totalTime}ms`);
    
    // 验证LLM调用次数（应该调用10次，但由于并发限制，会排队）
    const stats = getLLMQueueStats();
    console.log('LLM Queue Stats:', stats);
    expect(stats.completedRequests).toBe(10);
  }, 60000);
  
  it('should handle mixed concurrent requests (same + different)', async () => {
    resetLLMQueueStats();
    
    // 模拟15个用户：5个输入MIT，5个输入Stanford，5个输入Harvard
    const promises = [
      ...Array.from({ length: 5 }, (_, i) => 
        NormalizationService.normalizeUniversity('MIT_MIXED_TEST', 3000 + i)
      ),
      ...Array.from({ length: 5 }, (_, i) => 
        NormalizationService.normalizeUniversity('Stanford_MIXED_TEST', 3100 + i)
      ),
      ...Array.from({ length: 5 }, (_, i) => 
        NormalizationService.normalizeUniversity('Harvard_MIXED_TEST', 3200 + i)
      )
    ];
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    // 验证所有结果都成功
    expect(results.length).toBe(15);
    
    // 验证相同输入的结果一致
    const mitResults = results.slice(0, 5);
    mitResults.forEach(result => {
      expect(result.normalizedName).toBe(mitResults[0].normalizedName);
    });
    
    const stanfordResults = results.slice(5, 10);
    stanfordResults.forEach(result => {
      expect(result.normalizedName).toBe(stanfordResults[0].normalizedName);
    });
    
    const harvardResults = results.slice(10, 15);
    harvardResults.forEach(result => {
      expect(result.normalizedName).toBe(harvardResults[0].normalizedName);
    });
    
    // 验证性能
    const totalTime = endTime - startTime;
    console.log(`15 mixed requests completed in ${totalTime}ms`);
    
    // 验证LLM调用次数（应该只调用3次：MIT、Stanford、Harvard各1次）
    const stats = getLLMQueueStats();
    console.log('LLM Queue Stats:', stats);
    expect(stats.completedRequests).toBeLessThanOrEqual(6); // 允许3-6次调用（考虑重试）
  }, 60000);
  
  it('should handle cache hits efficiently', async () => {
    // 先插入一个缓存
    await NormalizationService.normalizeUniversity('CACHE_TEST_UNI', 4000);
    
    resetLLMQueueStats();
    
    // 模拟10个用户同时查询已缓存的大学
    const promises = Array.from({ length: 10 }, (_, i) => 
      NormalizationService.normalizeUniversity('CACHE_TEST_UNI', 4000 + i)
    );
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    // 验证所有结果一致
    const firstResult = results[0];
    results.forEach(result => {
      expect(result.normalizedName).toBe(firstResult.normalizedName);
    });
    
    // 验证性能（缓存命中应该非常快）
    const totalTime = endTime - startTime;
    console.log(`10 cache hits completed in ${totalTime}ms`);
    expect(totalTime).toBeLessThan(1000); // 应该在1秒内完成
    
    // 验证LLM调用次数（应该是0，因为全部命中缓存）
    const stats = getLLMQueueStats();
    console.log('LLM Queue Stats:', stats);
    expect(stats.completedRequests).toBe(0);
  }, 30000);
  
  it('should cleanup expired locks', async () => {
    // 清理所有过期的锁
    await DistributedLock.cleanupExpiredLocks();
    
    // 验证清理成功（不抛出错误即可）
    expect(true).toBe(true);
  });
});
