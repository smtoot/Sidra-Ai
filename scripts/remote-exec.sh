#!/bin/bash

# ==============================================================================
# REMOTE EXECUTION WRAPPER
# ==============================================================================
# This script allows the AI Agent to run commands on your staging server safely.
# It wraps the SSH command so the Agent doesn't need to handle your private keys.
#
# INSTRUCTIONS FOR USER:
# 1. Open this file in your editor.
# 2. Fill in the CONFIGURATION section below.
# 3. Save the file.
# 4. Run `chmod +x scripts/remote-exec.sh` to make it executable.
# ==============================================================================

# --- CONFIGURATION (AUTO-FILLED) ---

# Path to your private SSH key
SSH_KEY_PATH="/Users/omerheathrow/.ssh/id_ed25519" 

# Remote User (Usually 'root' for VPS)
REMOTE_USER="root"

# Remote Host IP (Port 10000 is likely Webmin, assuming SSH is on standard port 22)
REMOTE_HOST="148.135.136.4"

# Remote Project Directory
REMOTE_DIR="/home/sidra/Sidra-Ai"

# --- END CONFIGURATION ---


# Validation
if [[ -z "$SSH_KEY_PATH" || -z "$REMOTE_USER" || -z "$REMOTE_HOST" || -z "$REMOTE_DIR" ]]; then
    echo "Error: Configuration is missing in scripts/remote-exec.sh"
    echo "Please open the file and fill in SSH_KEY_PATH, REMOTE_USER, REMOTE_HOST, and REMOTE_DIR."
    exit 1
fi

# The command to run (passed as arguments to this script)
COMMAND="$@"

if [[ -z "$COMMAND" ]]; then
    echo "Usage: ./remote-exec.sh \"<command>\""
    exit 1
fi

# Execute via SSH
# -i: Identity file
# -o StrictHostKeyChecking=no: Avoid interactive prompt for new hosts
# -t: Force pseudo-terminal allocation (optional, useful for some interactive commands, but might mess up clean output reading)
# We omit -t by default to get clean stdout/stderr for the agent to read.

ssh -A -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && $COMMAND"
