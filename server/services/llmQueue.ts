/**
 * LLM Queue Service - 并发控制和队列管理
 * 
 * 功能：
 * 1. 限制同时进行的LLM请求数量（默认3个）
 * 2. 超过限制的请求自动排队等待
 * 3. 防止超过LLM API的速率限制
 * 4. 提供统计信息（队列长度、处理中的请求数等）
 */

import pLimit from 'p-limit';
import { invokeLLM } from '../_core/llm';
import type { Message } from '../_core/llm';

// 全局LLM调用限制器：同时最多3个LLM请求
const llmLimit = pLimit(3);

// 统计信息
let totalRequests = 0;
let completedRequests = 0;
let failedRequests = 0;

/**
 * 带并发限制的LLM调用
 * @param params LLM调用参数
 * @returns LLM响应
 */
export async function invokeLLMWithLimit(params: {
  messages: Message[];
  response_format?: any;
  tool_choice?: any;
  tools?: any[];
}): Promise<any> {
  totalRequests++;
  
  return llmLimit(async () => {
    try {
      console.log(`[LLM Queue] Processing request (active: ${llmLimit.activeCount}, pending: ${llmLimit.pendingCount})`);
      
      const result = await invokeLLM(params);
      
      completedRequests++;
      console.log(`[LLM Queue] Request completed (total: ${completedRequests}/${totalRequests})`);
      
      return result;
    } catch (error) {
      failedRequests++;
      console.error(`[LLM Queue] Request failed:`, error);
      throw error;
    }
  });
}

/**
 * 获取队列统计信息
 */
export function getLLMQueueStats() {
  return {
    activeCount: llmLimit.activeCount,    // 正在处理的请求数
    pendingCount: llmLimit.pendingCount,  // 排队等待的请求数
    totalRequests,                        // 总请求数
    completedRequests,                    // 完成的请求数
    failedRequests,                       // 失败的请求数
    successRate: totalRequests > 0 
      ? ((completedRequests / totalRequests) * 100).toFixed(2) + '%'
      : '0%'
  };
}

/**
 * 重置统计信息（用于测试）
 */
export function resetLLMQueueStats() {
  totalRequests = 0;
  completedRequests = 0;
  failedRequests = 0;
}
