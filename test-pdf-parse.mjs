import fs from 'fs';

console.log('Testing pdf-parse import methods...');

// Method 1: Default import
try {
  const pdfParseModule = await import('pdf-parse');
  console.log('Method 1 - Default import:', typeof pdfParseModule.default);
  console.log('Method 1 - Direct:', typeof pdfParseModule);
  console.log('Method 1 - Keys:', Object.keys(pdfParseModule));
} catch (err) {
  console.error('Method 1 failed:', err.message);
}

// Method 2: Dynamic import with .default
try {
  const pdfParseModule = await import('pdf-parse');
  const pdfParse = pdfParseModule.default || pdfParseModule;
  console.log('Method 2 - pdfParse type:', typeof pdfParse);
  
  // Try to use it
  if (typeof pdfParse === 'function') {
    console.log('Method 2 - pdfParse is a function, ready to use');
  } else {
    console.log('Method 2 - pdfParse is NOT a function:', pdfParse);
  }
} catch (err) {
  console.error('Method 2 failed:', err.message);
}

console.log('Test completed');
