/**
 * Test script to crawl University of Washington Computer Science research projects
 * This script directly tests the scraping service without going through the web interface
 */

import 'dotenv/config';
import { ScrapingService } from './server/services/scraping.ts';
import fs from 'fs';

async function testUWCrawler() {
  console.log('=== Testing University of Washington CS Crawler ===\n');
  
  const universityName = 'University of Washington';
  const majorName = 'computer science';
  const degreeLevel = 'all';
  
  console.log(`Target: ${universityName}`);
  console.log(`Major: ${majorName}`);
  console.log(`Degree Level: ${degreeLevel}\n`);
  
  try {
    console.log('Step 1: Checking cache...');
    const cached = await ScrapingService.getCachedProjects(universityName, majorName, degreeLevel);
    
    if (cached.cached && cached.projects.length > 0) {
      console.log(`✓ Found ${cached.projects.length} cached projects (age: ${cached.cacheAge} days)`);
      console.log('Using cached data for report\n');
      return cached.projects;
    } else {
      console.log('✗ No cached data found\n');
    }
    
    console.log('Step 2: Triggering scraping task...');
    await ScrapingService.triggerScraping(universityName, majorName, degreeLevel);
    console.log('✓ Scraping task triggered\n');
    
    console.log('Step 3: Waiting for scraping to complete (this may take 1-3 minutes)...');
    
    // Poll for results every 10 seconds, max 5 minutes
    const maxAttempts = 30;
    let attempts = 0;
    let projects = [];
    
    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      console.log(`Checking results (attempt ${attempts}/${maxAttempts})...`);
      
      const result = await ScrapingService.getCachedProjects(universityName, majorName, degreeLevel);
      
      if (result.cached && result.projects.length > 0) {
        console.log(`✓ Scraping completed! Found ${result.projects.length} projects\n`);
        projects = result.projects;
        break;
      }
    }
    
    if (projects.length === 0) {
      console.log('✗ Scraping timed out or returned no results');
      console.log('This could mean:');
      console.log('  - The scraping task is still running (check database)');
      console.log('  - No projects were found for this university/major');
      console.log('  - The scraping service encountered an error\n');
    }
    
    return projects;
    
  } catch (error) {
    console.error('Error during crawling test:', error);
    throw error;
  }
}

