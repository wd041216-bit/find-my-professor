import { getDb } from "../db";
import { userCredits, creditTransactions, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Credit costs for different operations
 */
export const CREDIT_COSTS = {
  RESUME_PARSE: 10,
  MATCHING: 30,
  LETTER_GENERATION: 15,
} as const;

/**
 * Get current date in user's timezone in YYYY-MM-DD format
 * @param timezone - IANA timezone string (e.g., "Asia/Shanghai", "America/New_York")
 */
function getCurrentDateInTimezone(timezone: string): string {
  try {
    const now = new Date();
    // Format date in user's timezone
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(now); // Returns YYYY-MM-DD
  } catch (error) {
    console.error(`[Credits] Invalid timezone: ${timezone}, falling back to UTC`, error);
    // Fallback to UTC if timezone is invalid
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Check and reset credits if needed
 * Returns the user's current credit balance
 */
export async function checkAndResetCredits(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get user's timezone
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userResult.length > 0 ? userResult[0] : null;
  const userTimezone = user?.timezone || "UTC";
  
  const today = getCurrentDateInTimezone(userTimezone);
  
  // Get or create user credits record
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  let userCredit = result.length > 0 ? result[0] : null;

  if (!userCredit) {
    // Create new credits record for user
    await db.insert(userCredits).values({
      userId,
      credits: 100,
      lastResetDate: today,
      totalConsumed: 0,
    });
    console.log(`[Credits] Created new credit record for user ${userId} with timezone ${userTimezone}`);
    return 100;
  }

  // Check if credits need to be reset (new day in user's timezone)
  if (userCredit.lastResetDate !== today) {
    await db.update(userCredits)
      .set({
        credits: 100,
        lastResetDate: today,
      })
      .where(eq(userCredits.userId, userId));
    console.log(`[Credits] Reset credits for user ${userId} (timezone: ${userTimezone}, last reset: ${userCredit.lastResetDate}, today: ${today})`);
    return 100;
  }

  return userCredit.credits;
}

/**
 * Deduct credits for an operation
 * Returns true if successful, false if insufficient credits
 */
export async function deductCredits(
  userId: number,
  amount: number,
  feature: string,
  description?: string
): Promise<{ success: boolean; remainingCredits: number; message?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First check and reset if needed
  const currentCredits = await checkAndResetCredits(userId);

  if (currentCredits < amount) {
    return {
      success: false,
      remainingCredits: currentCredits,
      message: "Insufficient credits",
    };
  }

  // Deduct credits
  const newBalance = currentCredits - amount;
  
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  const userCredit = result.length > 0 ? result[0] : null;

  await db.update(userCredits)
    .set({
      credits: newBalance,
      totalConsumed: (userCredit?.totalConsumed || 0) + amount,
    })
    .where(eq(userCredits.userId, userId));

  // Record transaction
  await db.insert(creditTransactions).values({
    userId,
    type: "consumption",
    amount: -amount,
    balanceAfter: newBalance,
    description: description || `Consumed ${amount} credits for ${feature}`,
    relatedFeature: feature,
  });

  return {
    success: true,
    remainingCredits: newBalance,
  };
}

/**
 * Add credits to user account (for purchases)
 */
export async function addCredits(
  userId: number,
  amount: number,
  description?: string,
  metadata?: any
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current credits
  await checkAndResetCredits(userId);
  
  const result = await db.select().from(userCredits).where(eq(userCredits.userId, userId)).limit(1);
  const userCredit = result.length > 0 ? result[0] : null;

  const newBalance = (userCredit?.credits || 100) + amount;

  await db.update(userCredits)
    .set({
      credits: newBalance,
    })
    .where(eq(userCredits.userId, userId));

  // Record transaction
  await db.insert(creditTransactions).values({
    userId,
    type: "purchase",
    amount,
    balanceAfter: newBalance,
    description: description || `Purchased ${amount} credits`,
    relatedFeature: "purchase",
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  return newBalance;
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: number): Promise<number> {
  return await checkAndResetCredits(userId);
}
