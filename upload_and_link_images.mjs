import mysql from 'mysql2/promise';
import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { execSync } from 'child_process';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Load image generation results
const results = JSON.parse(fs.readFileSync('/home/ubuntu/generate_university_field_images.json', 'utf8'));
const items = results.results;

console.log(`Processing ${items.length} image results...`);

let success = 0, failed = 0, skipped = 0;
const imageRecords = [];

for (const item of items) {
  const output = item.output;
  if (!output || !output.image_url || !output.success) {
    failed++;
    continue;
  }
  
  const { university_name, research_field, image_url } = output;
  
  if (!university_name || !research_field || !image_url) {
    failed++;
    continue;
  }
  
  imageRecords.push({ university_name, research_field, image_url });
}

console.log(`Valid image records: ${imageRecords.length}`);

// Upload each image to CDN using manus-upload-file --webdev
// and insert into university_field_images table
let uploadSuccess = 0, uploadFailed = 0;

// Process in batches - first download then upload
const tmpDir = '/tmp/prof_images';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

for (let i = 0; i < imageRecords.length; i++) {
  const { university_name, research_field, image_url } = imageRecords[i];
  
  try {
    // Check if already exists
    const [existing] = await conn.query(
      'SELECT id FROM university_field_images WHERE university_name = ? AND research_field = ? LIMIT 1',
      [university_name, research_field]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    
    // Download image to temp file
    const safeName = `${university_name.replace(/[^a-zA-Z0-9]/g, '_')}_${research_field.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const tmpFile = path.join(tmpDir, `${safeName}.webp`);
    
    // Download the image
    await new Promise((resolve, reject) => {
      const protocol = image_url.startsWith('https') ? https : http;
      const file = fs.createWriteStream(tmpFile);
      protocol.get(image_url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
          redirectProtocol.get(redirectUrl, (r2) => {
            r2.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
          }).on('error', reject);
        } else {
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }
      }).on('error', reject);
    });
    
    // Upload to CDN using manus-upload-file --webdev
    const uploadResult = execSync(`manus-upload-file --webdev "${tmpFile}"`, { encoding: 'utf8' });
    const cdnUrl = uploadResult.trim().split('\n').find(line => line.startsWith('https://'));
    
    if (!cdnUrl) {
      console.error(`No CDN URL for ${university_name} ${research_field}: ${uploadResult}`);
      uploadFailed++;
      continue;
    }
    
    // Insert into database
    await conn.query(
      'INSERT INTO university_field_images (university_name, research_field, image_url) VALUES (?, ?, ?)',
      [university_name, research_field, cdnUrl]
    );
    
    // Also update professors without image_url for this university+field
    await conn.query(
      'UPDATE professors SET image_url = ? WHERE university_name = ? AND research_field = ? AND (image_url IS NULL OR image_url = "")',
      [cdnUrl, university_name, research_field]
    );
    
    uploadSuccess++;
    if (uploadSuccess % 20 === 0) {
      process.stdout.write(`  Uploaded ${uploadSuccess}/${imageRecords.length}...\n`);
    }
    
    // Clean up temp file
    fs.unlinkSync(tmpFile);
    
  } catch (err) {
    uploadFailed++;
    if (uploadFailed <= 5) {
      console.error(`Failed ${university_name} ${research_field}: ${err.message.substring(0, 100)}`);
    }
  }
}

console.log(`\nImage upload results:`);
console.log(`  Success: ${uploadSuccess}`);
console.log(`  Failed: ${uploadFailed}`);
console.log(`  Skipped (existing): ${skipped}`);

// Final verification
const [imgCount] = await conn.query('SELECT COUNT(*) as cnt FROM university_field_images');
console.log(`\nTotal images in DB: ${imgCount[0].cnt}`);

const [profWithImg] = await conn.query('SELECT COUNT(*) as cnt FROM professors WHERE image_url IS NOT NULL AND image_url != ""');
const [profTotal] = await conn.query('SELECT COUNT(*) as cnt FROM professors');
console.log(`Professors with images: ${profWithImg[0].cnt} / ${profTotal[0].cnt}`);

await conn.end();
console.log('\nDone!');
