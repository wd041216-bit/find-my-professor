/**
 * Tags合并服务
 * 识别并合并词典中的相似tags，提高词典效率和匹配准确率
 */

import { invokeLLM } from "../_core/llm";

export interface TagGroup {
  canonical: string;  // 规范形式（保留的版本）
  variants: string[]; // 变体形式（需要合并的版本）
  frequency: number;  // 总频率
}

/**
 * 识别并合并相似的tags
 * @param tags 原始tags列表（带频率）
 * @returns 合并后的tag groups
 */
export async function mergeSimilarTags(
  tags: Array<{ tag: string; frequency: number }>
): Promise<TagGroup[]> {
  console.log(`[TagsMerge] Analyzing ${tags.length} tags for similarity...`);
  
  // 构建tags列表
  const tagsList = tags.map(t => `${t.tag} (freq: ${t.frequency})`).join('\n');
  
  // 调用LLM识别相似tags
  const prompt = `You are a research tags expert. Analyze the following research tags and identify groups of similar/equivalent tags that should be merged.

Tags List:
${tagsList}

Merging Rules:
1. Abbreviations and full forms (e.g., "AI" and "artificial intelligence")
2. Singular and plural forms (e.g., "network" and "networks")
3. Synonyms and near-synonyms (e.g., "data analysis" and "data analytics")
4. Different word orders with same meaning (e.g., "machine learning" and "learning machines")

For each group:
- Choose the CANONICAL form (prefer full form over abbreviation, prefer higher frequency)
- List all VARIANTS that should be merged into the canonical form
- Sum up the total frequency

Return ONLY a JSON array of tag groups. Each group must have:
- canonical: string (the canonical form to keep)
- variants: string[] (list of variants to merge, NOT including the canonical)
- frequency: number (sum of all frequencies in this group)

Example output:
[
  {
    "canonical": "artificial intelligence",
    "variants": ["AI", "A.I."],
    "frequency": 8
  },
  {
    "canonical": "machine learning",
    "variants": ["ML", "machine-learning"],
    "frequency": 12
  }
]

IMPORTANT:
- Only group tags that are truly similar/equivalent
- If a tag has no similar variants, do NOT include it in the output
- Return an empty array [] if no similar tags are found
- Do NOT create groups for unrelated tags

Output:`;

  const response = await invokeLLM({
    messages: [
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "tag_groups",
        strict: true,
        schema: {
          type: "object",
          properties: {
            groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  canonical: { type: "string" },
                  variants: {
                    type: "array",
                    items: { type: "string" }
                  },
                  frequency: { type: "number" }
                },
                required: ["canonical", "variants", "frequency"],
                additionalProperties: false
              }
            }
          },
          required: ["groups"],
          additionalProperties: false
        }
      }
    }
  });

  const content = typeof response.choices[0].message.content === 'string' 
    ? response.choices[0].message.content 
    : JSON.stringify(response.choices[0].message.content);
  const parsed = JSON.parse(content);
  const groups: TagGroup[] = parsed.groups || [];
  
  console.log(`[TagsMerge] Found ${groups.length} groups of similar tags`);
  
  // 验证并修正频率
  for (const group of groups) {
    // 计算实际频率（canonical + variants）
    const canonicalFreq = tags.find(t => t.tag === group.canonical)?.frequency || 0;
    const variantsFreq = group.variants.reduce((sum, variant) => {
      return sum + (tags.find(t => t.tag === variant)?.frequency || 0);
    }, 0);
    group.frequency = canonicalFreq + variantsFreq;
  }
  
  return groups;
}

/**
 * 应用合并规则到tags列表
 * @param originalTags 原始tags列表
 * @param mergeGroups 合并规则
 * @returns 合并后的tags列表
 */
export function applyMergeRules(
  originalTags: Array<{ tag: string; frequency: number }>,
  mergeGroups: TagGroup[]
): Array<{ tag: string; frequency: number }> {
  console.log(`[TagsMerge] Applying merge rules...`);
  
  // 创建合并映射表：variant → canonical
  const mergeMap = new Map<string, string>();
  for (const group of mergeGroups) {
    for (const variant of group.variants) {
      mergeMap.set(variant, group.canonical);
    }
  }
  
  // 合并tags
  const mergedTags = new Map<string, number>();
  
  for (const { tag, frequency } of originalTags) {
    // 如果是variant，合并到canonical
    const canonical = mergeMap.get(tag) || tag;
    mergedTags.set(canonical, (mergedTags.get(canonical) || 0) + frequency);
  }
  
  // 转换为数组并排序
  const result = Array.from(mergedTags.entries())
    .map(([tag, frequency]) => ({ tag, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
  
  console.log(`[TagsMerge] Merged ${originalTags.length} tags → ${result.length} tags`);
  console.log(`[TagsMerge] Reduction: ${((1 - result.length / originalTags.length) * 100).toFixed(1)}%`);
  
  return result;
}

/**
 * 生成合并报告
 */
export function generateMergeReport(
  originalCount: number,
  mergedCount: number,
  mergeGroups: TagGroup[]
): string {
  const reduction = ((1 - mergedCount / originalCount) * 100).toFixed(1);
  
  let report = `================================================================================\n`;
  report += `📊 Tags Merge Report\n`;
  report += `================================================================================\n\n`;
  report += `Original Tags: ${originalCount}\n`;
  report += `Merged Tags: ${mergedCount}\n`;
  report += `Reduction: ${reduction}%\n`;
  report += `Merge Groups: ${mergeGroups.length}\n\n`;
  
  if (mergeGroups.length > 0) {
    report += `================================================================================\n`;
    report += `🔗 Merge Groups\n`;
    report += `================================================================================\n\n`;
    
    mergeGroups.forEach((group, index) => {
      report += `${index + 1}. ${group.canonical} (freq: ${group.frequency})\n`;
      report += `   Merged from: ${group.variants.join(', ')}\n\n`;
    });
  }
  
  return report;
}
