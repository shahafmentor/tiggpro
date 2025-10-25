#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if migration name was provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Migration name is required${NC}"
  echo "Usage: npm run migration:create:safe -- MigrationName"
  exit 1
fi

MIGRATION_NAME=$1

# Get the latest migration timestamp
LATEST_MIGRATION=$(ls -1 src/migrations/*.ts 2>/dev/null | sort -r | head -1 | grep -oE '[0-9]{13}' || echo "0")

# Get current timestamp in milliseconds
# Handle both Linux (date +%s%3N) and macOS (use python/node as fallback)
if date +%s%3N 2>/dev/null | grep -q N; then
  # macOS - use node.js to get milliseconds
  CURRENT_TIMESTAMP=$(node -e 'console.log(Date.now())')
else
  # Linux - native support for milliseconds
  CURRENT_TIMESTAMP=$(date +%s%3N)
fi

# Ensure new timestamp is greater than the latest migration
if [ "$CURRENT_TIMESTAMP" -le "$LATEST_MIGRATION" ]; then
  # Add 1 second to latest migration timestamp
  NEW_TIMESTAMP=$((LATEST_MIGRATION + 1000))
  echo -e "${YELLOW}Warning: Current timestamp ($CURRENT_TIMESTAMP) is not greater than latest migration ($LATEST_MIGRATION)${NC}"
  echo -e "${YELLOW}Using adjusted timestamp: $NEW_TIMESTAMP${NC}"
else
  NEW_TIMESTAMP=$CURRENT_TIMESTAMP
  echo -e "${GREEN}Using current timestamp: $NEW_TIMESTAMP${NC}"
fi

# Create the migration using TypeORM CLI with the new timestamp
MIGRATION_FILE="src/migrations/${NEW_TIMESTAMP}-${MIGRATION_NAME}.ts"

# Create migration file
cat > "$MIGRATION_FILE" << EOF
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${MIGRATION_NAME}${NEW_TIMESTAMP} implements MigrationInterface {
  name = '${MIGRATION_NAME}${NEW_TIMESTAMP}';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add your migration queries here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add your rollback queries here
  }
}
EOF

echo -e "${GREEN}✓ Migration created successfully:${NC}"
echo -e "  ${MIGRATION_FILE}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit the migration file and add your SQL queries"
echo "  2. Run 'npm run migration:run' to apply the migration"
echo ""
echo -e "${YELLOW}Migration order:${NC}"
ls -1 src/migrations/*.ts | sort | tail -5 | while read -r file; do
  filename=$(basename "$file")
  if [[ "$filename" == "${NEW_TIMESTAMP}"* ]]; then
    echo -e "  ${GREEN}→ $filename (NEW)${NC}"
  else
    echo "    $filename"
  fi
done
