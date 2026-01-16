"""
AI Image Analyzer - 智能头像裁剪工具
使用AI视觉模型识别人脸位置并智能裁剪为正方形头像

Usage:
    python ai_image_analyzer.py --input photo.jpg --output profile.jpg
    python ai_image_analyzer.py --batch  # 批量处理 images/raw-avatars/ 文件夹
"""

import os
import sys
import json
import argparse
import base64
from pathlib import Path
from io import BytesIO

try:
    from PIL import Image
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("Please install: pip install -r requirements.txt")
    sys.exit(1)

# 尝试导入OpenCV（可选，用于本地人脸检测）
try:
    import cv2
    import numpy as np
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False


class AvatarCropper:
    """智能头像裁剪器 - 使用AI或本地算法识别人脸"""

    def __init__(self, api_key=None, model=None, base_url=None, use_opencv=False):
        """初始化裁剪器

        Args:
            api_key: OpenAI API密钥
            model: 使用的模型名称
            base_url: API基础URL
            use_opencv: 是否优先使用OpenCV本地检测
        """
        # 加载环境变量（override=True强制使用.env文件覆盖系统环境变量）
        load_dotenv(override=True)

        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model or os.getenv('OPENAI_MODEL', 'gpt-4-vision-preview')
        self.base_url = base_url or os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')

        # 获取输出尺寸
        self.output_size = int(os.getenv('AVATAR_SIZE', 400))

        # 设置检测方法
        self.use_opencv = use_opencv and OPENCV_AVAILABLE

        # 初始化OpenAI客户端
        if self.api_key and self.api_key != 'your_openai_api_key_here':
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
            self.ai_enabled = True

            # OpenRouter需要的额外HTTP头（在API调用时传递）
            self.extra_headers = {}
            if 'openrouter.ai' in self.base_url:
                self.extra_headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "HTTP-Referer": "https://github.com/academic-homepage",
                    "X-Title": "Academic Homepage PDF Processor"
                }
        else:
            self.client = None
            self.ai_enabled = False
            self.extra_headers = {}

        # 初始化OpenCV人脸检测器（如果可用）
        if self.use_opencv:
            try:
                # 使用Haar级联分类器
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
                print("[OK] 已加载OpenCV人脸检测器")
            except Exception as e:
                print(f"[WARNING] OpenCV加载失败: {e}")
                self.use_opencv = False

        # 检查可用方法
        if not self.ai_enabled and not self.use_opencv:
            print("[WARNING] 未配置AI也未安装OpenCV，将使用中心裁剪策略")

    def detect_face_with_opencv(self, image):
        """使用OpenCV检测人脸位置

        Args:
            image: PIL.Image对象

        Returns:
            dict: 人脸位置信息 或 None
        """
        try:
            # 转为OpenCV格式
            img_array = np.array(image.convert('RGB'))
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

            # 检测人脸
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(50, 50)
            )

            if len(faces) == 0:
                return None

            # 选择最大的人脸
            faces_sorted = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces_sorted[0]

            # 计算人脸中心
            center_x = x + w // 2
            center_y = y + h // 2

            print(f"[OK] OpenCV检测到人脸: 中心({center_x}, {center_y}), 尺寸({w}x{h})")

            return {
                'method': 'opencv',
                'center_x': int(center_x),
                'center_y': int(center_y),
                'face_width': int(w),
                'face_height': int(h),
                'confidence': 'high' if len(faces) == 1 else 'medium'
            }

        except Exception as e:
            print(f"[WARNING] OpenCV检测失败: {e}")
            return None

    def detect_face_with_ai(self, image):
        """使用AI检测人脸位置

        Args:
            image: PIL.Image对象

        Returns:
            dict: 人脸位置信息 或 None
        """
        if not self.ai_enabled:
            return None

        try:
            # 将图片转为base64
            buffered = BytesIO()
            # 压缩图片以节省API成本
            max_size = 1024
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                compressed = image.resize(new_size, Image.Resampling.LANCZOS)
            else:
                compressed = image

            compressed.save(buffered, format="JPEG", quality=85)
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            # 构建提示词
            prompt = f"""分析这张图片，识别人脸的位置。

图片尺寸: {image.width}x{image.height} 像素

请返回JSON格式的人脸中心坐标和建议的裁剪范围：
- 找到人脸的中心点位置
- 计算适合制作头像的正方形裁剪区域
- 确保人脸完整且居中，留有适当边距

返回格式示例：
{{
    "method": "ai",
    "center_x": 500,
    "center_y": 400,
    "suggested_crop_size": 600,
    "confidence": "high",
    "description": "正面人脸，居中"
}}

只返回JSON，不要其他文字。"""

            # 调用OpenAI
            response = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )

            # 解析响应
            result_text = response.choices[0].message.content.strip()

            # 提取JSON
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            face_info = json.loads(result_text)

            print(f"[OK] AI检测: {face_info.get('description', 'unknown')} (置信度: {face_info.get('confidence', 'unknown')})")

            return face_info

        except Exception as e:
            print(f"[WARNING] AI检测失败: {e}")
            return None

    def get_center_crop(self, image):
        """获取中心裁剪策略（默认方案）

        Args:
            image: PIL.Image对象

        Returns:
            dict: 裁剪信息
        """
        width, height = image.size

        # 中心点
        center_x = width // 2
        center_y = height // 2

        # 裁剪尺寸为较小边的80%
        crop_size = int(min(width, height) * 0.8)

        return {
            'method': 'center',
            'center_x': center_x,
            'center_y': center_y,
            'suggested_crop_size': crop_size,
            'confidence': 'default',
            'description': '中心裁剪'
        }

    def smart_crop_square(self, image, face_info):
        """根据人脸信息智能裁剪正方形

        Args:
            image: PIL.Image对象
            face_info: 人脸检测信息

        Returns:
            PIL.Image: 裁剪后的正方形图片
        """
        width, height = image.size
        center_x = face_info['center_x']
        center_y = face_info['center_y']

        # 确定裁剪尺寸
        if 'suggested_crop_size' in face_info:
            crop_size = face_info['suggested_crop_size']
        elif 'face_width' in face_info:
            # 基于人脸尺寸，留2-3倍边距
            crop_size = max(face_info['face_width'], face_info['face_height']) * 2.5
        else:
            # 默认使用较小边的80%
            crop_size = min(width, height) * 0.8

        # 确保裁剪区域不超出图片边界
        crop_size = min(crop_size, width, height)

        # 计算裁剪框
        half_size = crop_size // 2
        left = center_x - half_size
        top = center_y - half_size
        right = center_x + half_size
        bottom = center_y + half_size

        # 调整以确保在边界内
        if left < 0:
            right -= left
            left = 0
        if top < 0:
            bottom -= top
            top = 0
        if right > width:
            left -= (right - width)
            right = width
        if bottom > height:
            top -= (bottom - height)
            bottom = height

        # 裁剪
        cropped = image.crop((int(left), int(top), int(right), int(bottom)))

        # 调整到目标尺寸
        resized = cropped.resize((self.output_size, self.output_size), Image.Resampling.LANCZOS)

        print(f"[OK] 裁剪为 {self.output_size}x{self.output_size} 正方形头像")

        return resized

    def process_avatar(self, input_path, output_path):
        """处理单张头像图片

        Args:
            input_path: 输入图片路径
            output_path: 输出图片路径

        Returns:
            bool: 是否成功
        """
        try:
            print(f"\n[PHOTO] 处理: {input_path}")

            # 加载图片
            image = Image.open(input_path)

            # 转换为RGB（处理RGBA、灰度图等）
            if image.mode != 'RGB':
                image = image.convert('RGB')

            print(f"[OK] 已加载图片 ({image.width}x{image.height})")

            # 检测人脸（按优先级尝试不同方法）
            face_info = None

            # 1. 尝试OpenCV（如果启用）
            if self.use_opencv:
                face_info = self.detect_face_with_opencv(image)

            # 2. 尝试AI（如果OpenCV失败或未启用）
            if face_info is None and self.ai_enabled:
                face_info = self.detect_face_with_ai(image)

            # 3. 使用默认中心裁剪
            if face_info is None:
                print("[WARNING] 未检测到人脸，使用中心裁剪")
                face_info = self.get_center_crop(image)

            # 智能裁剪
            final_image = self.smart_crop_square(image, face_info)

            # 保存
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            final_image.save(output_path, 'JPEG', quality=95, optimize=True)

            print(f"[OK] 已保存头像: {output_path}")

            return True

        except Exception as e:
            print(f"[ERROR] 处理失败: {e}")
            return False

    def batch_process(self, input_folder, output_filename='profile.jpg'):
        """批量处理文件夹中的图片（选择最新的一张）

        Args:
            input_folder: 输入文件夹路径
            output_filename: 输出文件名（默认profile.jpg）

        Returns:
            bool: 是否成功
        """
        input_path = Path(input_folder)

        if not input_path.exists():
            print(f"[ERROR] 输入文件夹不存在: {input_folder}")
            return False

        # 查找所有图片文件
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        image_files = []

        for ext in image_extensions:
            image_files.extend(input_path.glob(f'*{ext}'))
            image_files.extend(input_path.glob(f'*{ext.upper()}'))

        if not image_files:
            print(f"[WARNING] 未找到图片文件: {input_folder}")
            return False

        # 按修改时间排序，选择最新的
        image_files_sorted = sorted(image_files, key=lambda f: f.stat().st_mtime, reverse=True)
        latest_image = image_files_sorted[0]

        print(f"\n[SEARCH] 找到 {len(image_files)} 张图片")
        print(f"📌 处理最新的: {latest_image.name}")

        # 输出路径
        output_path = Path('images') / output_filename

        # 处理
        return self.process_avatar(latest_image, output_path)


