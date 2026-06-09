#!/bin/bash
# Hermes Agent Restore Script
# Usage: bash restore-hermes.sh <github-token>
#
# After fresh Proot Ubuntu installation:
#   1. Install hermes-agent from website (optional - this script overwrites it anyway)
#   2. Copy this script to ~/restore-hermes.sh
#   3. Run: bash ~/restore-hermes.sh <your-github-token>
#
# What it restores:
#   - hermes-config/ → ~/.hermes (SOUL.md, MEMORY.md, USER.md, skills, cron, secrets, etc.)
#   - hermes-agent/  → ~/hermes-agent (source code)
#   - projects/      → ~/agents (saas, laravel-inventory, business-analysis, etc.)
#   - laravel-rishart/ → ~/laravel-rishart (FlavorDesk Laravel app)

set -e

if [ -z "$1" ]; then
    echo "❌ Usage: bash restore-hermes.sh <github-token>"
    echo ""
    echo "Example: bash restore-hermes.sh ghp_MhXXXXXXXXXXXXXXdkaq"
    exit 1
fi

GITHUB_TOKEN="$1"
REPO="https://github.com/mrishad-ux/hermes-restore.git"
BACKUP_DIR="/tmp/hermes-restore"

echo "📦 Cloning backup repository..."
rm -rf "$BACKUP_DIR"
git clone "https://mrishad-ux:${GITHUB_TOKEN}@github.com/mrishad-ux/hermes-restore.git" "$BACKUP_DIR"

cd "$BACKUP_DIR"

echo ""
echo "🔧 Restoring hermes-agent..."
if [ -d "hermes-agent" ]; then
    [ -d "$HOME/hermes-agent" ] && mv "$HOME/hermes-agent" "$HOME/hermes-agent.old"
    cp -rp hermes-agent $HOME/
    echo "✅ hermes-agent restored"
fi

echo ""
echo "🔧 Restoring hermes config..."
if [ -d "hermes-config" ]; then
    [ -d "$HOME/.hermes" ] && mv "$HOME/.hermes" "$HOME/.hermes.old"
    cp -rp hermes-config $HOME/.hermes
    echo "✅ hermes-config restored (SOUL.md, MEMORY.md, USER.md, skills, cron, secrets)"
fi

echo ""
echo "🔧 Restoring projects..."
if [ -d "projects" ]; then
    [ -d "$HOME/agents" ] && mv "$HOME/agents" "$HOME/agents.old"
    cp -rp projects $HOME/agents
    echo "✅ projects restored"
fi

echo ""
echo "🔧 Restoring Laravel app..."
if [ -d "laravel-rishart" ]; then
    [ -d "$HOME/laravel-rishart" ] && mv "$HOME/laravel-rishart" "$HOME/laravel-rishart.old"
    cp -rp laravel-rishart $HOME/
    echo "✅ laravel-rishart restored"
fi

echo ""
echo "✅ Restore complete!"
echo ""
echo "Your backup is at: $BACKUP_DIR (delete after confirming everything works)"
echo ""
echo "To start Hermes:"
echo "  cd ~/hermes-agent"
echo "  source .venv/bin/activate 2>/dev/null || source venv/bin/activate"
echo "  hermes start"
echo ""
echo "Or if you installed from website:"
echo "  hermes start"