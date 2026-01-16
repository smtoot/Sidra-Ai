# GitHub Actions Workflows

## Create Booking System Improvement Issues

This workflow automatically creates GitHub issues, milestones, and labels from the `GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md` file.

### How to Use

#### Option 1: Manual Trigger (Recommended)

1. Go to the "Actions" tab in your GitHub repository
2. Select "Create Booking System Improvement Issues"
3. Click "Run workflow"
4. Select the branch (defaults to `develop`)
5. Click "Run workflow"

#### Option 2: Automatic Trigger

The workflow will automatically run when:
- The `GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md` file is pushed to the `develop` branch

### What It Does

1. **Creates Milestones** (6 milestones for each phase)
2. **Creates Labels** (priority, type, and phase labels)
3. **Creates Issues** (27 issues from the issues file)

### Requirements

- The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions
- No additional secrets or configuration needed
- The `GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md` file must exist in the repository root

### Scripts

The workflow uses three Node.js scripts:

1. **create-milestones.js** - Creates all milestones
2. **create-labels.js** - Creates all labels (updates if they exist)
3. **create-issues.js** - Parses the issues file and creates all issues

### Idempotency

- **Milestones**: Checks if they exist before creating (won't create duplicates)
- **Labels**: Updates existing labels or creates new ones
- **Issues**: Checks by title before creating (won't create duplicates)

### Manual Execution

You can also run the scripts manually:

```bash
# Install dependencies
cd .github/scripts
npm install

# Set GitHub token
export GITHUB_TOKEN=your_token_here
export GITHUB_REPOSITORY=owner/repo

# Run scripts
npm run create-milestones
npm run create-labels
npm run create-issues
```

### Troubleshooting

**Issue: "Milestone not found"**
- Make sure milestones are created before issues
- The workflow runs scripts in order: milestones → labels → issues

**Issue: "Label already exists"**
- This is fine - the script will update existing labels

**Issue: "Issue already exists"**
- The script skips issues that already exist (by title)
- This prevents duplicates

**Issue: "Rate limit exceeded"**
- The script includes a 1-second delay between issue creations
- If you have many issues, you may need to run the workflow multiple times
- GitHub allows 5000 requests per hour for authenticated requests

### Notes

- Issues are created with all labels and assigned to milestones
- The workflow is idempotent - safe to run multiple times
- Issues are skipped if they already exist (matched by title)
