import puppeteer from "puppeteer";
import fs from "fs/promises";
import {
  appendFileSync,
  renameSync,
  existsSync,
  mkdirSync,
} from "fs";
import path from "path";
import process from "process";

const chunkFile = process.argv[2];
if (!chunkFile) {
  console.error("❌ Usage: node comment-publisher.js <chunk-file>");
  process.exit(1);
}

const archiveDir = "archive";

// Logging helper
function writeLog(line) {
  appendFileSync("logs.txt", `[${new Date().toISOString()}] ${line}\n`);
}

// Helper to clear form fields
async function clearInput(page, selector) {
  try {
    const el = await page.$(selector);
    if (el) await page.evaluate((sel) => {
      document.querySelector(sel).value = "";
    }, selector);
  } catch {}
}

// Utility functions
const randomSlug = () => Math.random().toString(36).substring(2, 12);
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Read only the current chunk file
async function loadChunkLines() {
  if (!existsSync(chunkFile)) {
    console.error(`❌ Chunk file not found: ${chunkFile}`);
    process.exit(1);
  }

  const content = await fs.readFile(chunkFile, "utf8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// Save updated chunk file: prefix "Done " to success, remove failed
async function saveUpdatedChunkFile(allLines, completedUrls, failedUrls) {
  const updated = allLines
    .map((url) => {
      if (completedUrls.includes(url)) return `Done ${url}`;
      return url;
    })
    .filter((line) => {
      const clean = line.replace(/^Done\s+/, "").trim();
      return !failedUrls.includes(clean);
    });

  await fs.writeFile(chunkFile, updated.join("\n"), "utf8");
}

(async () => {
  const targets = JSON.parse(await fs.readFile("targets.json", "utf8"));
  let allUrls = await loadChunkLines();

  const completed = [];
  const failed = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const postUrlRaw of allUrls) {
    const postUrl = postUrlRaw.replace(/^Done\s+/, "").trim();
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    try {
      console.log(`Visiting: ${postUrl}`);
      await page.goto(postUrl, { waitUntil: "domcontentloaded", timeout: 60000 });

      const hasCommentBox = await page.$("#comment");
      const hasAuthor = await page.$("#author");
      const hasEmail = await page.$("#email");
      const submitBtn = (await page.$("#submit")) || (await page.$("#comment-submit"));

      if (!hasCommentBox || !hasAuthor || !hasEmail || !submitBtn) {
        console.log(`⚠️ No comment form found: ${postUrl}`);
        writeLog(`⚠️ No form at ${postUrl}`);
        failed.push(postUrl);
        await page.close();
        continue;
      }

      // First comment
      const firstTarget = targets[0];
      const firstComment = `${randomItem(firstTarget.comments)}<br/><br/>Visit us: <a href="${firstTarget.url}/${randomSlug()}">${firstTarget.author}</a>`;

      await clearInput(page, "#comment");
      await clearInput(page, "#author");
      await clearInput(page, "#email");
      await clearInput(page, "#url");

      await page.type("#comment", firstComment);
      await page.type("#author", firstTarget.author);
      await page.type("#email", firstTarget.email);
      if (await page.$("#url")) await page.type("#url", firstTarget.url);

      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }),
        submitBtn.click(),
      ]);

      writeLog(`✅ First comment posted for ${firstTarget.url} on ${postUrl}`);

      // Loop for remaining targets
      for (let i = 1; i < targets.length; i++) {
        const target = targets[i];
        await page.goto(postUrl, { waitUntil: "domcontentloaded" });

        await clearInput(page, "#comment");
        await clearInput(page, "#author");
        await clearInput(page, "#email");
        await clearInput(page, "#url");

        const commentText = `${randomItem(target.comments)}<br/><br/>Visit us: <a href="${target.url}/${randomSlug()}">${target.author}</a>`;
        await page.type("#comment", commentText);
        await page.type("#author", target.author);
        await page.type("#email", target.email);
        if (await page.$("#url")) await page.type("#url", target.url);

        const submitButton = (await page.$("#submit")) || (await page.$("#comment-submit"));

        if (!submitButton) {
          writeLog(`⚠️ Submit button missing for second comment on ${postUrl}`);
          throw new Error("Second comment failed");
        }

        await Promise.all([
          page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }),
          submitButton.click(),
        ]);

        writeLog(`✅ Comment posted for ${target.url} on ${postUrl}`);
      }

      completed.push(postUrl);
      await page.close();
    } catch (err) {
      console.error(`❗ Error on ${postUrl}: ${err.message}`);
      writeLog(`❗ Error on ${postUrl}: ${err.message}`);
      failed.push(postUrl);
      await page.close();
    }

    // Update chunk file after each URL
    allUrls = await loadChunkLines(); // reload to preserve line order
    await saveUpdatedChunkFile(allUrls, completed, failed);
  }

  await browser.close();

  // Move finished chunk to archive
  if (!existsSync(archiveDir)) mkdirSync(archiveDir);
  const archivePath = path.join(archiveDir, path.basename(chunkFile));
  renameSync(chunkFile, archivePath);

  console.log(`🎯 Chunk complete. Done: ${completed.length}, Failed: ${failed.length}`);
  writeLog(`✅ Finished PID ${process.pid} — Success: ${completed.length}, Failed: ${failed.length}`);
})();
