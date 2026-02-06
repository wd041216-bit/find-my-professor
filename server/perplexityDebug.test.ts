import { describe, it } from "vitest";
import { ENV } from "./_core/env";

describe("Perplexity API Debug", () => {
  it("should show raw Perplexity API response", async () => {
    const university = "University of Washington";
    const major = "Physics";
    
    const prompt = `Find research projects and lab opportunities for ${major} students at ${university}.

Search for:
- Active research labs and projects
- Professor names and their research areas
- Lab websites and contact information
- Research opportunities for students

Return EXACTLY 10-15 projects in this JSON format:
{
  "projects": [
    {
      "projectName": "string",
      "professorName": "string",
      "lab": "string or null",
      "researchDirection": "string",
      "description": "string",
      "requirements": "string or null",
      "contactEmail": "string or null",
      "url": "string or null"
    }
  ]
}`;

    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ENV.perplexityApiKey}`,
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content: "You are a research project finder. Always return valid JSON with the exact structure requested."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Perplexity API error (${response.status}):`, errorText);
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('\n📦 Raw Perplexity API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n📝 Message Content:');
      console.log(data.choices[0]?.message?.content);
      
      // Try to parse the content
      try {
        const content = data.choices[0]?.message?.content;
        const parsed = JSON.parse(content);
        console.log('\n✅ Parsed JSON:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('\n❌ Failed to parse JSON:', e);
      }
      
    } catch (error: any) {
      console.error(`❌ Request failed:`, error.message);
      throw error;
    }
  }, 60000);
});
