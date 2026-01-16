#!/usr/bin/env node

/**
 * Script to create GitHub labels for Booking System Improvements
 * Run: node .github/scripts/create-labels.js
 */

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

const labels = [
  // Priority labels
  { name: 'priority:critical', color: 'd73a4a', description: 'P0 - Critical priority' },
  { name: 'priority:high', color: 'fb8500', description: 'P1 - High priority' },
  { name: 'priority:medium', color: 'ffb703', description: 'P2 - Medium priority' },
  { name: 'priority:low', color: '06aed5', description: 'P3 - Low priority' },
  
  // Type labels
  { name: 'type:bug', color: 'd73a4a', description: 'Bug fixes' },
  { name: 'type:security', color: 'b60205', description: 'Security improvements' },
  { name: 'type:refactor', color: '0e8a16', description: 'Code refactoring' },
  { name: 'type:test', color: '0052cc', description: 'Testing related' },
  { name: 'type:docs', color: '5319e7', description: 'Documentation' },
  { name: 'type:performance', color: '1d76db', description: 'Performance improvements' },
  
  // Phase labels
  { name: 'phase:1', color: 'd73a4a', description: 'Phase 1: Critical Fixes' },
  { name: 'phase:2', color: 'fb8500', description: 'Phase 2: Security & Validation' },
  { name: 'phase:3', color: 'ffb703', description: 'Phase 3: Code Quality' },
  { name: 'phase:4', color: '0e8a16', description: 'Phase 4: Testing & Docs' },
  { name: 'phase:5', color: '0052cc', description: 'Phase 5: Refactoring' },
  { name: 'phase:6', color: '1d76db', description: 'Phase 6: Performance' },
];

async function createLabels() {
  console.log('🚀 Creating labels...\n');

  for (const label of labels) {
    try {
      // Check if label already exists
      try {
        const { data: existingLabel } = await octokit.issues.getLabel({
          owner,
          repo,
          name: label.name,
        });

        // Update if exists
        await octokit.issues.updateLabel({
          owner,
          repo,
          name: label.name,
          color: label.color,
          description: label.description,
        });
        console.log(`✓ Updated label: "${label.name}"`);
      } catch (error) {
        if (error.status === 404) {
          // Label doesn't exist, create it
          await octokit.issues.createLabel({
            owner,
            repo,
            name: label.name,
            color: label.color,
            description: label.description,
          });
          console.log(`✅ Created label: "${label.name}"`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error(`❌ Error with label "${label.name}":`, error.message);
    }
  }

  console.log('\n✨ Label creation complete!');
}

createLabels().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
