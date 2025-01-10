#!/bin/bash

echo "Generating documentation Config..."

mkdir -p docs

# Generate tree structure with specific ignores
TREE_OUTPUT=$(tree -a -I 'node_modules|.git|.next|dist|.turbo|.cache|.vercel|coverage' \
     --dirsfirst \
     --charset=ascii)

{
  echo "# Project Tree Structure"
  echo "\`\`\`plaintext"
  echo "$TREE_OUTPUT"
  echo "\`\`\`"
} > docs/doc-tree.md

cw doc \
    --pattern "package.json|tsconfig.json|eslintrc.json|jest.config.js|babel.config.js|build.js" \
    --exclude "node_modules" "dist" "docs" "src" \
    --output docs/doc-config.md \
    --compress false


cw doc \
  --pattern "src/.*\.ts?$" \
    --exclude "node_modules" "dist" "docs" \
    --output docs/doc-code.md \
    --compress false


echo "Documentation generated successfully!"

