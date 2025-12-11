#!/bin/bash
# Script to download all images for Part 02

cd /Users/toan/Workspaces/toantran292/datn/reports/examples/report/images

echo "Downloading images for Part 02..."

# Jira Software (already downloaded)
if [ ! -f "jira-board.png" ]; then
  echo "Downloading Jira..."
  curl -L -o jira-board.png "https://wac-cdn.atlassian.com/dam/jcr:3511a84d-0372-43fd-a2af-2005a6eabb3f/Screen-scrum%20board.png?cdnVersion=3124"
fi

# Notion
if [ ! -f "notion-workspace.png" ]; then
  echo "Downloading Notion..."
  curl -L -o notion-workspace.png "https://www.notion.so/cdn-cgi/image/format=webp,width=2048/front-static/pages/product/super-duper/carousel/write-with-ai.png"
fi

# Slack
if [ ! -f "slack-channels.png" ]; then
  echo "Downloading Slack..."
  curl -L -o slack-channels.png "https://a.slack-edge.com/6c404/marketing/img/homepage/bold-existing-users/channels-ui.png"
fi

# Microsoft Teams
if [ ! -f "teams-meeting.png" ]; then
  echo "Downloading Teams..."
  curl -L -o teams-meeting.png "https://cdn-dynmedia-1.microsoft.com/is/image/microsoftcorp/Hero_Teams_1920x720_2x_RE4PjCt?resMode=sharp2&op_usm=1.5,0.65,15,0&wid=1920&hei=720&qlt=75"
fi

# Base.vn - need to find image manually
if [ ! -f "base-dashboard.png" ]; then
  echo "Base.vn image needs manual download from https://base.vn/"
fi

# FastWork - need to find image manually
if [ ! -f "fastwork-project.png" ]; then
  echo "FastWork image needs manual download from https://fastwork.vn/phan-mem-quan-ly-du-an-2/"
fi

# MISA AMIS - need to find image manually
if [ ! -f "amis-workflow.png" ]; then
  echo "MISA AMIS image needs manual download from https://amis.misa.vn/amis-cong-viec/"
fi

echo "Done! Check which images are missing and download manually."
ls -lh *.png 2>/dev/null | grep -E "(jira|notion|slack|teams|base|fastwork|amis)"