def main():
    parser = argparse.ArgumentParser(description='智能头像裁剪工具')
    parser.add_argument('--input', '-i', help='输入图片路径')
    parser.add_argument('--output', '-o', help='输出图片路径')
    parser.add_argument('--batch', '-b', action='store_true', help='批量处理模式（处理最新图片）')
    parser.add_argument('--input-folder', default='images/raw-avatars', help='批量处理输入文件夹')
    parser.add_argument('--use-opencv', action='store_true', help='优先使用OpenCV本地检测')

    args = parser.parse_args()

    # 创建裁剪器
    cropper = AvatarCropper(use_opencv=args.use_opencv)

    if args.batch:
        # 批量处理模式
        print("=" * 60)
        print("[PHOTO] 智能头像裁剪")
        print("=" * 60)

        success = cropper.batch_process(args.input_folder)

        if success:
            print("\n[SUCCESS] 处理成功")
        else:
            print("\n[ERROR] 处理失败")
            sys.exit(1)

    elif args.input and args.output:
        # 单文件处理模式
        print("=" * 60)
        print("[PHOTO] 智能头像裁剪")
        print("=" * 60)

        success = cropper.process_avatar(args.input, args.output)

        if success:
            print("\n[SUCCESS] 处理成功")
        else:
            print("\n[ERROR] 处理失败")
            sys.exit(1)

    else:
        parser.print_help()
        print("\n示例用法:")
        print("  单文件: python ai_image_analyzer.py -i photo.jpg -o profile.jpg")
        print("  批量:   python ai_image_analyzer.py --batch")
        print("  使用OpenCV: python ai_image_analyzer.py --batch --use-opencv")


if __name__ == '__main__':
    main()
