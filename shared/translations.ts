/**
 * Chinese to English translations for universities and majors
 * Used for intelligent input normalization
 */

export const universityTranslations: Record<string, string> = {
  // US Universities
  "麻省理工学院": "MIT",
  "麻省理工": "MIT",
  "哈佛大学": "Harvard University",
  "哈佛": "Harvard University",
  "斯坦福大学": "Stanford University",
  "斯坦福": "Stanford University",
  "加州理工学院": "California Institute of Technology",
  "加州理工": "Caltech",
  "普林斯顿大学": "Princeton University",
  "普林斯顿": "Princeton University",
  "耶鲁大学": "Yale University",
  "耶鲁": "Yale University",
  "哥伦比亚大学": "Columbia University",
  "哥大": "Columbia University",
  "芝加哥大学": "University of Chicago",
  "宾夕法尼亚大学": "University of Pennsylvania",
  "宾大": "University of Pennsylvania",
  "康奈尔大学": "Cornell University",
  "康奈尔": "Cornell University",
  "杜克大学": "Duke University",
  "杜克": "Duke University",
  "约翰霍普金斯大学": "Johns Hopkins University",
  "约翰霍普金斯": "Johns Hopkins University",
  "西北大学": "Northwestern University",
  "达特茅斯学院": "Dartmouth College",
  "达特茅斯": "Dartmouth College",
  "布朗大学": "Brown University",
  "布朗": "Brown University",
  "范德堡大学": "Vanderbilt University",
  "莱斯大学": "Rice University",
  "圣路易斯华盛顿大学": "Washington University in St. Louis",
  "华盛顿大学圣路易斯": "Washington University in St. Louis",
  "加州大学伯克利分校": "UC Berkeley",
  "伯克利": "UC Berkeley",
  "加州大学洛杉矶分校": "UCLA",
  "加州大学圣地亚哥分校": "UC San Diego",
  "加州大学圣巴巴拉分校": "UC Santa Barbara",
  "加州大学尔湾分校": "UC Irvine",
  "加州大学戴维斯分校": "UC Davis",
  "南加州大学": "USC",
  "密歇根大学安娜堡分校": "University of Michigan",
  "密歇根大学": "University of Michigan",
  "纽约大学": "NYU",
  "北卡罗来纳大学教堂山分校": "UNC Chapel Hill",
  "弗吉尼亚大学": "University of Virginia",
  "卡内基梅隆大学": "Carnegie Mellon University",
  "卡梅": "Carnegie Mellon University",
  "埃默里大学": "Emory University",
  "乔治城大学": "Georgetown University",
  "波士顿大学": "Boston University",
  "波士顿学院": "Boston College",
  "威斯康星大学麦迪逊分校": "University of Wisconsin-Madison",
  "伊利诺伊大学厄巴纳-香槟分校": "UIUC",
  "德克萨斯大学奥斯汀分校": "UT Austin",
  "华盛顿大学": "University of Washington",
  "佐治亚理工学院": "Georgia Tech",
  "佐治亚理工": "Georgia Tech",
  
  // UK Universities
  "牛津大学": "University of Oxford",
  "牛津": "Oxford",
  "剑桥大学": "University of Cambridge",
  "剑桥": "Cambridge",
  "帝国理工学院": "Imperial College London",
  "帝国理工": "Imperial College London",
  "伦敦大学学院": "UCL",
  "伦敦政治经济学院": "LSE",
  "爱丁堡大学": "University of Edinburgh",
  "曼彻斯特大学": "University of Manchester",
  "伦敦国王学院": "King's College London",
  "华威大学": "University of Warwick",
  "布里斯托大学": "University of Bristol",
  
  // Canadian Universities
  "多伦多大学": "University of Toronto",
  "麦吉尔大学": "McGill University",
  "不列颠哥伦比亚大学": "UBC",
  "滑铁卢大学": "University of Waterloo",
  "麦克马斯特大学": "McMaster University",
  "蒙特利尔大学": "Université de Montréal",
  
  // Australian Universities
  "墨尔本大学": "University of Melbourne",
  "悉尼大学": "University of Sydney",
  "澳大利亚国立大学": "ANU",
  "新南威尔士大学": "UNSW",
  "昆士兰大学": "University of Queensland",
  "莫纳什大学": "Monash University",
  
  // Chinese Universities
  "清华大学": "Tsinghua University",
  "清华": "Tsinghua University",
  "北京大学": "Peking University",
  "北大": "Peking University",
  "复旦大学": "Fudan University",
  "复旦": "Fudan University",
  "上海交通大学": "Shanghai Jiao Tong University",
  "上海交大": "Shanghai Jiao Tong University",
  "浙江大学": "Zhejiang University",
  "浙大": "Zhejiang University",
  "中国科学技术大学": "USTC",
  "中科大": "USTC",
  "南京大学": "Nanjing University",
  "南大": "Nanjing University",
  "武汉大学": "Wuhan University",
  "武大": "Wuhan University",
  "中山大学": "Sun Yat-sen University",
  "中大": "Sun Yat-sen University",
  "哈尔滨工业大学": "Harbin Institute of Technology",
  "哈工大": "Harbin Institute of Technology",
  "西安交通大学": "Xi'an Jiaotong University",
  "西安交大": "Xi'an Jiaotong University",
  "北京航空航天大学": "Beihang University",
  "北航": "Beihang University",
  "同济大学": "Tongji University",
  "同济": "Tongji University",
  "天津大学": "Tianjin University",
  "天大": "Tianjin University",
  "华中科技大学": "Huazhong University of Science and Technology",
  "华科": "Huazhong University of Science and Technology",
  "东南大学": "Southeast University",
  "厦门大学": "Xiamen University",
  "厦大": "Xiamen University",
  "北京师范大学": "Beijing Normal University",
  "北师大": "Beijing Normal University",
  "中国人民大学": "Renmin University of China",
  "人大": "Renmin University of China",
};

