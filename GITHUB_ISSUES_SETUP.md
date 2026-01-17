# GitHub Issues Auto-Creation Setup Guide

This guide explains how to automatically create all 27 GitHub issues, 6 milestones, and labels for the Booking System Improvements project.

## Quick Start

### Option 1: GitHub Actions (Recommended)

**Important:** The workflow is configured for the `develop` branch:
- **For automatic triggers:** Only runs on `develop` branch when files change
- **For manual triggers:** Defaults to `develop` branch (can be changed)
- **Issues created:** Always created in the repository (not branch-specific)

1. **Push the workflow files to your repository:**
   ```bash
   git checkout develop
   git add .github/workflows/create-booking-issues.yml
   git add .github/scripts/
   git commit -m "Add GitHub Actions workflow for auto-creating issues"
   git push origin develop
   ```
   
   **Note:** Push to `develop` branch for automatic triggers.

2. **Run the workflow:**
   - Go to your GitHub repository
   - Click on "Actions" tab
   - Select "Create Booking System Improvement Issues"
   - Click "Run workflow"
   - **Select branch:** Defaults to `develop` (can be changed if needed)
     - The workflow will read `GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md` from the selected branch
     - Issues will be created in the repository (not branch-specific)
   - Click "Run workflow"

3. **Wait for completion:**
   - The workflow will create milestones first
   - Then create labels
   - Finally create all 27 issues
   - Check the Actions tab for progress

### Option 2: Manual Script Execution

1. **Set up environment:**
   ```bash
   export GITHUB_TOKEN=your_github_personal_access_token
   export GITHUB_REPOSITORY=your-username/your-repo
   ```

2. **Run the script:**
   ```bash
   ./scripts/create-github-issues.sh
   ```

   Or manually:
   ```bash
   cd .github/scripts
   npm install
   node create-milestones.js
   node create-labels.js
   node create-issues.js
   ```

## What Gets Created

### Milestones (6)
- Phase 1: Critical Fixes (Due: 1 week)
- Phase 2: Security & Validation (Due: 3 weeks)
- Phase 3: Code Quality & Consistency (Due: 5 weeks)
- Phase 4: Testing & Documentation (Due: 7 weeks)
- Phase 5: Refactoring & Architecture (Due: 10 weeks)
- Phase 6: Performance & Optimization (Ongoing)

### Labels (16)
**Priority:**
- `priority:critical` (red)
- `priority:high` (orange)
- `priority:medium` (yellow)
- `priority:low` (green)

**Type:**
- `type:bug` (red)
- `type:security` (dark red)
- `type:refactor` (green)
- `type:test` (blue)
- `type:docs` (purple)
- `type:performance` (light blue)

**Phase:**
- `phase:1` through `phase:6`

### Issues (27)
- Phase 1: 4 issues
- Phase 2: 5 issues
- Phase 3: 4 issues
- Phase 4: 4 issues
- Phase 5: 8 issues
- Phase 6: 2 issues

## Getting a GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Booking Issues Creation"
4. Select scopes:
   - `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token (you won't see it again!)

## Troubleshooting

### "Workflow not showing in Actions"
- Make sure the workflow file is in `.github/workflows/`
- Make sure it's pushed to the repository
- Check that the file is named correctly: `create-booking-issues.yml`

### "Permission denied"
- Make sure `GITHUB_TOKEN` has the right permissions
- For GitHub Actions, the token is automatically provided
- For manual execution, use a personal access token with `repo` scope

### "Issues already exist"
- The script checks for existing issues by title
- It will skip issues that already exist
- This is safe to run multiple times

### "Milestone not found"
- Make sure milestones are created before issues
- The workflow runs scripts in order: milestones → labels → issues
- If running manually, run `create-milestones.js` first

### "Rate limit exceeded"
- GitHub has rate limits (5000 requests/hour for authenticated users)
- The script includes delays between requests
- If you hit the limit, wait an hour and try again
- Or run the scripts separately with delays

## File Structure

```
.github/
├── workflows/
│   ├── create-booking-issues.yml    # GitHub Actions workflow
│   └── README.md                     # Workflow documentation
└── scripts/
    ├── create-milestones.js          # Creates milestones
    ├── create-labels.js              # Creates labels
    ├── create-issues.js              # Creates issues
    ├── package.json                  # Dependencies
    └── README.md                     # Script documentation

scripts/
└── create-github-issues.sh          # Convenience script

GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md  # Source file with all issues
```

## Verification

After running, verify:

1. **Milestones:**
   - Go to Issues → Milestones
   - Should see 6 milestones

2. **Labels:**
   - Go to Issues → Labels
   - Should see 16 labels

3. **Issues:**
   - Go to Issues
   - Should see 27 issues
   - Each should have labels and be assigned to a milestone

## Next Steps

1. Review the created issues
2. Assign issues to team members
3. Start working on Phase 1 issues
4. Update issues as work progresses

## Support

If you encounter issues:
1. Check the workflow logs in GitHub Actions
2. Review the script README files
3. Check GitHub API rate limits
4. Verify your token has correct permissions

---

**Last Updated:** 2025-01-27
