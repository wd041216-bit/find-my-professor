import { describe, it, expect, beforeEach } from 'vitest';
import { checkAndResetCredits, deductCredits, addCredits, CREDIT_COSTS } from './credits';
import { getDb } from '../db';
import { userCredits, creditTransactions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Credits System', () => {
  const testUserId = 999999; // Use a high ID to avoid conflicts

  beforeEach(async () => {
    // Clean up test data
    const db = await getDb();
    if (db) {
      await db.delete(userCredits).where(eq(userCredits.userId, testUserId));
      await db.delete(creditTransactions).where(eq(creditTransactions.userId, testUserId));
    }
  });

  it('should create new user credits with 100 credits', async () => {
    const balance = await checkAndResetCredits(testUserId);
    expect(balance).toBe(100);
  });

  it('should reset credits to 100 on a new day', async () => {
    // First, create credits and deduct some
    await checkAndResetCredits(testUserId);
    await deductCredits(testUserId, 30, 'test_feature');
    
    // Manually set lastResetDate to yesterday
    const db = await getDb();
    if (db) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      await db.update(userCredits)
        .set({ lastResetDate: yesterdayStr })
        .where(eq(userCredits.userId, testUserId));
    }
    
    // Check credits - should reset to 100
    const balance = await checkAndResetCredits(testUserId);
    expect(balance).toBe(100);
  });

  it('should deduct credits successfully', async () => {
    await checkAndResetCredits(testUserId);
    
    const result = await deductCredits(testUserId, CREDIT_COSTS.RESUME_PARSE, 'resume_parse');
    
    expect(result.success).toBe(true);
    expect(result.remainingCredits).toBe(90); // 100 - 10
  });

  it('should fail to deduct credits when insufficient', async () => {
    await checkAndResetCredits(testUserId);
    
    // Try to deduct more than available
    const result = await deductCredits(testUserId, 150, 'test_feature');
    
    expect(result.success).toBe(false);
    expect(result.remainingCredits).toBe(100); // Should remain unchanged
    expect(result.message).toBe('Insufficient credits');
  });

  it('should add credits correctly', async () => {
    await checkAndResetCredits(testUserId);
    
    const newBalance = await addCredits(testUserId, 500, 'Purchase 500 credits');
    
    expect(newBalance).toBe(600); // 100 + 500
  });

  it('should track total consumed credits', async () => {
    await checkAndResetCredits(testUserId);
    
    await deductCredits(testUserId, 10, 'test1');
    await deductCredits(testUserId, 20, 'test2');
    
    const db = await getDb();
    if (db) {
      const result = await db.select().from(userCredits).where(eq(userCredits.userId, testUserId)).limit(1);
      const userCredit = result[0];
      
      expect(userCredit.totalConsumed).toBe(30); // 10 + 20
      expect(userCredit.credits).toBe(70); // 100 - 30
    }
  });

  it('should record credit transactions', async () => {
    await checkAndResetCredits(testUserId);
    await deductCredits(testUserId, 30, 'matching', 'Test matching');
    
    const db = await getDb();
    if (db) {
      const transactions = await db.select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, testUserId));
      
      expect(transactions.length).toBeGreaterThan(0);
      
      const consumptionTx = transactions.find(tx => tx.type === 'consumption');
      expect(consumptionTx).toBeDefined();
      expect(consumptionTx?.amount).toBe(-30);
      expect(consumptionTx?.relatedFeature).toBe('matching');
    }
  });
});
