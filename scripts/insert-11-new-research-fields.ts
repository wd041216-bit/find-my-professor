import { getDb } from "../server/db";
import { researchFieldImages } from "../drizzle/schema";

const newResearchFields = [
  {
    name: "Health & Social Sciences",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/EivDdlGAOEphjYkW.png"
  },
  {
    name: "Law & Policy",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/dONnQAYxNuPAKUpb.png"
  },
  {
    name: "Business & Marketing",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/LznWidwDplESRVXt.png"
  },
  {
    name: "Environmental Studies",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/IrJzPOfxZTcWOVrE.png"
  },
  {
    name: "Social Sciences & Humanities",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/cEsbuFyTpcyEePxJ.png"
  },
  {
    name: "Architecture & Urban Studies",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/oWMHZipyMNbTSDbK.png"
  },
  {
    name: "Economics & Finance",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/BMarAEeUjJqTpZhG.png"
  },
  {
    name: "Political Science & International Relations",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/PerelRbsNgnqEANC.png"
  },
  {
    name: "Materials Science & Engineering",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/IslkZEGguTTGavjL.png"
  },
  {
    name: "Education Studies",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/bFbZnhJIAftAObCP.png"
  },
  {
    name: "Design Studies",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/wQCjWPPLUxnjIpqm.png"
  }
];

async function insertNewResearchFields() {
  console.log(`Inserting ${newResearchFields.length} new research fields...`);
  const db = await getDb();
  
  for (const field of newResearchFields) {
    await db.insert(researchFieldImages).values(field);
    console.log(`✓ Inserted: ${field.name}`);
  }
  
  console.log(`\n✅ Successfully inserted ${newResearchFields.length} new research fields!`);
  console.log(`Total research fields in database: ${18 + newResearchFields.length} (18 original + 11 new)`);
}

insertNewResearchFields()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error inserting research fields:", error);
    process.exit(1);
  });
