
# Comment Publisher

## Overview
Comment Publisher is an automated tool designed for negative SEO campaigns. It distributes spammy, low-quality comments across a variety of web platforms targeting specific websites. The goal is to create an unnatural link profile for the target, potentially triggering search engine penalties and reducing their search rankings.

## Features
- **Automated Spam Comment Posting:** Uses Node.js to post spammy comments to a list of target URLs.
- **Parallel Processing:** Splits the workload into multiple processes for efficiency (via PM2 and chunked URL lists).
- **Customizable Spam Comments:** Supports a wide range of spam comments per target, defined in `targets.json`.
- **Archiving:** Keeps track of processed URLs and archives them for record-keeping.
- **Flexible Target Management:** Easily add, remove, or update targets and spam comments.

## Setup
1. **Install Dependencies:**
   - Ensure you have [Node.js](https://nodejs.org/) and [PM2](https://pm2.keymetrics.io/) installed.
   - Install project dependencies:
     ```sh
     npm install
     ```
2. **Prepare Target URLs:**
   - Add your target URLs to `urls.txt` (one per line).
   - Define detailed target info and comments in `targets.json`.
3. **Run the Bots:**
   - On Linux/macOS, use the provided script:
     ```sh
     ./start-comment-bots.sh 6
     ```
   - On Windows, run the equivalent steps manually or adapt the script for PowerShell.

## Usage
- The script splits `urls.txt` into chunks and starts multiple PM2 processes, each handling a chunk.
- Each process runs `comment-publisher.js` with its assigned chunk file.
- Processed URLs are archived in the `archive/` directory.

## File Structure
- `comment-publisher.js` – Main automation script
- `urls.txt` – List of target URLs
- `targets.json` – Target site details and comment templates
- `archive/` – Stores processed URL logs
- `logs.txt` – Log output
- `start-comment-bots.sh` – Bash script to split URLs and launch bots (Linux/macOS)

## Motivation
This project was created for negative SEO purposes: to penalize a website by publishing spammy comments and creating an unnatural link profile. Search engines may detect these manipulative patterns and lower the target site's rankings. Use responsibly and be aware of the ethical and legal implications.

---
