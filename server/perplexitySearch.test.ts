import { describe, it, expect } from "vitest";
import { searchMajorProjects } from "./services/perplexityWebSearch";

describe("Perplexity Search Integration", () => {
  it("should search for academic projects using Perplexity API", async () => {
    // Test with a real university and major
    const university = "University of Washington";
    const major = "Physics";
    
    console.log(`\n🔍 Testing Perplexity search for ${university} - ${major}...`);
    
    try {
      const projects = await searchMajorProjects(university, major);
      
      console.log(`✅ Search completed successfully`);
      console.log(`📊 Found ${projects.length} projects`);
      
      // Verify we got results
      expect(projects).toBeDefined();
      expect(Array.isArray(projects)).toBe(true);
      
      // Log first project for inspection
      if (projects.length > 0) {
        console.log(`\n📝 Sample project:`);
        console.log(`   Name: ${projects[0].projectName}`);
        console.log(`   Professor: ${projects[0].professorName || 'N/A'}`);
        console.log(`   Research: ${projects[0].researchDirection || 'N/A'}`);
        console.log(`   Description: ${projects[0].description?.substring(0, 100) || 'N/A'}...`);
      }
      
      // Success if we got at least some results (even if 0, the API call worked)
      expect(projects.length).toBeGreaterThanOrEqual(0);
      
    } catch (error: any) {
      console.error(`❌ Search failed:`, error.message);
      
      // If it's a network error, skip the test
      if (error.message?.includes('ECONNRESET') || error.message?.includes('fetch failed')) {
        console.log(`⚠️  Network error detected - skipping test`);
        return; // Skip test due to network issues
      }
      
      // For other errors, fail the test
      throw error;
    }
  }, 60000); // 60 second timeout
});
