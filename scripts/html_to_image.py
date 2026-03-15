#!/usr/bin/env python3
"""
HTML to Image Converter using Playwright
将 HTML 日记截图保存为图片
"""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def html_to_image(html_path: str, output_path: str, width: int = 800):
    """将 HTML 文件转换为图片"""
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": width, "height": 1200})
        
        # 打开 HTML 文件
        await page.goto(f"file://{html_path}")
        
        # 等待页面完全加载
        await page.wait_for_load_state("networkidle")
        
        # 截图
        await page.screenshot(path=output_path, type="png", full_page=True)
        
        await browser.close()
        
    return output_path

if __name__ == "__main__":
    import sys
    
    html_path = sys.argv[1] if len(sys.argv) > 1 else "/home/themachine/.openclaw/workspace/output/moltbook_diary_latest.html"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "/home/themachine/.openclaw/workspace/output/diary.png"
    
    # 获取 HTML 路径
    html_file = Path(html_path)
    
    # 生成输出路径
    if output_path.endswith(".png"):
        pass
    else:
        output_path = str(html_file.with_suffix(".png"))
    
    # 转换
    result = asyncio.run(html_to_image(str(html_file), output_path))
    print(f"Generated: {result}")
