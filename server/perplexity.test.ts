import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Perplexity API Validation", () => {
  it("should have PERPLEXITY_API_KEY configured", () => {
    const apiKey = ENV.perplexityApiKey;
    
    // Check if API key is defined
    expect(apiKey).toBeDefined();
    expect(apiKey.length).toBeGreaterThan(0);
    
    // Check if API key has correct format (starts with pplx-)
    expect(apiKey).toMatch(/^pplx-/);
    
    console.log("✅ Perplexity API key is configured correctly");
    console.log(`API key format: ${apiKey.substring(0, 10)}...`);
  });
});
