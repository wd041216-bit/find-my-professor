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

const imageRecords = [];
for (const item of items) {
  const output = item.output;
  if (!output || !output.image_url || !output.success) continue;
  const { university_name, research_field, image_url } = output;
  if (!university_name || !research_field || !image_url) continue;
  imageRecords.push({ university_name, research_field, image_url });
}

console.log(`Valid image records: ${imageRecords.length}`);

const tmpDir = '/tmp/prof_images2';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

let uploadSuccess = 0, uploadFailed = 0, skipped = 0;

for (let i = 0; i < imageRecords.length; i++) {
  const { university_name, research_field, image_url } = imageRecords[i];
  
  try {
    // Check if already exists (column is research_field_name)
    const [existing] = await conn.query(
      'SELECT id FROM university_field_images WHERE university_name = ? AND research_field_name = ? LIMIT 1',
      [university_name, research_field]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    
    // Download image to temp file
    const safeName = `${university_name.replace(/[^a-zA-Z0-9]/g, '_')}_${research_field.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const tmpFile = path.join(tmpDir, `${safeName}.webp`);
    
    await new Promise((resolve, reject) => {
      const downloadUrl = (url, cb) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            downloadUrl(response.headers.location, cb);
          } else {
            cb(response);
          }
        }).on('error', reject);
      };
      
      downloadUrl(image_url, (response) => {
        const file = fs.createWriteStream(tmpFile);
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
        file.on('error', reject);
      });
    });
    
    // Upload to CDN
    const uploadResult = execSync(`manus-upload-file --webdev "${tmpFile}"`, { encoding: 'utf8' });
    const cdnUrl = uploadResult.trim().split('\n').find(line => line.startsWith('https://'));
    
    if (!cdnUrl) {
      console.error(`No CDN URL for ${university_name} ${research_field}`);
      uploadFailed++;
      fs.unlinkSync(tmpFile);
      continue;
    }
    
    // Insert into university_field_images (correct column: research_field_name)
    await conn.query(
      'INSERT INTO university_field_images (university_name, research_field_name, image_url) VALUES (?, ?, ?)',
      [university_name, research_field, cdnUrl]
    );
    
    // Update professors without image for this university+field
    await conn.query(
      'UPDATE professors SET image_url = ? WHERE university_name = ? AND research_field = ? AND (image_url IS NULL OR image_url = "")',
      [cdnUrl, university_name, research_field]
    );
    
    uploadSuccess++;
    if (uploadSuccess % 20 === 0) {
      process.stdout.write(`  Uploaded ${uploadSuccess}/${imageRecords.length}...\n`);
    }
    
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

const [imgCount] = await conn.query('SELECT COUNT(*) as cnt FROM university_field_images');
console.log(`\nTotal images in DB: ${imgCount[0].cnt}`);

const [profWithImg] = await conn.query('SELECT COUNT(*) as cnt FROM professors WHERE image_url IS NOT NULL AND image_url != ""');
const [profTotal] = await conn.query('SELECT COUNT(*) as cnt FROM professors');
console.log(`Professors with images: ${profWithImg[0].cnt} / ${profTotal[0].cnt}`);

await conn.end();
console.log('\nDone!');
