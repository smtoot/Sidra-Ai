#!/usr/bin/env node

/**
 * Script to create GitHub issues from GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md
 * Run: node .github/scripts/create-issues.js
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

// Parse the issues markdown file
function parseIssuesFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // Split by issue markers (## Issue #)
  const issueSections = content.split(/^## Issue #/m);
  
  for (let i = 1; i < issueSections.length; i++) {
    const section = issueSections[i];
    
    // Extract issue number and title
    const headerMatch = section.match(/^(\d+): (.+?)$/m);
    if (!headerMatch) continue;
    
    const issueNumber = parseInt(headerMatch[1]);
    const title = headerMatch[2].trim();
    
    // Extract labels (handle backticks and commas)
    const labelsMatch = section.match(/\*\*Labels:\*\* (.+?)$/m);
    let labels = [];
    if (labelsMatch) {
      // Remove backticks and split by comma
      const labelsStr = labelsMatch[1].replace(/`/g, '').trim();
      labels = labelsStr.split(',').map(l => l.trim()).filter(l => l.length > 0);
    }
    
    // Extract milestone
    const milestoneMatch = section.match(/\*\*Milestone:\*\* (.+?)$/m);
    const milestone = milestoneMatch ? milestoneMatch[1].trim() : null;
    
    // Extract estimated time
    const timeMatch = section.match(/\*\*Estimated Time:\*\* (.+?)$/m);
    const estimatedTime = timeMatch ? timeMatch[1].trim() : null;
    
    // Extract description (everything between Description and Steps/Description end)
    const descMatch = section.match(/\*\*Description\*\*\n\n(.+?)(?:\n\n###|$)/s);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract steps (if exists)
    const stepsMatch = section.match(/### Steps to Fix\n\n(.+?)(?:\n\n### Acceptance Criteria|$)/s);
    const steps = stepsMatch ? stepsMatch[1].trim() : '';
    
    // Extract acceptance criteria (if exists)
    const criteriaMatch = section.match(/### Acceptance Criteria\n\n(.+?)(?:\n\n### Testing|$)/s);
    const acceptanceCriteria = criteriaMatch ? criteriaMatch[1].trim() : '';
    
    // Extract testing (if exists)
    const testingMatch = section.match(/### Testing\n\n(.+?)(?:\n\n---|$)/s);
    const testing = testingMatch ? testingMatch[1].trim() : '';
    
    // Build body with all sections
    let body = description;
    
    if (estimatedTime) {
      body += `\n\n**Estimated Time:** ${estimatedTime}`;
    }
    
    if (steps) {
      body += `\n\n### Steps to Fix\n\n${steps}`;
    }
    
    if (acceptanceCriteria) {
      body += `\n\n### Acceptance Criteria\n\n${acceptanceCriteria}`;
    }
    
    if (testing) {
      body += `\n\n### Testing\n\n${testing}`;
    }
    
    // Add footer
    body += `\n\n---\n\n*This issue was automatically created from the implementation plan.*`;
    
    issues.push({
      number: issueNumber,
      title,
      body,
      labels,
      milestone,
    });
  }
  
  return issues;
}

// Get milestone number by title
async function getMilestoneNumber(milestoneTitle) {
  try {
    const { data: milestones } = await octokit.issues.listMilestones({
      owner,
      repo,
      state: 'all',
    });
    
    const milestone = milestones.find((m) => m.title === milestoneTitle);
    return milestone ? milestone.number : null;
  } catch (error) {
    console.error(`Error fetching milestones:`, error.message);
    return null;
  }
}

async function createIssues() {
  const issuesFilePath = path.join(process.cwd(), 'GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md');
  
  if (!fs.existsSync(issuesFilePath)) {
    console.error(`❌ Issues file not found: ${issuesFilePath}`);
    process.exit(1);
  }
  
  console.log('📖 Parsing issues file...\n');
  const issues = parseIssuesFile(issuesFilePath);
  console.log(`Found ${issues.length} issues to create\n`);
  
  // Get all milestones
  const milestoneMap = new Map();
  for (const issue of issues) {
    if (issue.milestone && !milestoneMap.has(issue.milestone)) {
      const milestoneNumber = await getMilestoneNumber(issue.milestone);
      milestoneMap.set(issue.milestone, milestoneNumber);
    }
  }
  
  console.log('🚀 Creating issues...\n');
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const issue of issues) {
    try {
      // Check if issue already exists (by title)
      const { data: existingIssues } = await octokit.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        per_page: 100,
      });
      
      const existing = existingIssues.find((i) => i.title === issue.title);
      
      if (existing) {
        console.log(`⏭️  Skipped: "${issue.title}" (already exists: #${existing.number})`);
        skipped++;
        continue;
      }
      
      // Prepare issue data
      const issueData = {
        owner,
        repo,
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
      };
      
      // Add milestone if available
      if (issue.milestone) {
        const milestoneNumber = milestoneMap.get(issue.milestone);
        if (milestoneNumber) {
          issueData.milestone = milestoneNumber;
        } else {
          console.warn(`⚠️  Warning: Milestone "${issue.milestone}" not found for issue "${issue.title}"`);
        }
      }
      
      // Create issue
      const { data } = await octokit.issues.create(issueData);
      
      console.log(`✅ Created: "${issue.title}" (#${data.number})`);
      created++;
      
      // Rate limiting: wait 1 second between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error creating issue "${issue.title}":`, error.message);
      if (error.status === 422) {
        console.error(`   Issue may have invalid data or duplicate title`);
      }
      errors++;
    }
  }
  
  console.log('\n✨ Issue creation complete!');
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

createIssues().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
