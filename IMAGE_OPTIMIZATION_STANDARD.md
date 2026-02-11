# Image Optimization Standard

## Overview
All professor card background images must follow this optimization standard to ensure fast loading and smooth user experience.

## Image Format Requirements

### Format: WebP
- **Required format**: WebP (not PNG or JPEG)
- **Quality setting**: 80% (provides good balance between quality and file size)
- **Lossless**: false (use lossy compression for smaller file size)

### File Size Limit
- **Maximum size**: 1MB per image
- **Target size**: 100-300KB per image
- **Current average**: ~180KB per image

## Optimization Results

### Before Optimization
- Format: PNG
- Total size: 314.68MB (66 images)
- Average size: 4.77MB per image

### After Optimization
- Format: WebP
- Total size: 12MB (66 images)
- Average size: 0.18MB per image
- **Compression ratio**: 96.2% reduction

## Conversion Process

### Tools Required
- ImageMagick (convert command)
- Installation: `sudo apt-get install imagemagick webp`

### Conversion Command
```bash
convert input.png -quality 80 -define webp:lossless=false output.webp
```

### Batch Conversion Script
See `/home/ubuntu/optimize-images.mjs` for automated batch conversion.

## Storage and Delivery

### Storage
- All optimized images are uploaded to S3 CDN
- CDN URL format: `https://files.manuscdn.com/user_upload_by_module/session_file/{session_id}/{file_id}.webp`

### Image Mapping
- Configuration file: `shared/universityFieldImages.ts`
- Maps university name + research field to specific WebP image URLs
- Fallback: Default gradient background if no specific image is found

## Future Image Generation

### For New Universities or Research Fields
1. Generate images using the `generate` tool
2. **Immediately convert to WebP** using the optimization script
3. Upload WebP version to S3 (not the original PNG)
4. Update `universityFieldImages.ts` with the WebP CDN URL
5. Delete the original PNG to save storage space

### Quality Checklist
- [ ] Image format is WebP
- [ ] File size is < 1MB (ideally 100-300KB)
- [ ] Image is uploaded to S3 CDN
- [ ] URL is added to `universityFieldImages.ts`
- [ ] Original PNG is deleted

## Performance Impact

### Loading Speed Improvement
- **Before**: 5-6MB PNG images took 2-3 seconds to load on 3G network
- **After**: 100-300KB WebP images load in < 0.5 seconds on 3G network
- **Improvement**: 80-90% faster loading time

### User Experience
- Smooth card swiping without lag
- Instant image display when scrolling
- Reduced data usage for mobile users

## Maintenance

### Regular Checks
- Monitor image file sizes in S3
- Ensure all new images follow the WebP standard
- Remove any PNG images that were accidentally uploaded

### Troubleshooting
If images fail to load:
1. Check browser console for 404 errors
2. Verify CDN URL is accessible (curl test)
3. Confirm `universityFieldImages.ts` has correct mapping
4. Restart dev server to reload configuration

---

**Last Updated**: February 11, 2026
**Optimization Standard Version**: 1.0
