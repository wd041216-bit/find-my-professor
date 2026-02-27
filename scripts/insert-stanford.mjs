import fs from 'fs';
import mysql from 'mysql2/promise';

const FIELD_IMAGE_MAPPING = {
  "Computer Science": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_computer_science-AzrCDSEe7nu64aDPXXVs2z.webp",
  "Engineering": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_engineering-8o2yP39NFkJhsivxfr8Nxt.webp",
  "Business & Management": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_business-bmaSSeeVMPpHMh8hFgYESH.webp",
  "Medicine & Health": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_medicine-ZtpTUGgGdQLWNfbW4NRBys.webp",
  "Literature & Languages": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_literature-LGA2cHFgzTmnLrAgcxRqQP.webp",
  "History": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_history-bZUV4tnF3dMJpvkW7MiYda.webp",
  "Arts & Design": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_arts-MtPZG8DRyxbTUBUEiq6LkF.webp",
  "Sociology & Anthropology": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_social_sciences-MzEGGuCu8NXEAXso7HDMWF.webp",
  "Political Science": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_social_sciences-MzEGGuCu8NXEAXso7HDMWF.webp",
  "Economics": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_social_sciences-MzEGGuCu8NXEAXso7HDMWF.webp",
  "Biology": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_natural_sciences-S7eQ6RrWkTgpqSeBdTfEQo.webp",
  "Physics": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_natural_sciences-S7eQ6RrWkTgpqSeBdTfEQo.webp",
  "Chemistry": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_natural_sciences-S7eQ6RrWkTgpqSeBdTfEQo.webp",
  "Mathematics": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_mathematics-T4igs6oUPL2HzfXdrtCVzh.webp",
  "Philosophy": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_philosophy-DYQ5tRSR8L9sWt5WyybPit.webp",
  "Education": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_education-JdJCLdAqQL5wuazUQVtrMt.webp",
  "Law": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_law-ZKEW6UWWDuS9XbQ35wFbrM.webp",
  "Environmental Science": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_environmental-WMzpgY5GnsfaEMQ4zcmn5F.webp",
  "Architecture & Planning": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_engineering-8o2yP39NFkJhsivxfr8Nxt.webp",
  "Other": "https://d2xsxph8kpxj0f.cloudfront.net/310519663312383643/hB2F5YxeXakQRcL5WU36Vw/stanford_other-PUH98AF2gKZG2ntdNNfzWY.webp"
};

async function main() {
  try {
    const data = JSON.parse(fs.readFileSync('/home/ubuntu/stanford_professors_normalized.json', 'utf-8'));
    console.log(`Loaded ${data.length} professors`);

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    const [rows] = await connection.execute("SELECT COUNT(*) as count FROM professors WHERE university_name = 'Stanford University'");
    console.log(`Existing Stanford professors: ${rows[0].count}`);

    if (rows[0].count > 0) {
      console.log("Stanford professors already exist, skipping...");
      await connection.end();
      process.exit(0);
    }

    let success = 0;
    for (const prof of data) {
      const imageUrl = FIELD_IMAGE_MAPPING[prof.research_field] || FIELD_IMAGE_MAPPING["Other"];
      await connection.execute(
        `INSERT INTO professors (university_name, name, title, department, research_field, tags, image_url, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [prof.university_name, prof.name, prof.title, prof.department, prof.research_field, prof.tags, imageUrl]
      );
      success++;
      if (success % 10 === 0) {
        console.log(`Inserted ${success}/${data.length} professors...`);
      }
    }

    console.log(`✅ Successfully inserted ${success} professors`);
    
    // Verify
    const [verify] = await connection.execute("SELECT COUNT(*) as count FROM professors WHERE university_name = 'Stanford University'");
    console.log(`Total Stanford professors in database: ${verify[0].count}`);
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
