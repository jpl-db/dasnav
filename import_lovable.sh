#!/bin/bash
# Helper script to import Lovable UI into dasnav frontend

echo "🎨 Lovable UI Import Script"
echo "=============================="
echo ""

# Check if Lovable repo path is provided
if [ -z "$1" ]; then
    echo "Usage: ./import_lovable.sh <path-to-lovable-repo>"
    echo ""
    echo "Example:"
    echo "  ./import_lovable.sh ~/code/lovable-dasnav-ui"
    echo ""
    echo "Or clone and import in one go:"
    echo "  ./import_lovable.sh https://github.com/YOUR-USERNAME/lovable-dasnav-ui.git"
    echo ""
    exit 1
fi

LOVABLE_PATH=$1

# If it's a git URL, clone it first
if [[ $LOVABLE_PATH == http* ]] || [[ $LOVABLE_PATH == git@* ]]; then
    echo "📥 Cloning from Git URL..."
    TEMP_DIR=$(mktemp -d)
    git clone "$LOVABLE_PATH" "$TEMP_DIR"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to clone repository"
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    LOVABLE_PATH=$TEMP_DIR
    CLEANUP_TEMP=true
fi

# Check if path exists
if [ ! -d "$LOVABLE_PATH" ]; then
    echo "❌ Directory not found: $LOVABLE_PATH"
    exit 1
fi

# Check if it looks like a React project
if [ ! -f "$LOVABLE_PATH/package.json" ]; then
    echo "⚠️  Warning: No package.json found in $LOVABLE_PATH"
    echo "   Are you sure this is your Lovable React project?"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        [ "$CLEANUP_TEMP" = true ] && rm -rf "$LOVABLE_PATH"
        exit 1
    fi
fi

echo ""
echo "📋 Import Plan:"
echo "   From: $LOVABLE_PATH"
echo "   To:   $(pwd)/frontend/"
echo ""
read -p "Proceed with import? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    [ "$CLEANUP_TEMP" = true ] && rm -rf "$LOVABLE_PATH"
    exit 0
fi

# Backup existing frontend if it has content
if [ "$(ls -A frontend 2>/dev/null | grep -v README.md | grep -v INTEGRATION)" ]; then
    BACKUP_DIR="frontend_backup_$(date +%Y%m%d_%H%M%S)"
    echo "💾 Backing up existing frontend to $BACKUP_DIR/"
    mkdir -p "$BACKUP_DIR"
    cp -r frontend/* "$BACKUP_DIR/" 2>/dev/null
fi

# Clear frontend except docs
echo "🧹 Clearing frontend directory (keeping docs)..."
find frontend -mindepth 1 -maxdepth 1 ! -name 'README.md' ! -name 'INTEGRATION_EXAMPLE.md' -exec rm -rf {} +

# Copy Lovable files
echo "📦 Copying Lovable UI files..."
cp -r "$LOVABLE_PATH"/* frontend/

# Clean up temp if we cloned
[ "$CLEANUP_TEMP" = true ] && rm -rf "$LOVABLE_PATH"

# Check if copy was successful
if [ -f "frontend/package.json" ]; then
    echo ""
    echo "✅ Import successful!"
    echo ""
    echo "📝 Next steps:"
    echo ""
    echo "1. Add API proxy to frontend/package.json:"
    echo '   "proxy": "http://localhost:8001"'
    echo ""
    echo "2. Create frontend/src/utils/api.js:"
    echo "   See frontend/INTEGRATION_EXAMPLE.md for code"
    echo ""
    echo "3. Update your components to use the API"
    echo ""
    echo "4. Test locally:"
    echo "   ./run_local.sh"
    echo ""
    echo "5. Commit when ready:"
    echo "   git add frontend/"
    echo "   git commit -m 'Integrate Lovable UI'"
    echo ""
else
    echo "❌ Import may have failed - no package.json found in frontend/"
    exit 1
fi
