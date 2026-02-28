/**
 * Static mapping of English university names to Chinese.
 * Falls back to the original English name if no match is found.
 */
const UNIVERSITY_NAME_MAP: Record<string, string> = {
  // Ivy League
  "Harvard University": "哈佛大学",
  "Yale University": "耶鲁大学",
  "Princeton University": "普林斯顿大学",
  "Columbia University": "哥伦比亚大学",
  "Cornell University": "康奈尔大学",
  "Dartmouth College": "达特茅斯学院",
  "Brown University": "布朗大学",
  "University of Pennsylvania": "宾夕法尼亚大学",

  // Top Tech / Research
  "MIT": "麻省理工学院",
  "Massachusetts Institute of Technology": "麻省理工学院",
  "Stanford University": "斯坦福大学",
  "California Institute of Technology": "加州理工学院",
  "Carnegie Mellon University": "卡内基梅隆大学",
  "Johns Hopkins University": "约翰斯·霍普金斯大学",
  "Duke University": "杜克大学",
  "Northwestern University": "西北大学",
  "University of Chicago": "芝加哥大学",
  "Rice University": "莱斯大学",
  "Washington University in St. Louis": "圣路易斯华盛顿大学",
  "Georgetown University": "乔治城大学",
  "Vanderbilt University": "范德堡大学",
  "Emory University": "埃默里大学",
  "University of Notre Dame": "圣母大学",
  "Notre Dame University": "圣母大学",

  // UC System
  "University of California, Los Angeles": "加州大学洛杉矶分校",
  "UCLA": "加州大学洛杉矶分校",
  "University of California, Berkeley": "加州大学伯克利分校",
  "UC Berkeley": "加州大学伯克利分校",
  "University of California, San Diego": "加州大学圣地亚哥分校",
  "UC San Diego": "加州大学圣地亚哥分校",
  "University of California, Santa Barbara": "加州大学圣巴巴拉分校",
  "UC Santa Barbara": "加州大学圣巴巴拉分校",
  "University of California, Davis": "加州大学戴维斯分校",
  "UC Davis": "加州大学戴维斯分校",
  "University of California, Irvine": "加州大学欧文分校",
  "UC Irvine": "加州大学欧文分校",
  "University of California, Santa Cruz": "加州大学圣克鲁兹分校",

  // Large Public Universities
  "University of Michigan": "密歇根大学",
  "University of Virginia": "弗吉尼亚大学",
  "University of North Carolina at Chapel Hill": "北卡罗来纳大学教堂山分校",
  "University of Washington": "华盛顿大学",
  "University of Southern California": "南加州大学",
  "University of Florida": "佛罗里达大学",
  "University of Texas at Austin": "德克萨斯大学奥斯汀分校",
  "Ohio State University": "俄亥俄州立大学",
  "The Ohio State University": "俄亥俄州立大学",
  "Penn State University": "宾夕法尼亚州立大学",
  "Pennsylvania State University": "宾夕法尼亚州立大学",
  "University of Wisconsin-Madison": "威斯康星大学麦迪逊分校",
  "University of Minnesota": "明尼苏达大学",
  "University of Illinois Urbana-Champaign": "伊利诺伊大学厄巴纳-香槟分校",
  "University of Maryland": "马里兰大学",
  "Purdue University": "普渡大学",
  "Michigan State University": "密歇根州立大学",
  "Indiana University": "印第安纳大学",
  "University of Colorado Boulder": "科罗拉多大学博尔德分校",
  "University of Arizona": "亚利桑那大学",
  "Arizona State University": "亚利桑那州立大学",
  "University of Pittsburgh": "匹兹堡大学",
  "Boston University": "波士顿大学",
  "Northeastern University": "东北大学",
  "Tufts University": "塔夫茨大学",
  "New York University": "纽约大学",
  "NYU": "纽约大学",
  "George Washington University": "乔治华盛顿大学",
  "American University": "美利坚大学",
  "University of Miami": "迈阿密大学",
  "Lehigh University": "里海大学",
  "Villanova University": "维拉诺瓦大学",
  "Pepperdine University": "佩珀代因大学",
};

/**
 * Translates a university name to Chinese.
 * Returns the Chinese name if found, otherwise returns the original English name.
 */
export function translateUniversity(name: string | null | undefined): string {
  if (!name) return '';
  return UNIVERSITY_NAME_MAP[name] ?? name;
}
