import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

// 29个研究领域及其对应的S3 URL
const fieldImages = [
  { field: 'AI & Machine Learning', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/FXQxKqwdwQCmkpVb.png' },
  { field: 'Architecture & Urban Studies', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/GkBNNWfWDPrxPaQJ.png' },
  { field: 'Business & Marketing', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/KMKaKDUfXkQHFKoGabwC.png' },
  { field: 'Computational Biology & Health Informatics', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/lECPRPTlWkjOHqSt.png' },
  { field: 'Computer Graphics & Extended Reality', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/SdwRCJdJcPfIvMbI.png' },
  { field: 'Computing Education', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/NwpxUfodfMJJMkQq.png' },
  { field: 'Data Science & Analytics', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/HCwlYHSlOKMnXmNj.png' },
  { field: 'Design Studies', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/NyJiUNNprHbImooi.png' },
  { field: 'Economics & Finance', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/GVVMOrIxLWcnMPaI.png' },
  { field: 'Education Studies', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/poLgHpYnAghIxlrA.png' },
  { field: 'Education Technology', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/qqlxqFkGgYjJVTFL.png' },
  { field: 'Emerging Technologies & Cross-Cutting Areas', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/qUHENKFVQyjuyCtF.png' },
  { field: 'Environmental Studies', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/sqYlSlHbbTWJWUCt.png' },
  { field: 'Health & Social Sciences', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/NAYlOVVQnUjYimhu.png' },
  { field: 'Health Informatics', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/KrmkmBsDLSRjXSTf.png' },
  { field: 'Human-Computer Interaction', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/QksGQTCBNtEgPuwX.png' },
  { field: 'Information Retrieval & NLP', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/XkBLBkSvGsWZzTiM.png' },
  { field: 'Law & Policy', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/BmPGHOAbjHBRcKhm.png' },
  { field: 'Materials Science & Engineering', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/tnwyoflrZcXRkpJM.png' },
  { field: 'Political Science & International Relations', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/hXleMeqRDQcDoTLN.png' },
  { field: 'Privacy & Security', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/iBmtltWwqrzudLMq.png' },
  { field: 'Programming Languages', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/ejFldKoJzmBEAwMK.png' },
  { field: 'Robotics & Automation', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/CRatgbglrrdulQEA.png' },
  { field: 'Software Engineering', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/XdZTIOQsHwMgCtQu.png' },
  { field: 'Systems & Architecture', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/VQyElKRqmOdbsxdW.png' },
  { field: 'Theory & Algorithms', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/ZCAaVzhVfeuiLvVx.png' },
  { field: 'Ubiquitous Computing & IoT', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/HHZyraBGIrkhfqbn.png' },
  { field: 'Visualization & Graphics', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/FXQxKqwdwQCmkpVb.png' },
  { field: 'Web & Mobile Development', url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663312383643/GkBNNWfWDPrxPaQJ.png' }
];

console.log('开始更新university_field_images表...');



await connection.end();
