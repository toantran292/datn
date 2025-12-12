#!/bin/bash

# Quick build script for LaTeX report

cd "$(dirname "$0")"

case "$1" in
  quick)
    echo "==> Quick build (1 pass)..."
    pdflatex -interaction=nonstopmode main.tex > /dev/null 2>&1
    ;;
  full)
    echo "==> Full build (2 passes)..."
    pdflatex -interaction=nonstopmode main.tex > /dev/null 2>&1
    pdflatex -interaction=nonstopmode main.tex > /dev/null 2>&1
    ;;
  draft)
    echo "==> Draft mode (no images)..."
    pdflatex -interaction=nonstopmode -draftmode main.tex > /dev/null 2>&1
    ;;
  clean)
    echo "==> Cleaning aux files..."
    rm -f *.aux *.log *.out *.toc *.lof *.lot *.bbl *.blg *.synctex.gz
    echo "Cleaned!"
    exit 0
    ;;
  *)
    echo "Usage: ./build.sh [quick|full|draft|clean]"
    echo "  quick - Fast single pass (default)"
    echo "  full  - Complete build with 2 passes"
    echo "  draft - Draft mode, skip images"
    echo "  clean - Remove auxiliary files"
    exit 1
    ;;
esac

if [ $? -eq 0 ]; then
  SIZE=$(ls -lh main.pdf | awk '{print $5}')
  PAGES=$(pdfinfo main.pdf 2>/dev/null | grep Pages | awk '{print $2}')
  echo "✓ Build complete: main.pdf ($PAGES pages, $SIZE)"
else
  echo "✗ Build failed!"
  exit 1
fi
