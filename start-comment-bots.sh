#!/bin/bash

# Usage: ./start-comment-bots.sh 6
# Splits urls.txt into 6 chunks and runs 6 PM2 processes

NUM_PROCESSES=$1
URL_FILE="urls.txt"
ARCHIVE_DIR="archive"
CHUNK_TIMESTAMP=$(date +%s)
CHUNK_RANDOM=$(( RANDOM % 100000 ))
CHUNK_PREFIX="active-urls-${CHUNK_TIMESTAMP}-${CHUNK_RANDOM}"

if [ -z "$NUM_PROCESSES" ]; then
  echo "❌ Please provide number of processes. Example: ./start-comment-bots.sh 6"
  exit 1
fi

mkdir -p "$ARCHIVE_DIR"

# Filter only active URLs (non-Done)
grep -v '^Done ' "$URL_FILE" > temp_active_urls.txt

TOTAL_LINES=$(wc -l < temp_active_urls.txt)
LINES_PER_CHUNK=$(( (TOTAL_LINES + NUM_PROCESSES - 1) / NUM_PROCESSES ))

echo "📦 Splitting $TOTAL_LINES URLs into $NUM_PROCESSES chunks (~$LINES_PER_CHUNK lines each)"



# Split into equal chunks named active-urls-<timestamp>-00.txt, active-urls-<timestamp>-01.txt, ...
split -l $LINES_PER_CHUNK -d --additional-suffix=.txt temp_active_urls.txt ${CHUNK_PREFIX}-

# Start PM2 processes for each chunk

for (( i=0; i<NUM_PROCESSES; i++ ))
do
  PADDED_I=$(printf "%02d" $i)
  CHUNK_FILE="${CHUNK_PREFIX}-${PADDED_I}.txt"

  if [ ! -f "$CHUNK_FILE" ]; then
    echo "⚠️ Chunk file not found: $CHUNK_FILE"
    continue
  fi

  echo "🧩 Starting bot for chunk file: $CHUNK_FILE"

  pm2 start xvfb-run --name "bot-${CHUNK_TIMESTAMP}-${CHUNK_RANDOM}-$PADDED_I" --interpreter bash -- \
    --auto-servernum node comment-publisher.js "$CHUNK_FILE"

  sleep 1
done

rm temp_active_urls.txt
