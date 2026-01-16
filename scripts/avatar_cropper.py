#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
头像自动裁剪脚本
自动将 images/raw-avatars/ 中的图片裁剪为 400×400 像素的正方形头像
保存为 images/profile.jpg
"""

import os
import sys
from PIL import Image

def crop_to_center_square(image):
    """
    将图片裁剪为中心正方形

    Args:
        image: PIL Image对象

    Returns:
        裁剪后的正方形图片
    """
    width, height = image.size

    # 计算正方形的边长（取较小的一边）
    square_size = min(width, height)

    # 计算裁剪区域（中心对齐）
    left = (width - square_size) // 2
    top = (height - square_size) // 2
    right = left + square_size
    bottom = top + square_size

    # 裁剪为正方形
    return image.crop((left, top, right, bottom))

def process_avatar(input_path, output_path, size=400):
    """
    处理头像图片

    Args:
        input_path: 输入图片路径
        output_path: 输出图片路径
        size: 目标尺寸（默认400×400）
    """
    try:
        # 打开图片
        img = Image.open(input_path)

        # 转换为RGB模式（如果是PNG透明背景，转为白色背景）
        if img.mode in ('RGBA', 'LA', 'P'):
            # 创建白色背景
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # 裁剪为中心正方形
        img_square = crop_to_center_square(img)

        # 调整大小为目标尺寸
        img_resized = img_square.resize((size, size), Image.Resampling.LANCZOS)

        # 保存为JPEG
        img_resized.save(output_path, 'JPEG', quality=95, optimize=True)

        return True
    except Exception as e:
        print(f"❌ 处理图片失败: {e}")
        return False

def main():
    """
    主函数：处理 raw-avatars 文件夹中的图片
    """
    # 设置控制台输出编码为UTF-8（Windows兼容）
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    # 设置路径
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    raw_dir = os.path.join(project_dir, 'images', 'raw-avatars')
    output_file = os.path.join(project_dir, 'images', 'profile.jpg')

    print("=" * 60)
    print("头像自动裁剪脚本")
    print("=" * 60)

    # 检查 raw-avatars 文件夹是否存在
    if not os.path.exists(raw_dir):
        print(f"❌ 文件夹不存在: {raw_dir}")
        print("请创建 images/raw-avatars/ 文件夹并放入头像图片")
        sys.exit(1)

    # 查找图片文件
    image_files = []
    supported_formats = ('.jpg', '.jpeg', '.png', '.gif', '.bmp')

    for filename in os.listdir(raw_dir):
        if filename.lower().endswith(supported_formats):
            image_files.append(filename)

    if not image_files:
        print(f"❌ 在 {raw_dir} 中没有找到图片文件")
        print(f"支持的格式: {', '.join(supported_formats)}")
        sys.exit(1)

    # 处理找到的第一张图片
    input_file = image_files[0]
    input_path = os.path.join(raw_dir, input_file)

    print(f"\n📸 找到图片: {input_file}")
    print(f"💾 输入路径: {input_path}")
    print(f"💾 输出路径: {output_file}")
    print(f"\n⚙️  开始处理...")

    # 处理图片
    success = process_avatar(input_path, output_file, size=400)

    if success:
        print(f"\n✅ 头像处理成功!")
        print(f"✅ 已保存为: {output_file}")
        print(f"✅ 尺寸: 400×400 像素")

        # 如果有多张图片，提示用户
        if len(image_files) > 1:
            print(f"\n⚠️  注意: 文件夹中有 {len(image_files)} 张图片，已处理第一张")
            print(f"   其他图片: {', '.join(image_files[1:])}")
    else:
        print(f"\n❌ 头像处理失败")
        sys.exit(1)

    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
