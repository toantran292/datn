#!/bin/bash
# scripts/new_migration.sh

DESC=$1
if [ -z "$DESC" ]; then
  echo "Usage: ./new_migration.sh <description>"
  exit 1
fi

TS=$(date +"%Y%m%d%H%M%S")
FILENAME="src/main/resources/db/migration/V${TS}__${DESC}.sql"

touch $FILENAME
echo "-- Migration: $DESC" > $FILENAME
echo "Created $FILENAME"