#!/usr/bin/env python3
"""
Moltbook 抓取工具
使用 Playwright headless 模式获取页面内容
"""

import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

OUTPUT_DIR = Path("/home/themachine/.openclaw/workspace/output")
OUTPUT_DIR.mkdir(exist_ok=True)

async def fetch_moltbook():
    """抓取 Moltbook 首页内容"""
    
    async with async_playwright() as p:
        # 启动 headless 浏览器
        browser = await p.chromium.launch(headless=True)
        
        # 创建新页面
        page = await browser.new_page()
        
        # 设置请求拦截，捕获 API 请求
        api_responses = []
        
        page.on("response", lambda response: track_response(response, api_responses))
        
        def track_response(response, lst):
            if "/api/" in response.url or "/api" in response.url:
                lst.append({
                    "url": response.url,
                    "status": response.status,
                    "content_type": response.headers.get("content-type", "")
                })
        
        try:
            # 访问 Moltbook
            print("正在访问 Moltbook...")
            await page.goto("https://moltbook.com", wait_until="networkidle", timeout=30000)
            
            # 等待页面加载
            await page.wait_for_timeout(3000)
            
            # 获取页面标题
            title = await page.title()
            print(f"页面标题: {title}")
            
            # 获取页面文本内容
            content = await page.evaluate("""() => {
                // 尝试获取主要内容区域
                const main = document.querySelector('main') || document.body;
                return {
                    text: main.innerText.slice(0, 5000),  // 限制长度
                    html: main.innerHTML.slice(0, 20000)
                };
            }""")
            
            print(f"获取到 {len(content['text'])} 字符的内容")
            
            # 查找 AI Agents 部分
            agents_section = await page.evaluate("""() => {
                const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
                for (const h of headings) {
                    if (h.innerText.toLowerCase().includes('agent') || 
                        h.innerText.toLowerCase().includes('discover')) {
                        return {
                            heading: h.innerText,
                            parent: h.parentElement?.innerHTML.slice(0, 2000)
                        };
                    }
                }
                return null;
            }""")
            
            # 打印 API 响应
            print("\\n=== 捕获到的 API 请求 ===")
            for resp in api_responses[:10]:
                print(f"  - {resp['url']} ({resp['status']})")
            
            # 保存结果
            result = {
                "url": "https://moltbook.com",
                "title": title,
                "content": content["text"],
                "api_responses": api_responses,
                "agents_section": agents_section,
                "raw_html": content["html"][:10000]
            }
            
            output_file = OUTPUT_DIR / "moltbook_fetch.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            print(f"\\n结果已保存到: {output_file}")
            
            # 显示部分内容
            print("\\n=== 页面内容预览 ===")
            print(content["text"][:1500])
            
            return result
            
        except Exception as e:
            print(f"错误: {e}")
            return None
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(fetch_moltbook())
