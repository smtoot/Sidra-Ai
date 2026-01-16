# GitHub Issues Creation Scripts

These scripts automatically create GitHub milestones, labels, and issues from the `GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md` file.

## Setup

1. Install dependencies:
```bash
cd .github/scripts
npm install
```

2. Set environment variables:
```bash
export GITHUB_TOKEN=your_github_token_here
export GITHUB_REPOSITORY=owner/repo-name
```

## Usage

### Run All Scripts

```bash
# From repository root
npm run create-milestones
npm run create-labels
npm run create-issues
```

### Or Run Individually

```bash
cd .github/scripts

# Create milestones
node create-milestones.js

# Create labels
node create-labels.js

# Create issues
node create-issues.js
```

## Scripts

### create-milestones.js

Creates 6 milestones for the booking system improvement phases:
- Phase 1: Critical Fixes
- Phase 2: Security & Validation
- Phase 3: Code Quality & Consistency
- Phase 4: Testing & Documentation
- Phase 5: Refactoring & Architecture
- Phase 6: Performance & Optimization

**Features:**
- Checks if milestones already exist (won't create duplicates)
- Sets due dates for each phase

### create-labels.js

Creates all necessary labels:
- Priority labels: `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- Type labels: `type:bug`, `type:security`, `type:refactor`, `type:test`, `type:docs`, `type:performance`
- Phase labels: `phase:1` through `phase:6`

**Features:**
- Updates existing labels if they already exist
- Creates new labels if they don't exist

### create-issues.js

Parses `GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md` and creates all 27 issues.

**Features:**
- Parses markdown file to extract issue details
- Checks if issues already exist (by title) to prevent duplicates
- Assigns labels and milestones automatically
- Includes rate limiting (1 second delay between issues)

## Troubleshooting

### "GITHUB_TOKEN not set"
Make sure you've set the `GITHUB_TOKEN` environment variable with a valid GitHub personal access token.

### "GITHUB_REPOSITORY not set"
Set the `GITHUB_REPOSITORY` environment variable in the format `owner/repo-name`.

### "Issues file not found"
Make sure `GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md` exists in the repository root.

### "Rate limit exceeded"
GitHub has rate limits. The script includes delays, but if you hit the limit, wait an hour and try again.

### "Milestone not found"
Make sure to run `create-milestones.js` before `create-issues.js`.

## Notes

- All scripts are idempotent - safe to run multiple times
- Issues are matched by title to prevent duplicates
- Labels and milestones are updated if they already exist
- The scripts use the GitHub REST API via `@octokit/rest`