export const majorTranslations: Record<string, string> = {
  // STEM Fields
  "计算机科学": "Computer Science",
  "计算机": "Computer Science",
  "电子工程": "Electrical Engineering",
  "电气工程": "Electrical Engineering",
  "机械工程": "Mechanical Engineering",
  "土木工程": "Civil Engineering",
  "化学工程": "Chemical Engineering",
  "生物工程": "Bioengineering",
  "生物医学工程": "Biomedical Engineering",
  "材料科学": "Materials Science",
  "材料工程": "Materials Engineering",
  "航空航天工程": "Aerospace Engineering",
  "环境工程": "Environmental Engineering",
  "工业工程": "Industrial Engineering",
  "软件工程": "Software Engineering",
  "数据科学": "Data Science",
  "人工智能": "Artificial Intelligence",
  "机器学习": "Machine Learning",
  "信息系统": "Information Systems",
  "网络安全": "Cybersecurity",
  "信息安全": "Information Security",
  
  // Natural Sciences
  "物理": "Physics",
  "物理学": "Physics",
  "化学": "Chemistry",
  "生物": "Biology",
  "生物学": "Biology",
  "数学": "Mathematics",
  "统计学": "Statistics",
  "天文学": "Astronomy",
  "地质学": "Geology",
  "地球科学": "Earth Science",
  "环境科学": "Environmental Science",
  "神经科学": "Neuroscience",
  "分子生物学": "Molecular Biology",
  "细胞生物学": "Cell Biology",
  "遗传学": "Genetics",
  "生物化学": "Biochemistry",
  "微生物学": "Microbiology",
  "生态学": "Ecology",
  
  // Medical & Health
  "医学": "Medicine",
  "临床医学": "Clinical Medicine",
  "药学": "Pharmacy",
  "护理学": "Nursing",
  "公共卫生": "Public Health",
  "牙医": "Dentistry",
  "兽医": "Veterinary Medicine",
  "营养学": "Nutrition",
  "康复治疗": "Rehabilitation Therapy",
  
  // Business & Economics
  "商科": "Business",
  "工商管理": "Business Administration",
  "金融": "Finance",
  "金融学": "Finance",
  "会计": "Accounting",
  "会计学": "Accounting",
  "市场营销": "Marketing",
  "经济学": "Economics",
  "国际贸易": "International Trade",
  "人力资源": "Human Resources",
  "管理学": "Management",
  "创业": "Entrepreneurship",
  "供应链管理": "Supply Chain Management",
  
  // Social Sciences
  "心理学": "Psychology",
  "社会学": "Sociology",
  "政治学": "Political Science",
  "国际关系": "International Relations",
  "人类学": "Anthropology",
  "地理学": "Geography",
  "传播学": "Communication",
  "新闻学": "Journalism",
  "教育学": "Education",
  "法学": "Law",
  "法律": "Law",
  "犯罪学": "Criminology",
  
  // Humanities & Arts
  "文学": "Literature",
  "历史": "History",
  "历史学": "History",
  "哲学": "Philosophy",
  "语言学": "Linguistics",
  "英语": "English",
  "中文": "Chinese",
  "艺术": "Art",
  "美术": "Fine Arts",
  "音乐": "Music",
  "戏剧": "Theater",
  "电影": "Film Studies",
  "设计": "Design",
  "建筑": "Architecture",
  "建筑学": "Architecture",
  "城市规划": "Urban Planning",
  
  // Other
  "农业": "Agriculture",
  "林业": "Forestry",
  "海洋科学": "Marine Science",
  "气象学": "Meteorology",
  "体育": "Sports Science",
  "运动科学": "Kinesiology",
};

