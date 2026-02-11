/**
 * 标准学科分类映射表
 * 将各大学的专业名称映射到统一的研究领域
 */

// 标准研究领域列表（20个主要领域）
export const STANDARD_RESEARCH_FIELDS = [
  'Computer Science',
  'Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Medicine & Health',
  'Economics',
  'Business & Management',
  'Political Science',
  'Psychology',
  'Sociology & Anthropology',
  'History',
  'Literature & Languages',
  'Philosophy',
  'Arts & Design',
  'Music & Theater',
  'Architecture & Planning',
  'Environmental Science',
  'Education',
] as const;

export type StandardResearchField = typeof STANDARD_RESEARCH_FIELDS[number];

// 专业名称到标准领域的映射规则
export const FIELD_MAPPING: Record<string, StandardResearchField> = {
  // Computer Science & Technology
  'Computer Science': 'Computer Science',
  'Computer Science and Engineering': 'Computer Science',
  'Computer Science and Molecular Biology': 'Computer Science',
  'Data Science': 'Computer Science',
  'Artificial Intelligence and Decision Making': 'Computer Science',
  'Computation and Cognition': 'Computer Science',
  'Mathematics with Computer Science': 'Computer Science',
  'Urban Science and Planning with Computer Science': 'Computer Science',
  'AI & Machine Learning': 'Computer Science',
  'Data Science & Analytics': 'Computer Science',
  'Software Engineering': 'Computer Science',
  'Cybersecurity': 'Computer Science',
  'Human-Computer Interaction': 'Computer Science',
  'Computer Graphics': 'Computer Science',
  'Computer Networking': 'Computer Science',
  'Computing Education': 'Computer Science',

  // Engineering
  'Engineering': 'Engineering',
  'Electrical Engineering and Computing': 'Engineering',
  'Mechanical Engineering': 'Engineering',
  'Mechanical and Ocean Engineering': 'Engineering',
  'Aerospace Engineering': 'Engineering',
  'Civil and Environmental Engineering': 'Engineering',
  'Civil Engineering': 'Engineering',
  'Chemical Engineering': 'Engineering',
  'Chemical-Biological Engineering': 'Engineering',
  'Biological Engineering': 'Engineering',
  'Biomedical Engineering': 'Engineering',
  'Materials Science and Engineering': 'Engineering',
  'Nuclear Science and Engineering': 'Engineering',
  'Flexible Nuclear Science and Engineering Degree': 'Engineering',
  'Environmental Engineering Science': 'Engineering',
  'Civil and Environmental Systems': 'Engineering',
  'Robotics': 'Engineering',
  'Nanotechnology': 'Engineering',

  // Mathematics
  'Mathematics': 'Mathematics',
  'Mathematical Economics': 'Mathematics',
  'Statistics and Data Science': 'Mathematics',
  'Applied Mathematics': 'Mathematics',

  // Physics
  'Physics': 'Physics',
  'Astronomy': 'Physics',
  'Astrophysics': 'Physics',

  // Chemistry
  'Chemistry': 'Chemistry',
  'Chemistry and Biology': 'Chemistry',
  'Atmospheric Chemistry': 'Chemistry',

  // Biology & Life Sciences
  'Biology': 'Biology',
  'Biochemistry': 'Biology',
  'Molecular Biology': 'Biology',
  'Genetics': 'Biology',
  'Neuroscience': 'Biology',
  'Ecology': 'Biology',

  // Medicine & Health
  'Medicine & Health': 'Medicine & Health',
  'Brain and Cognitive Sciences': 'Medicine & Health',
  'Toxicology and Environmental Health': 'Medicine & Health',
  'Public Health': 'Medicine & Health',

  // Economics
  'Economics': 'Economics',
  'Finance': 'Economics',
  'Econometrics': 'Economics',

  // Business & Management
  'Business Analytics': 'Business & Management',
  'Management': 'Business & Management',
  'Entrepreneurship & Innovation': 'Business & Management',
  'Marketing': 'Business & Management',

  // Political Science
  'Political Science': 'Political Science',
  'International Relations': 'Political Science',
  'Public Policy': 'Political Science',
  'Applied Inter­national Studies': 'Political Science',

  // Psychology
  'Psychology': 'Psychology',
  'Cognitive Science': 'Psychology',

  // Sociology & Anthropology
  'Anthropology': 'Sociology & Anthropology',
  'Sociology': 'Sociology & Anthropology',
  'Social Sciences': 'Sociology & Anthropology',
  'Women\'s and Gender Studies': 'Sociology & Anthropology',
  'African and African Diaspora Studies': 'Sociology & Anthropology',
  'Asian and Asian Diaspora Studies': 'Sociology & Anthropology',
  'Latin American and Latino/a Studies': 'Sociology & Anthropology',
  'Middle Eastern Studies': 'Sociology & Anthropology',
  'Russian and Eurasian Studies': 'Sociology & Anthropology',

  // History
  'History': 'History',
  'American Studies': 'History',
  'Ancient and Medieval Studies': 'History',
  'Archaeology and Materials': 'History',
  'History of Architecture, Art and Design': 'History',

  // Literature & Languages
  'Literature': 'Literature & Languages',
  'Linguistics': 'Literature & Languages',
  'Writing': 'Literature & Languages',
  'Comparative Media Studies': 'Literature & Languages',
  'Chinese': 'Literature & Languages',
  'French': 'Literature & Languages',
  'German': 'Literature & Languages',
  'Japanese': 'Literature & Languages',
  'Spanish': 'Literature & Languages',
  'English': 'Literature & Languages',

  // Philosophy
  'Philosophy': 'Philosophy',
  'Science, Technology and Society': 'Philosophy',

  // Arts & Design
  'Art and Design': 'Arts & Design',
  'Design': 'Arts & Design',
  'Art, Culture and Technology': 'Arts & Design',
  'Fine Arts': 'Arts & Design',
  'Visual Arts': 'Arts & Design',

  // Music & Theater
  'Music': 'Music & Theater',
  'Theater Arts': 'Music & Theater',
  'Performing Arts': 'Music & Theater',

  // Architecture & Planning
  'Architecture': 'Architecture & Planning',
  'Planning': 'Architecture & Planning',
  'Urban Studies and Planning': 'Architecture & Planning',
  'International Development': 'Architecture & Planning',

  // Environmental Science
  'Earth, Atmospheric, and Planetary Sciences': 'Environmental Science',
  'Climate System Science and Engineering': 'Environmental Science',
  'Environment and Sustainability': 'Environmental Science',
  'Energy Studies': 'Environmental Science',
  'Environmental Science': 'Environmental Science',

  // Education
  'Education': 'Education',
  'Humanities and Engineering': 'Education',
  'Humanities and Science': 'Education',
};

