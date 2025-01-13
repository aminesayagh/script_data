#!/bin/bash

# navigate all csv files in data folder, and show the first 10 lines of each file
for file in data/*.csv; do
    echo "First 2 lines of $file:"
    head -n 2 "$file"
    echo "--------------------------------"
done

pnpm install && pnpm main data/posts_202501092335.csv caption