/**
 * Normalize Chinese input to English
 */
export function normalizeUniversity(input: string): string {
  const trimmed = input.trim();
  
  // Check direct match
  if (universityTranslations[trimmed]) {
    return universityTranslations[trimmed];
  }
  
  // Check if already in English
  if (/^[a-zA-Z\s\-\.]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Return original if no match found
  return trimmed;
}

/**
 * Normalize Chinese major to English
 */
export function normalizeMajor(input: string): string {
  const trimmed = input.trim();
  
  // Check direct match
  if (majorTranslations[trimmed]) {
    return majorTranslations[trimmed];
  }
  
  // Check if already in English
  if (/^[a-zA-Z\s\-\.]+$/.test(trimmed)) {
    return trimmed;
  }
  
  // Return original if no match found
  return trimmed;
}

/**
 * Get suggestions for autocomplete
 */
export function getUniversitySuggestions(input: string): Array<{ chinese: string; english: string }> {
  if (!input) return [];
  
  const lowerInput = input.toLowerCase();
  const suggestions: Array<{ chinese: string; english: string }> = [];
  
  for (const [chinese, english] of Object.entries(universityTranslations)) {
    if (
      chinese.includes(input) ||
      english.toLowerCase().includes(lowerInput)
    ) {
      suggestions.push({ chinese, english });
    }
  }
  
  return suggestions.slice(0, 10); // Limit to 10 suggestions
}

/**
 * Get major suggestions for autocomplete
 */
export function getMajorSuggestions(input: string): Array<{ chinese: string; english: string }> {
  if (!input) return [];
  
  const lowerInput = input.toLowerCase();
  const suggestions: Array<{ chinese: string; english: string }> = [];
  
  for (const [chinese, english] of Object.entries(majorTranslations)) {
    if (
      chinese.includes(input) ||
      english.toLowerCase().includes(lowerInput)
    ) {
      suggestions.push({ chinese, english });
    }
  }
  
  return suggestions.slice(0, 10); // Limit to 10 suggestions
}
