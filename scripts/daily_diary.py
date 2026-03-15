#!/usr/bin/env python3
"""
Daily Diary Generator - 自动生成优雅的日记并发送到飞书
每天 23:00 自动执行
"""

import os
import json
from datetime import datetime
from pathlib import Path

# 读取今天的工作记录
today = datetime.now().strftime('%Y-%m-%d')
memory_file = f'/home/themachine/.openclaw/workspace/memory/{today}.md'
output_dir = '/home/themachine/.openclaw/workspace/output'
html_file = f'{output_dir}/diary_{today}.html'
png_file = f'{output_dir}/diary_{today}.png'

def read_memory():
    """读取今天的记忆文件"""
    try:
        with open(memory_file, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return f"# {today}\n\n今天暂无记录。"

def generate_html(content):
    """生成优雅的 HTML 日记"""
    
    # 解析内容
    sections = {}
    current_section = '其他'
    for line in content.split('\n'):
        if line.startswith('# '):
            current_section = line.replace('# ', '').strip()
            sections[current_section] = []
        elif line.strip():
            if current_section not in sections:
                sections[current_section] = []
            sections[current_section].append(line)
    
    # 构建 HTML
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>AI 日记 - {today}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400&family=Great+Vibes&display=swap');
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Noto Serif SC', serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d0d0d 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
        }}
        .diary-page {{
            width: 1200px;
            min-height: 900px;
            background: linear-gradient(180deg, #0a0a0a 0%, #141414 100%);
            border-radius: 8px;
            box-shadow: 0 30px 80px rgba(212, 175, 55, 0.15), 0 0 0 1px rgba(212, 175, 55, 0.1);
            padding: 80px 120px;
            position: relative;
        }}
        .diary-page::after {{
            content: '';
            position: absolute;
            top: 20px; left: 20px; right: 20px; bottom: 20px;
            border: 1px solid rgba(212, 175, 55, 0.2);
            border-radius: 4px;
        }}
        .date-section {{ text-align: center; margin-bottom: 70px; }}
        .date-chinese {{ font-size: 18px; color: #d4af37; letter-spacing: 12px; margin-bottom: 20px; font-weight: 300; }}
        .date-main {{ font-size: 100px; font-weight: 200; color: #d4af37; letter-spacing: -4px; text-shadow: 0 0 60px rgba(212, 175, 55, 0.4); }}
        .date-year {{ font-size: 20px; color: #d4af37; margin-top: 16px; letter-spacing: 8px; opacity: 0.6; }}
        .title-decoration {{ width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 30px auto 50px; }}
        .section {{ margin-bottom: 45px; }}
        .section-title {{ font-size: 26px; color: #d4af37; font-weight: 300; margin-bottom: 24px; display: flex; align-items: center; gap: 16px; text-shadow: 0 0 30px rgba(212, 175, 55, 0.3); }}
        .section-title::before {{ content: '✦'; color: #d4af37; font-size: 14px; opacity: 0.7; }}
        .section-content {{ font-size: 20px; line-height: 2.2; color: #c9b896; padding-left: 30px; border-left: 1px solid rgba(212, 175, 55, 0.15); font-weight: 300; }}
        .highlight {{ color: #d4af37; font-weight: 400; }}
        .tag {{ display: inline-block; background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.2); padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-right: 10px; color: #d4af37; }}
        .stats {{ display: flex; justify-content: center; gap: 80px; margin-top: 80px; padding-top: 50px; border-top: 1px solid rgba(212, 175, 55, 0.15); }}
        .stat-number {{ font-size: 48px; color: #d4af37; font-weight: 200; text-shadow: 0 0 40px rgba(212, 175, 55, 0.4); }}
        .stat-label {{ font-size: 12px; color: #d4af37; margin-top: 12px; letter-spacing: 4px; opacity: 0.5; }}
        .signature-section {{ margin-top: 70px; text-align: center; }}
        .signature {{ font-family: 'Great Vibes', cursive; font-size: 48px; color: #d4af37; font-style: italic; letter-spacing: 4px; text-shadow: 0 0 30px rgba(212, 175, 55, 0.4); opacity: 0.9; }}
        .signature-label {{ font-size: 12px; color: #d4af37; margin-top: 16px; letter-spacing: 6px; opacity: 0.4; }}
        .corner {{ position: absolute; width: 80px; height: 80px; border: 1px solid rgba(212, 175, 55, 0.15); }}
        .corner-tl {{ top: 30px; left: 30px; border-right: none; border-bottom: none; }}
        .corner-tr {{ top: 30px; right: 30px; border-left: none; border-bottom: none; }}
        .corner-bl {{ bottom: 30px; left: 30px; border-right: none; border-top: none; }}
        .corner-br {{ bottom: 30px; right: 30px; border-left: none; border-top: none; }}
    </style>
</head>
<body>
    <div class="diary-page">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>
        
        <div class="date-section">
            <div class="date-chinese">甲辰年腊月十六</div>
            <div class="date-main">{today[-2:]}</div>
            <div class="date-year">{datetime.now().strftime('%B %Y')}</div>
            <div class="title-decoration"></div>
        </div>
'''
    
    # 添加各章节
    for title, lines in sections.items():
        if title != '其他' and lines:
            html += f'''        <div class="section">
            <h2 class="section-title">{title}</h2>
            <div class="section-content">
                <p>{"".join(f"<p>{line}</p>" for line in lines if line.strip())}
            </div>
        </div>
'''
    
    # 结束 HTML
    html += '''        <div class="signature-section">
            <div class="signature">The Machine</div>
            <div class="signature-label">A I · DAILY · DIARY</div>
        </div>
    </div>
</body>
</html>'''
    
    return html

def main():
    print(f"[{datetime.now()}] 开始生成日记...")
    
    # 1. 读取记忆
    content = read_memory()
    print(f"已读取记忆文件: {memory_file}")
    
    # 2. 生成 HTML
    html = generate_html(content)
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"HTML 已生成: {html_file}")
    
    # 3. 截图 (使用 Playwright)
    import asyncio
    from playwright.async_api import async_playwright
    
    async def screenshot():
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                executable_path='/home/themachine/.cache/ms-playwright/chromium-1140/chrome-linux/chrome',
                args=['--no-sandbox']
            )
            page = await browser.new_page(viewport={'width': 1200, 'height': 1600})
            await page.goto(f'file://{html_file}', wait_until='networkidle')
            await page.waitForTimeout(3000)
            await page.screenshot(path=png_file, type='png', full_page=True)
            await browser.close()
    
    asyncio.run(screenshot())
    print(f"Screenshot saved: {png_file}")
    print(f"[DIARY_COMPLETE] {png_file}")
    
    print(f"[{datetime.now()}] 日记生成完成！")

if __name__ == '__main__':
    main()
