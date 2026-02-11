#!/usr/bin/env node

/**
 * 通用大学+研究领域图像生成脚本
 * 
 * 使用方法：
 *   node generate-university-images.mjs "Harvard University" "深红色" "狮子"
 *   node generate-university-images.mjs "Stanford University" "红色" "树"
 * 
 * 流程：
 * 1. 从数据库查询该大学的所有研究领域
 * 2. 为每个领域生成专属图像（批量处理）
 * 3. 自动转换为WebP格式并压缩到<1MB
 * 4. 上传到S3 CDN
 * 5. 更新映射配置文件
 */

import { createConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'find_my_professor'
};

// 大学品牌信息
const UNIVERSITY_BRANDING = {
  'MIT': {
    primaryColor: '#A31F34',
    secondaryColor: '#8A8B8C',
    mascot: '海狸',
    colorName: '深红色'
  },
  'Princeton University': {
    primaryColor: '#FF8F00',
    secondaryColor: '#000000',
    mascot: '老虎',
    colorName: '橙色'
  },
  'University of Washington': {
    primaryColor: '#4B2E83',
    secondaryColor: '#B7A57A',
    mascot: '哈士奇',
    colorName: '紫色'
  },
  'Harvard University': {
    primaryColor: '#A41E34',
    secondaryColor: '#FFFFFF',
    mascot: '狮子',
    colorName: '深红色'
  },
  'Stanford University': {
    primaryColor: '#B83A4B',
    secondaryColor: '#FFFFFF',
    mascot: '树',
    colorName: '红色'
  },
  'Yale University': {
    primaryColor: '#00356B',
    secondaryColor: '#FFFFFF',
    mascot: '斗牛犬',
    colorName: '蓝色'
  }
};

// 研究领域特定图标
const FIELD_ICONS = {
  '计算机科学': '电路板、二进制代码、AI芯片',
  '工程学': '齿轮、蓝图、建筑',
  '生物学': 'DNA螺旋、细胞、显微镜',
  '物理学': '原子、波形、宇宙',
  '数学': '几何图形、公式、图表',
  '化学': '分子结构、试管、元素周期表',
  '医学与健康': 'DNA螺旋、医学十字、心跳波形',
  '经济学': '图表、金币、趋势线',
  '政治学': '议会、地球、权力符号',
  '社会学与人类学': '人群、文化符号、社会网络',
  '历史学': '古代手稿、时间线、历史文物',
  '文学与语言': '书籍、笔、文字',
  '哲学': '思考者、灯泡、哲学符号',
  '建筑与规划': '建筑、城市天际线、蓝图',
  '艺术与设计': '调色板、画笔、艺术作品',
  '商业与管理': '商务图表、握手、办公室',
  '教育学': '书籍、学生、讲台',
  '环境科学': '地球、树木、生态符号',
  '音乐与戏剧': '音符、舞台、麦克风'
};

// 生成图像Prompt
function generateImagePrompt(universityName, researchField, branding) {
  const fieldIcons = FIELD_ICONS[researchField] || '学术符号';
  
  return `为${universityName}的${researchField}研究领域生成抽象学术背景图像。

风格：现代、专业、学术美感、抽象艺术
颜色：融合${branding.colorName}(${branding.primaryColor})和${branding.secondaryColor}
元素：微妙的${branding.mascot}剪影、${fieldIcons}、几何图案、渐变效果
氛围：鼓舞人心、学术性、创新性、专业
构图：抽象形状、流动的渐变、最少文字或无文字

技术要求：
- 分辨率：1920x1080px
- 格式：PNG（将自动转换为WebP）
- 无文字或标志
- 适合作为教授卡片背景
- 高质量、清晰、专业

创意指导：
- 使用${branding.mascot}的视觉元素作为微妙的背景元素
- 融合${researchField}的核心概念
- 创建视觉上有趣但不分散注意力的背景
- 确保文字覆盖时仍可读`;
}

// 从数据库获取该大学的所有研究领域
async function fetchUniversityResearchFields(connection, universityName) {
  const [rows] = await connection.execute(
    `SELECT DISTINCT research_field FROM professors 
     WHERE university_name = ? 
     ORDER BY research_field`,
    [universityName]
  );
  
  return rows.map(row => row.research_field);
}

