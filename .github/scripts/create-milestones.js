#!/usr/bin/env node

/**
 * Script to create GitHub milestones for Booking System Improvements
 * Run: node .github/scripts/create-milestones.js
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

const milestones = [
  {
    title: 'Phase 1: Critical Fixes',
    description: 'Fix all critical issues that prevent compilation or cause immediate security risks',
    due_on: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    state: 'open',
  },
  {
    title: 'Phase 2: Security & Validation',
    description: 'Implement comprehensive security fixes and input validation',
    due_on: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
    state: 'open',
  },
  {
    title: 'Phase 3: Code Quality & Consistency',
    description: 'Improve code quality, consistency, and maintainability',
    due_on: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), // 5 weeks from now
    state: 'open',
  },
  {
    title: 'Phase 4: Testing & Documentation',
    description: 'Add comprehensive tests and documentation',
    due_on: new Date(Date.now() + 49 * 24 * 60 * 60 * 1000).toISOString(), // 7 weeks from now
    state: 'open',
  },
  {
    title: 'Phase 5: Refactoring & Architecture',
    description: 'Refactor large service into smaller, focused services',
    due_on: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString(), // 10 weeks from now
    state: 'open',
  },
  {
    title: 'Phase 6: Performance & Optimization',
    description: 'Optimize queries and monitor performance (Ongoing)',
    due_on: null, // Ongoing, no due date
    state: 'open',
  },
];

async function createMilestones() {
  console.log('🚀 Creating milestones...\n');

  for (const milestone of milestones) {
    try {
      // Check if milestone already exists
      const { data: existingMilestones } = await octokit.issues.listMilestones({
        owner,
        repo,
        state: 'all',
      });

      const existing = existingMilestones.find((m) => m.title === milestone.title);

      if (existing) {
        console.log(`✓ Milestone "${milestone.title}" already exists (ID: ${existing.number})`);
        continue;
      }

      const { data } = await octokit.issues.createMilestone({
        owner,
        repo,
        title: milestone.title,
        description: milestone.description,
        due_on: milestone.due_on,
        state: milestone.state,
      });

      console.log(`✅ Created milestone: "${milestone.title}" (ID: ${data.number})`);
    } catch (error) {
      console.error(`❌ Error creating milestone "${milestone.title}":`, error.message);
      if (error.status === 422) {
        console.log(`   Milestone may already exist or have invalid data`);
      }
    }
  }

  console.log('\n✨ Milestone creation complete!');
}

createMilestones().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
