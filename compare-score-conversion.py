#!/usr/bin/env python3
"""
对比不同分数转换方式的效果
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

def piecewise_linear(coverage):
    """分段线性映射"""
    if coverage >= 0.5:
        return 80 + (coverage - 0.5) * 40  # 50%→80, 100%→100
    elif coverage >= 0.3:
        return 70 + (coverage - 0.3) * 50  # 30%→70, 50%→80
    elif coverage >= 0.1:
        return 50 + (coverage - 0.1) * 100  # 10%→50, 30%→70
    else:
        return coverage * 500  # 0%→0, 10%→50

def logarithmic_curve(coverage, k=3.5):
    """对数曲线映射"""
    return 100 * (1 - np.exp(-k * coverage))

def power_curve(coverage, p=0.5):
    """幂函数映射"""
    return 100 * (coverage ** p)

# 生成覆盖率数据点
coverage_rates = np.linspace(0, 1, 100)

# 计算三种转换方式的分数
scores_piecewise = [piecewise_linear(c) for c in coverage_rates]
scores_log = [logarithmic_curve(c) for c in coverage_rates]
scores_power = [power_curve(c) for c in coverage_rates]

# 创建对比图
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# 图1: 三种方式对比
ax1 = axes[0, 0]
ax1.plot(coverage_rates * 100, scores_piecewise, 'b-', linewidth=2, label='Piecewise Linear')
ax1.plot(coverage_rates * 100, scores_log, 'r--', linewidth=2, label='Logarithmic (k=3.5)')
ax1.plot(coverage_rates * 100, scores_power, 'g-.', linewidth=2, label='Power (p=0.5)')
ax1.plot(coverage_rates * 100, coverage_rates * 100, 'k:', linewidth=1, alpha=0.5, label='No Conversion (y=x)')
ax1.set_xlabel('Actual Coverage Rate (%)', fontsize=12)
ax1.set_ylabel('Display Score', fontsize=12)
ax1.set_title('Comparison of Score Conversion Methods', fontsize=14, fontweight='bold')
ax1.legend(fontsize=10)
ax1.grid(True, alpha=0.3)
ax1.set_xlim(0, 100)
ax1.set_ylim(0, 100)

# 添加关键点标注
key_points = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
for cp in key_points:
    c = cp / 100
    y_piecewise = piecewise_linear(c)
    y_log = logarithmic_curve(c)
    if cp in [40, 50, 70, 100]:  # 只标注关键点
        ax1.scatter([cp], [y_piecewise], color='blue', s=50, zorder=5)
        ax1.scatter([cp], [y_log], color='red', s=50, zorder=5)
        ax1.annotate(f'{cp}%→{y_piecewise:.0f}', 
                    xy=(cp, y_piecewise), 
                    xytext=(cp+3, y_piecewise-5),
                    fontsize=9, color='blue')
        ax1.annotate(f'{cp}%→{y_log:.0f}', 
                    xy=(cp, y_log), 
                    xytext=(cp+3, y_log+3),
                    fontsize=9, color='red')

# 图2: 分段线性映射详细
ax2 = axes[0, 1]
ax2.plot(coverage_rates * 100, scores_piecewise, 'b-', linewidth=3)
ax2.fill_between(coverage_rates * 100, 0, scores_piecewise, alpha=0.2)
ax2.set_xlabel('Actual Coverage Rate (%)', fontsize=12)
ax2.set_ylabel('Display Score', fontsize=12)
ax2.set_title('Piecewise Linear Mapping', fontsize=14, fontweight='bold')
ax2.grid(True, alpha=0.3)
ax2.set_xlim(0, 100)
ax2.set_ylim(0, 100)

# 添加区间标注
ax2.axhline(y=80, color='green', linestyle='--', alpha=0.5, linewidth=1)
ax2.axhline(y=70, color='orange', linestyle='--', alpha=0.5, linewidth=1)
ax2.axhline(y=50, color='red', linestyle='--', alpha=0.5, linewidth=1)
ax2.text(95, 82, 'Excellent (>=80)', fontsize=9, color='green', ha='right')
ax2.text(95, 72, 'Good (70-79)', fontsize=9, color='orange', ha='right')
ax2.text(95, 52, 'Fair (50-69)', fontsize=9, color='red', ha='right')

# 标注Da Wei的实际数据点
dawei_points = [
    (44, piecewise_linear(0.44), 'Tanu Mitra\n44%→85'),
    (33, piecewise_linear(0.33), 'Lingzi Hong\n33%→72'),
    (22, piecewise_linear(0.22), 'Emma Spiro\n22%→62'),
]
for x, y, label in dawei_points:
    ax2.scatter([x], [y], color='red', s=100, zorder=5, marker='o')
    ax2.annotate(label, xy=(x, y), xytext=(x-8, y+8),
                fontsize=9, color='red', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))

# 图3: 对数曲线映射详细
ax3 = axes[1, 0]
ax3.plot(coverage_rates * 100, scores_log, 'r-', linewidth=3)
ax3.fill_between(coverage_rates * 100, 0, scores_log, alpha=0.2, color='red')
ax3.set_xlabel('Actual Coverage Rate (%)', fontsize=12)
ax3.set_ylabel('Display Score', fontsize=12)
ax3.set_title('Logarithmic Curve Mapping (k=3.5)', fontsize=14, fontweight='bold')
ax3.grid(True, alpha=0.3)
ax3.set_xlim(0, 100)
ax3.set_ylim(0, 100)

# 添加区间标注
ax3.axhline(y=80, color='green', linestyle='--', alpha=0.5, linewidth=1)
ax3.axhline(y=70, color='orange', linestyle='--', alpha=0.5, linewidth=1)
ax3.axhline(y=50, color='red', linestyle='--', alpha=0.5, linewidth=1)
ax3.text(95, 82, 'Excellent (>=80)', fontsize=9, color='green', ha='right')
ax3.text(95, 72, 'Good (70-79)', fontsize=9, color='orange', ha='right')
ax3.text(95, 52, 'Fair (50-69)', fontsize=9, color='red', ha='right')

# 标注Da Wei的实际数据点
dawei_points_log = [
    (44, logarithmic_curve(0.44), 'Tanu Mitra\n44%→80'),
    (33, logarithmic_curve(0.33), 'Lingzi Hong\n33%→72'),
    (22, logarithmic_curve(0.22), 'Emma Spiro\n22%→57'),
]
for x, y, label in dawei_points_log:
    ax3.scatter([x], [y], color='blue', s=100, zorder=5, marker='o')
    ax3.annotate(label, xy=(x, y), xytext=(x-8, y+8),
                fontsize=9, color='blue', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='lightblue', alpha=0.7))

# 图4: 数据对比表
ax4 = axes[1, 1]
ax4.axis('off')

# 创建对比表格
table_data = [
    ['Coverage', 'Piecewise', 'Logarithmic', 'Difference'],
    ['Rate', 'Linear', 'Curve', '(P - L)'],
]

test_points = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
for cp in test_points:
    c = cp / 100
    p_score = piecewise_linear(c)
    l_score = logarithmic_curve(c)
    diff = p_score - l_score
    
    # 高亮Da Wei的数据点
    if cp in [44, 33, 22]:
        row = [f'**{cp}%**', f'**{p_score:.0f}**', f'**{l_score:.0f}**', f'**{diff:+.0f}**']
    else:
        row = [f'{cp}%', f'{p_score:.0f}', f'{l_score:.0f}', f'{diff:+.0f}']
    table_data.append(row)

# 绘制表格
table = ax4.table(cellText=table_data, cellLoc='center', loc='center',
                 colWidths=[0.2, 0.25, 0.25, 0.25])
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1, 2)

# 设置表头样式
for i in range(4):
    table[(0, i)].set_facecolor('#4CAF50')
    table[(0, i)].set_text_props(weight='bold', color='white')
    table[(1, i)].set_facecolor('#81C784')
    table[(1, i)].set_text_props(weight='bold', color='white')

# 高亮Da Wei的数据行
highlight_rows = []
for i, row in enumerate(table_data[2:], start=2):
    if '**' in row[0]:
        for j in range(4):
            table[(i, j)].set_facecolor('#FFEB3B')
            table[(i, j)].set_text_props(weight='bold')

ax4.set_title('Score Conversion Comparison Table', fontsize=14, fontweight='bold', pad=20)

plt.tight_layout()
plt.savefig('/home/ubuntu/find-my-professor/score-conversion-comparison.png', dpi=150, bbox_inches='tight')
print('✅ Comparison chart saved to: /home/ubuntu/find-my-professor/score-conversion-comparison.png')

# 打印详细对比
print('\n' + '='*80)
print('📊 Score Conversion Comparison')
print('='*80)
print(f"{'Coverage':<12} {'Piecewise':<15} {'Logarithmic':<15} {'Difference':<12}")
print(f"{'Rate':<12} {'Linear':<15} {'Curve':<15} {'(P - L)':<12}")
print('-'*80)

for cp in [0, 10, 20, 30, 40, 44, 50, 60, 70, 80, 90, 100]:
    c = cp / 100
    p_score = piecewise_linear(c)
    l_score = logarithmic_curve(c)
    diff = p_score - l_score
    marker = ' ⭐' if cp in [44, 33, 22] else ''
    print(f"{cp}%{marker:<9} {p_score:>6.1f}{'':<9} {l_score:>6.1f}{'':<9} {diff:>+6.1f}")

print('='*80)
print('\n🎯 Da Wei\'s Actual Match Scores:')
print('-'*80)
print('Tanu Mitra (44% coverage):')
print(f'  Piecewise Linear: {piecewise_linear(0.44):.0f} points')
print(f'  Logarithmic Curve: {logarithmic_curve(0.44):.0f} points')
print(f'  Difference: {piecewise_linear(0.44) - logarithmic_curve(0.44):+.0f} points')
print()
print('Lingzi Hong (33% coverage):')
print(f'  Piecewise Linear: {piecewise_linear(0.33):.0f} points')
print(f'  Logarithmic Curve: {logarithmic_curve(0.33):.0f} points')
print(f'  Difference: {piecewise_linear(0.33) - logarithmic_curve(0.33):+.0f} points')
print()
print('Emma Spiro (22% coverage):')
print(f'  Piecewise Linear: {piecewise_linear(0.22):.0f} points')
print(f'  Logarithmic Curve: {logarithmic_curve(0.22):.0f} points')
print(f'  Difference: {piecewise_linear(0.22) - logarithmic_curve(0.22):+.0f} points')
print('='*80)
