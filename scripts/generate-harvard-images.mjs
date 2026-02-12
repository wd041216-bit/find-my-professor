import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Harvard brand elements
const HARVARD_COLOR = 'crimson red';
const HARVARD_SYMBOL = 'Harvard shield emblem';

// Research fields to generate images for (excluding "Other")
const RESEARCH_FIELDS = [
  'Architecture & Planning',
  'Arts & Design',
  'Biology',
  'Chemistry',
  'Computer Science',
  'Economics',
  'Engineering',
  'Environmental Science',
  'History',
  'Literature & Languages',
  'Medicine & Health',
  'Music & Theater',
  'Physics',
  'Political Science',
  'Sociology & Anthropology'
];

// Generate image prompt for each research field
function generatePrompt(field) {
  const basePrompt = `Create a professional academic research image representing "${field}" with Harvard University branding. `;
  
  const fieldPrompts = {
    'Architecture & Planning': `Modern architectural blueprints and city planning diagrams with ${HARVARD_COLOR} accents, featuring geometric building structures and urban design elements`,
    'Arts & Design': `Creative artistic composition with paintbrushes, canvas, and design tools in ${HARVARD_COLOR} tones, featuring abstract art elements`,
    'Biology': `Microscopic cell structures, DNA helixes, and biological organisms in ${HARVARD_COLOR} scientific illustration style`,
    'Chemistry': `Molecular structures, chemical formulas, and laboratory equipment in ${HARVARD_COLOR} scientific visualization`,
    'Computer Science': `Digital circuit boards, binary code, and AI neural networks with ${HARVARD_COLOR} tech aesthetic`,
    'Economics': `Financial charts, economic graphs, and currency symbols in ${HARVARD_COLOR} professional business style`,
    'Engineering': `Mechanical gears, engineering blueprints, and technical diagrams with ${HARVARD_COLOR} industrial design`,
    'Environmental Science': `Natural landscapes, renewable energy symbols, and ecological elements in ${HARVARD_COLOR} environmental theme`,
    'History': `Ancient scrolls, historical documents, and timeline illustrations with ${HARVARD_COLOR} classical aesthetic`,
    'Literature & Languages': `Open books, quill pens, and literary manuscripts in ${HARVARD_COLOR} scholarly style`,
    'Medicine & Health': `Medical symbols, stethoscope, and health care icons in ${HARVARD_COLOR} clinical design`,
    'Music & Theater': `Musical notes, theater masks, and performance stage elements in ${HARVARD_COLOR} artistic composition`,
    'Physics': `Atomic structures, quantum particles, and physics equations with ${HARVARD_COLOR} scientific visualization`,
    'Political Science': `Government buildings, political symbols, and global maps in ${HARVARD_COLOR} institutional style`,
    'Sociology & Anthropology': `Human silhouettes, cultural symbols, and social network diagrams in ${HARVARD_COLOR} humanistic design`
  };
  
  return basePrompt + fieldPrompts[field] + `. Professional, academic, minimalist design. High quality, vibrant colors.`;
}

async function generateImage(field, index, total) {
  console.log(`\n[${index + 1}/${total}] Generating image for: ${field}`);
  
  const prompt = generatePrompt(field);
  const filename = field.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const outputPath = `/home/ubuntu/harvard-images/${filename}.png`;
  
  // Create output directory
  await execAsync('mkdir -p /home/ubuntu/harvard-images');
  
  // Generate image using Manus built-in image generation
  console.log(`[Prompt] ${prompt.substring(0, 100)}...`);
  
  try {
    // Call image generation API using correct endpoint
    const baseUrl = process.env.BUILT_IN_FORGE_API_URL.endsWith('/')
      ? process.env.BUILT_IN_FORGE_API_URL
      : `${process.env.BUILT_IN_FORGE_API_URL}/`;
    const fullUrl = new URL('images.v1.ImageService/GenerateImage', baseUrl).toString();
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'connect-protocol-version': '1',
        'authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`
      },
      body: JSON.stringify({
        prompt: prompt,
        original_images: []
      })
    });
    
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`API error: ${response.status} ${response.statusText}${detail ? `: ${detail}` : ''}`);
    }
    
    const data = await response.json();
    const base64Data = data.image.b64Json;
    const imageBuffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, imageBuffer);
    
    console.log(`[Success] Image saved to: ${outputPath}`);
    
    // Convert to WebP and compress
    const webpPath = outputPath.replace('.png', '.webp');
    await execAsync(`ffmpeg -i "${outputPath}" -c:v libwebp -quality 85 -compression_level 6 "${webpPath}" -y`);
    
    // Check file size
    const stats = fs.statSync(webpPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[WebP] Converted and compressed: ${sizeInMB}MB`);
    
    // If still > 1MB, compress more aggressively
    if (stats.size > 1024 * 1024) {
      console.log(`[Compress] File too large, re-compressing...`);
      await execAsync(`ffmpeg -i "${outputPath}" -c:v libwebp -quality 70 -compression_level 6 "${webpPath}" -y`);
      const newStats = fs.statSync(webpPath);
      const newSizeInMB = (newStats.size / (1024 * 1024)).toFixed(2);
      console.log(`[WebP] Re-compressed: ${newSizeInMB}MB`);
    }
    
    // Upload to S3
    console.log(`[Upload] Uploading to S3...`);
    const { stdout } = await execAsync(`manus-upload-file "${webpPath}"`);
    const cdnUrl = stdout.trim();
    console.log(`[CDN] ${cdnUrl}`);
    
    return {
      field,
      localPath: webpPath,
      cdnUrl,
      size: fs.statSync(webpPath).size
    };
  } catch (error) {
    console.error(`[Error] Failed to generate image for ${field}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('[Start] Generating Harvard University branded research field images...');
  console.log(`[Total] ${RESEARCH_FIELDS.length} images to generate`);
  
  const results = [];
  
  for (let i = 0; i < RESEARCH_FIELDS.length; i++) {
    const field = RESEARCH_FIELDS[i];
    const result = await generateImage(field, i, RESEARCH_FIELDS.length);
    if (result) {
      results.push(result);
    }
    
    // Add delay to avoid rate limiting
    if (i < RESEARCH_FIELDS.length - 1) {
      console.log('[Wait] Waiting 3 seconds before next generation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Save mapping to file
  const mapping = {};
  for (const result of results) {
    mapping[result.field] = {
      university: 'Harvard University',
      cdnUrl: result.cdnUrl,
      size: result.size
    };
  }
  
  fs.writeFileSync(
    '/home/ubuntu/harvard-image-mapping.json',
    JSON.stringify(mapping, null, 2)
  );
  
  console.log('\n[Summary] Image generation complete!');
  console.log(`Total generated: ${results.length}/${RESEARCH_FIELDS.length}`);
  console.log(`Mapping saved to: /home/ubuntu/harvard-image-mapping.json`);
  
  // Calculate total size
  const totalSize = results.reduce((sum, r) => sum + r.size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`Total size: ${totalSizeMB}MB`);
  console.log(`Average size: ${(totalSize / results.length / (1024 * 1024)).toFixed(2)}MB`);
}

main().catch(console.error);