/**
 * 映射专业名称到标准研究领域
 * 使用模糊匹配和关键词匹配
 */
export function mapToStandardField(fieldName: string): StandardResearchField {
  if (!fieldName) return 'Computer Science'; // 默认值

  // 1. 直接匹配
  if (fieldName in FIELD_MAPPING) {
    return FIELD_MAPPING[fieldName];
  }

  // 2. 关键词匹配（不区分大小写）
  const lowerField = fieldName.toLowerCase();

  // Computer Science keywords
  if (lowerField.includes('computer') || lowerField.includes('software') || 
      lowerField.includes('data science') || lowerField.includes('artificial intelligence') ||
      lowerField.includes('machine learning') || lowerField.includes('ai') ||
      lowerField.includes('cybersecurity') || lowerField.includes('networking')) {
    return 'Computer Science';
  }

  // Engineering keywords
  if (lowerField.includes('engineering') || lowerField.includes('mechanical') ||
      lowerField.includes('electrical') || lowerField.includes('aerospace') ||
      lowerField.includes('civil') || lowerField.includes('chemical') ||
      lowerField.includes('materials') || lowerField.includes('robotics')) {
    return 'Engineering';
  }

  // Mathematics keywords
  if (lowerField.includes('math') || lowerField.includes('statistics') ||
      lowerField.includes('computational')) {
    return 'Mathematics';
  }

  // Physics keywords
  if (lowerField.includes('physics') || lowerField.includes('astronomy') ||
      lowerField.includes('astrophysics') || lowerField.includes('quantum')) {
    return 'Physics';
  }

  // Chemistry keywords
  if (lowerField.includes('chemistry') || lowerField.includes('chemical')) {
    return 'Chemistry';
  }

  // Biology keywords
  if (lowerField.includes('biology') || lowerField.includes('bio') ||
      lowerField.includes('genetics') || lowerField.includes('molecular') ||
      lowerField.includes('neuroscience') || lowerField.includes('ecology')) {
    return 'Biology';
  }

  // Medicine & Health keywords
  if (lowerField.includes('medicine') || lowerField.includes('health') ||
      lowerField.includes('cognitive') || lowerField.includes('brain') ||
      lowerField.includes('medical')) {
    return 'Medicine & Health';
  }

  // Economics keywords
  if (lowerField.includes('economics') || lowerField.includes('finance') ||
      lowerField.includes('econometrics')) {
    return 'Economics';
  }

  // Business keywords
  if (lowerField.includes('business') || lowerField.includes('management') ||
      lowerField.includes('entrepreneurship') || lowerField.includes('marketing')) {
    return 'Business & Management';
  }

  // Political Science keywords
  if (lowerField.includes('political') || lowerField.includes('policy') ||
      lowerField.includes('international relations') || lowerField.includes('government')) {
    return 'Political Science';
  }

  // Psychology keywords
  if (lowerField.includes('psychology') || lowerField.includes('cognitive science')) {
    return 'Psychology';
  }

  // Sociology & Anthropology keywords
  if (lowerField.includes('sociology') || lowerField.includes('anthropology') ||
      lowerField.includes('social') || lowerField.includes('gender') ||
      lowerField.includes('cultural')) {
    return 'Sociology & Anthropology';
  }

  // History keywords
  if (lowerField.includes('history') || lowerField.includes('historical') ||
      lowerField.includes('archaeology')) {
    return 'History';
  }

  // Literature & Languages keywords
  if (lowerField.includes('literature') || lowerField.includes('language') ||
      lowerField.includes('linguistics') || lowerField.includes('writing') ||
      lowerField.includes('english') || lowerField.includes('french') ||
      lowerField.includes('spanish') || lowerField.includes('chinese')) {
    return 'Literature & Languages';
  }

  // Philosophy keywords
  if (lowerField.includes('philosophy') || lowerField.includes('ethics')) {
    return 'Philosophy';
  }

  // Arts & Design keywords
  if (lowerField.includes('art') || lowerField.includes('design') ||
      lowerField.includes('visual') || lowerField.includes('fine arts')) {
    return 'Arts & Design';
  }

  // Music & Theater keywords
  if (lowerField.includes('music') || lowerField.includes('theater') ||
      lowerField.includes('theatre') || lowerField.includes('performing')) {
    return 'Music & Theater';
  }

  // Architecture keywords
  if (lowerField.includes('architecture') || lowerField.includes('planning') ||
      lowerField.includes('urban')) {
    return 'Architecture & Planning';
  }

  // Environmental Science keywords
  if (lowerField.includes('environmental') || lowerField.includes('climate') ||
      lowerField.includes('earth') || lowerField.includes('atmospheric') ||
      lowerField.includes('planetary') || lowerField.includes('sustainability')) {
    return 'Environmental Science';
  }

  // Education keywords
  if (lowerField.includes('education') || lowerField.includes('teaching')) {
    return 'Education';
  }

  // 3. 默认返回Computer Science（最常见）
  return 'Computer Science';
}

/**
 * 批量映射多个字段
 */
export function mapFieldsBatch(fields: string[]): Map<string, StandardResearchField> {
  const result = new Map<string, StandardResearchField>();
  fields.forEach(field => {
    result.set(field, mapToStandardField(field));
  });
  return result;
}