async function generateReport(projects) {
  console.log('=== Generating Report ===\n');
  
  const report = {
    metadata: {
      university: 'University of Washington',
      major: 'Computer Science',
      crawlDate: new Date().toISOString(),
      totalProjects: projects.length,
    },
    statistics: {
      withProfessor: projects.filter(p => p.professorName).length,
      withLab: projects.filter(p => p.labName).length,
      withEmail: projects.filter(p => p.contactEmail).length,
      withDescription: projects.filter(p => p.projectDescription).length,
      withRequirements: projects.filter(p => p.requirements).length,
    },
    projects: projects.map(p => ({
      professor: p.professorName || 'N/A',
      lab: p.labName || 'N/A',
      researchArea: p.researchArea || 'N/A',
      title: p.projectTitle || 'N/A',
      description: p.projectDescription || 'N/A',
      requirements: p.requirements || 'N/A',
      email: p.contactEmail || 'N/A',
      sourceUrl: p.sourceUrl || 'N/A',
    })),
  };
  
  // Save as JSON
  const jsonPath = '/home/ubuntu/uw-cs-crawler-report.json';
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`✓ JSON report saved to: ${jsonPath}`);
  
  // Generate Markdown report
  let markdown = `# University of Washington Computer Science Research Projects Crawler Report\n\n`;
  markdown += `**Crawl Date:** ${new Date().toLocaleString()}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `- **Total Projects Found:** ${report.metadata.totalProjects}\n`;
  markdown += `- **Projects with Professor Name:** ${report.statistics.withProfessor}\n`;
  markdown += `- **Projects with Lab Name:** ${report.statistics.withLab}\n`;
  markdown += `- **Projects with Contact Email:** ${report.statistics.withEmail}\n`;
  markdown += `- **Projects with Description:** ${report.statistics.withDescription}\n`;
  markdown += `- **Projects with Requirements:** ${report.statistics.withRequirements}\n\n`;
  
  if (projects.length === 0) {
    markdown += `## ⚠️ No Projects Found\n\n`;
    markdown += `The crawler did not find any research projects. This could indicate:\n\n`;
    markdown += `1. The URL mapping for University of Washington is incorrect\n`;
    markdown += `2. The filter rules are too strict and filtering out valid projects\n`;
    markdown += `3. The university website structure is not compatible with our crawler\n`;
    markdown += `4. The scraping task is still running in the background\n\n`;
  } else {
    markdown += `## Data Quality Analysis\n\n`;
    
    const completeness = (
      (report.statistics.withProfessor / report.metadata.totalProjects) * 25 +
      (report.statistics.withLab / report.metadata.totalProjects) * 20 +
      (report.statistics.withEmail / report.metadata.totalProjects) * 25 +
      (report.statistics.withDescription / report.metadata.totalProjects) * 20 +
      (report.statistics.withRequirements / report.metadata.totalProjects) * 10
    ).toFixed(1);
    
    markdown += `**Overall Data Completeness:** ${completeness}%\n\n`;
    
    markdown += `| Field | Coverage |\n`;
    markdown += `|-------|----------|\n`;
    markdown += `| Professor Name | ${((report.statistics.withProfessor / report.metadata.totalProjects) * 100).toFixed(1)}% |\n`;
    markdown += `| Lab Name | ${((report.statistics.withLab / report.metadata.totalProjects) * 100).toFixed(1)}% |\n`;
    markdown += `| Contact Email | ${((report.statistics.withEmail / report.metadata.totalProjects) * 100).toFixed(1)}% |\n`;
    markdown += `| Description | ${((report.statistics.withDescription / report.metadata.totalProjects) * 100).toFixed(1)}% |\n`;
    markdown += `| Requirements | ${((report.statistics.withRequirements / report.metadata.totalProjects) * 100).toFixed(1)}% |\n\n`;
    
    markdown += `## Projects List\n\n`;
    
    report.projects.forEach((project, index) => {
      markdown += `### ${index + 1}. ${project.title}\n\n`;
      markdown += `- **Professor:** ${project.professor}\n`;
      markdown += `- **Lab:** ${project.lab}\n`;
      markdown += `- **Research Area:** ${project.researchArea}\n`;
      markdown += `- **Contact:** ${project.email}\n`;
      markdown += `- **Source:** ${project.sourceUrl}\n\n`;
      markdown += `**Description:**\n${project.description}\n\n`;
      if (project.requirements !== 'N/A') {
        markdown += `**Requirements:**\n${project.requirements}\n\n`;
      }
      markdown += `---\n\n`;
    });
  }
  
  markdown += `## Recommendations\n\n`;
  
  if (projects.length === 0) {
    markdown += `1. Check the URL mapping in \`server/services/scraping.ts\` for University of Washington\n`;
    markdown += `2. Review filter rules to ensure they're not too restrictive\n`;
    markdown += `3. Manually verify the university's CS department website structure\n`;
  } else {
    if (report.statistics.withEmail / report.metadata.totalProjects < 0.5) {
      markdown += `1. **Low email coverage (${((report.statistics.withEmail / report.metadata.totalProjects) * 100).toFixed(1)}%)** - Improve email extraction logic\n`;
    }
    if (report.statistics.withDescription / report.metadata.totalProjects < 0.7) {
      markdown += `2. **Low description coverage (${((report.statistics.withDescription / report.metadata.totalProjects) * 100).toFixed(1)}%)** - Enhance description parsing\n`;
    }
    if (report.statistics.withRequirements / report.metadata.totalProjects < 0.3) {
      markdown += `3. **Low requirements coverage (${((report.statistics.withRequirements / report.metadata.totalProjects) * 100).toFixed(1)}%)** - Add requirements extraction\n`;
    }
  }
  
  const mdPath = '/home/ubuntu/uw-cs-crawler-report.md';
  fs.writeFileSync(mdPath, markdown);
  console.log(`✓ Markdown report saved to: ${mdPath}\n`);
  
  return { jsonPath, mdPath };
}

// Run the test
(async () => {
  try {
    const projects = await testUWCrawler();
    const { jsonPath, mdPath } = await generateReport(projects);
    
    console.log('=== Test Complete ===');
    console.log(`\nReports generated:`);
    console.log(`  - JSON: ${jsonPath}`);
    console.log(`  - Markdown: ${mdPath}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();