// 生成图像（使用generate工具）
async function generateImage(universityName, researchField, branding) {
  console.log(`  生成 ${universityName} × ${researchField} 图像...`);
  
  const prompt = generateImagePrompt(universityName, researchField, branding);
  const fileName = `${universityName.toLowerCase().replace(/\s+/g, '_')}_${researchField.toLowerCase().replace(/\s+/g, '_')}.png`;
  
  // 注意：这里需要调用generate工具
  // 由于这是Node.js脚本，实际使用时需要通过API或其他方式调用
  console.log(`    Prompt: ${prompt.substring(0, 100)}...`);
  console.log(`    输出文件: ${fileName}`);
  
  return {
    fileName,
    prompt,
    status: 'pending' // 实际需要通过generate工具生成
  };
}

// 转换PNG为WebP并压缩
async function convertToWebP(pngPath, webpPath) {
  try {
    const sharp = await import('sharp');
    
    await sharp.default(pngPath)
      .webp({
        quality: 80,
        effort: 6,
        lossless: false
      })
      .resize(1920, 1080, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(webpPath);
    
    // 检查文件大小
    const stats = fs.statSync(webpPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    if (stats.size > 1024 * 1024) {
      console.warn(`    ⚠ 文件大小 ${sizeMB}MB 超过1MB，重新压缩...`);
      
      // 降低质量重新压缩
      await sharp.default(pngPath)
        .webp({
          quality: 70,
          effort: 6,
          lossless: false
        })
        .resize(1920, 1080, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(webpPath);
      
      const newStats = fs.statSync(webpPath);
      const newSizeMB = (newStats.size / (1024 * 1024)).toFixed(2);
      console.log(`    ✓ 重新压缩完成: ${newSizeMB}MB`);
    } else {
      console.log(`    ✓ 转换完成: ${sizeMB}MB`);
    }
    
    return true;
  } catch (error) {
    console.error(`    ✗ 转换失败:`, error.message);
    return false;
  }
}

// 主函数
async function main() {
  const universityName = process.argv[2];
  const primaryColor = process.argv[3];
  const mascot = process.argv[4];

  if (!universityName) {
    console.error('使用方法: node generate-university-images.mjs "University Name" "Primary Color" "Mascot"');
    console.error('示例: node generate-university-images.mjs "Harvard University" "深红色" "狮子"');
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`开始为 ${universityName} 生成图像`);
  console.log(`========================================`);

  let connection;
  try {
    // 连接数据库
    connection = await createConnection(DB_CONFIG);
    console.log('✓ 数据库连接成功');

    // 获取该大学的所有研究领域
    const researchFields = await fetchUniversityResearchFields(connection, universityName);
    console.log(`✓ 找到 ${researchFields.length} 个研究领域`);

    // 获取或创建品牌信息
    let branding = UNIVERSITY_BRANDING[universityName];
    if (!branding && primaryColor && mascot) {
      branding = {
        primaryColor: primaryColor,
        secondaryColor: '#FFFFFF',
        mascot: mascot,
        colorName: primaryColor
      };
      console.log(`✓ 使用自定义品牌信息`);
    } else if (!branding) {
      console.error('✗ 未找到大学品牌信息，请提供颜色和吉祥物');
      process.exit(1);
    }

    // 为每个研究领域生成图像
    console.log(`\n开始生成 ${researchFields.length} 张图像...`);
    
    const imageBatch = [];
    for (const field of researchFields) {
      const image = await generateImage(universityName, field, branding);
      imageBatch.push(image);
    }

    console.log(`\n========================================`);
    console.log(`图像生成计划已准备`);
    console.log(`总计: ${imageBatch.length} 张图像`);
    console.log(`\n下一步：`);
    console.log(`1. 使用generate工具批量生成这些图像`);
    console.log(`2. 运行转换脚本将PNG转换为WebP`);
    console.log(`3. 上传到S3 CDN`);
    console.log(`4. 更新映射配置文件`);
    console.log(`========================================\n`);

    // 保存生成计划到文件
    const planFile = `${__dirname}/../image-generation-plan-${universityName.replace(/\s+/g, '_')}.json`;
    fs.writeFileSync(planFile, JSON.stringify(imageBatch, null, 2));
    console.log(`✓ 生成计划已保存到: ${planFile}`);

  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
