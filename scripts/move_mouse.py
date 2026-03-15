#!/usr/bin/env python3
"""移动鼠标防止熄屏 - 无需额外依赖"""

import time
import random
import sys
import ctypes
from ctypes import wintype

# Windows API
user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

def get_screen_size():
    """获取屏幕尺寸"""
    width = user32.GetSystemMetrics(0)  # SM_CXSCREEN
    height = user32.GetSystemMetrics(1)  # SM_CYSCREEN
    return width, height

def move_mouse():
    """移动鼠标"""
    width, height = get_screen_size()
    
    # 获取当前位置
    class POINT(ctypes.Structure):
        _fields_ = [("x", wintype.LONG), ("y", wintype.LONG)]
    
    pt = POINT()
    user32.GetCursorPos(ctypes.byref(pt))
    
    # 随机移动一小段距离
    new_x = pt.x + random.randint(-10, 10)
    new_y = pt.y + random.randint(-10, 10)
    
    # 确保在屏幕范围内
    new_x = max(0, min(new_x, width - 1))
    new_y = max(0, min(new_y, height - 1))
    
    user32.SetCursorPos(new_x, new_y)
    print(f"[{time.strftime('%H:%M:%S')}] 鼠标移动到 ({new_x}, {new_y})")

def main():
    interval = 10  # 秒
    
    print(f"开始防止熄屏... 每 {interval} 秒移动一次鼠标")
    print("按 Ctrl+C 停止")
    
    try:
        while True:
            move_mouse()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n已停止")

if __name__ == "__main__":
    main()
