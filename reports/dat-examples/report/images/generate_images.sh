#!/bin/bash

# Script to convert HTML wireframes to PNG images
# Requires: chrome/chromium browser or playwright

cd "$(dirname "$0")"

echo "Converting HTML wireframes to PNG images..."

# List of HTML files to convert
HTML_FILES=(
    "ui_projects"
    "ui_board"
    "ui_backlog"
    "ui_issue_detail"
    "ui_project_members"
    "ui_sprints"
    "ui_sprint_summary"
    "ui_complete_sprint"
    "ui_activity"
    "ui_custom_statuses"
    "ui_project_settings"
    "ui_org_dashboard"
)

# Check if Chrome/Chromium is available
if command -v google-chrome &> /dev/null; then
    CHROME_BIN="google-chrome"
elif command -v chromium &> /dev/null; then
    CHROME_BIN="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROME_BIN="chromium-browser"
elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
    CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
    echo "Error: Chrome/Chromium not found. Please install Chrome or Chromium."
    exit 1
fi

echo "Using browser: $CHROME_BIN"

# Convert each HTML file to PNG
for file in "${HTML_FILES[@]}"; do
    html_file="${file}.html"
    png_file="${file}.png"

    if [ -f "$html_file" ]; then
        echo "Converting $html_file to $png_file..."

        "$CHROME_BIN" --headless --disable-gpu --screenshot="$png_file" \
            --window-size=1400,900 --default-background-color=0 \
            --hide-scrollbars "file://$(pwd)/$html_file" 2>/dev/null

        if [ -f "$png_file" ]; then
            echo "✓ Created $png_file"
        else
            echo "✗ Failed to create $png_file"
        fi
    else
        echo "✗ File not found: $html_file"
    fi
done

echo ""
echo "Done! Generated $(ls -1 *.png 2>/dev/null | wc -l) PNG files."
