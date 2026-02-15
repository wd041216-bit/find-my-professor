import { db } from './server/db.ts';

async function checkProfile() {
  try {
    const profile = await db.getUserProfile(1);
    console.log('Profile data:', JSON.stringify(profile, null, 2));
    
    if (profile && profile.targetUniversities) {
      console.log('\nTarget Universities:', profile.targetUniversities);
      try {
        const parsed = JSON.parse(profile.targetUniversities);
        console.log('Parsed:', parsed);
        console.log('Is array:', Array.isArray(parsed));
        console.log('Length:', parsed.length);
      } catch (e) {
        console.error('Failed to parse:', e.message);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkProfile();
