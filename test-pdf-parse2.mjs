console.log('Testing correct pdf-parse import...');

try {
  const pdfParseModule = await import('pdf-parse');
  console.log('Module keys:', Object.keys(pdfParseModule));
  
  // The correct way: use PDFParse class
  const { PDFParse } = pdfParseModule;
  console.log('PDFParse type:', typeof PDFParse);
  console.log('PDFParse is class:', PDFParse.toString().startsWith('class'));
  
  // Create instance
  const parser = new PDFParse();
  console.log('Parser instance created:', typeof parser);
  console.log('Parser methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));
} catch (err) {
  console.error('Failed:', err.message);
  console.error(err.stack);
}
