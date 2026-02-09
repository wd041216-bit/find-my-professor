import 'dotenv/config';

async function findFacultyPageUrl(university: string, department: string) {
  const prompt = `What is the URL of the faculty directory page for ${university} ${department}?

Return ONLY the URL, no explanation.`;

  console.log('[Test] Searching for faculty page URL...');
  console.log(`University: ${university}`);
  console.log(`Department: ${department}`);

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });

  const data = await response.json();
  
  console.log('\n[Result]');
  console.log('URL:', data.choices[0].message.content.trim());
  console.log('\n[Usage]');
  console.log('Tokens:', data.usage.total_tokens);
  console.log('Cost:', `$${(data.usage.total_tokens * 0.000005).toFixed(5)}`);
  
  return data.choices[0].message.content.trim();
}

// 测试
findFacultyPageUrl('University of Washington', 'Information School')
  .then(url => {
    console.log('\n✅ Success! Faculty page URL:', url);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
