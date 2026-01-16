"""
PDF Cover Extractor
自动从PDF论文中提取封面图片，使用AI识别框架图并智能裁剪

Usage:
    python pdf_cover_extractor.py --input paper.pdf --output cover.png
    python pdf_cover_extractor.py --batch  # 批量处理 images/raw-papers/ 文件夹
"""

import os
import sys
import json
import argparse
import base64
import shutil
from pathlib import Path
from io import BytesIO

try:
    import fitz  # PyMuPDF
    from PIL import Image
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    print("Please install: pip install -r requirements.txt")
    sys.exit(1)


class PDFCoverExtractor:
    """PDF封面提取器 - 使用AI智能识别和裁剪"""

    def __init__(self, api_key=None, model=None, base_url=None):
        """初始化提取器

        Args:
            api_key: OpenAI API密钥 (如果不提供则从.env读取)
            model: 使用的模型名称 (默认从.env读取)
            base_url: API基础URL (支持代理)
        """
        # 加载环境变量（override=True强制使用.env文件覆盖系统环境变量）
        load_dotenv(override=True)

        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model or os.getenv('OPENAI_MODEL', 'gpt-4-vision-preview')
        self.base_url = base_url or os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')

        # 获取输出尺寸配置
        self.output_width = int(os.getenv('PAPER_COVER_WIDTH', 400))
        self.output_height = int(os.getenv('PAPER_COVER_HEIGHT', 300))

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
            print("[WARNING] 未配置OpenAI API，将使用默认裁剪策略")

    def extract_pages(self, pdf_path, page_range=None):
        """从PDF提取指定页面为图片列表

        Args:
            pdf_path: PDF文件路径
            page_range: 页面范围，格式为 "1-5" 或 "1,3,5" 或 None（提取所有页）

        Returns:
            list: PIL.Image对象列表，每个元素为(page_num, image)元组
        """
        try:
            doc = fitz.open(pdf_path)
            if len(doc) == 0:
                raise ValueError("PDF文件为空")

            total_pages = len(doc)

            # 解析页面范围
            if page_range is None:
                # 扫描所有页面
                pages_to_extract = list(range(total_pages))
                print(f"[INFO] 将扫描所有 {total_pages} 页")
            else:
                pages_to_extract = self._parse_page_range(page_range, total_pages)
                print(f"[INFO] 将扫描第 {page_range} 页（共 {len(pages_to_extract)} 页）")

            # 设置较高的分辨率以获得清晰图片 (300 DPI)
            zoom = 300 / 72  # 72 is default DPI
            mat = fitz.Matrix(zoom, zoom)

            # 提取所有指定页面
            images = []
            for page_num in pages_to_extract:
                page = doc[page_num]
                pix = page.get_pixmap(matrix=mat)

                # 转换为PIL Image
                img_data = pix.tobytes("png")
                image = Image.open(BytesIO(img_data))
                images.append((page_num + 1, image))  # 页码从1开始显示

            doc.close()

            print(f"[OK] 已提取 {len(images)} 页图片")
            return images

        except Exception as e:
            raise Exception(f"提取PDF页面失败: {e}")

    def _parse_page_range(self, page_range, total_pages):
        """解析页面范围字符串

        Args:
            page_range: 格式如 "1-5" 或 "1,3,5-7"
            total_pages: PDF总页数

        Returns:
            list: 页面索引列表（从0开始）
        """
        pages = set()

        for part in page_range.split(','):
            if '-' in part:
                # 范围格式: "1-5"
                start, end = part.split('-')
                start = int(start.strip()) - 1  # 转为0索引
                end = int(end.strip()) - 1
                pages.update(range(max(0, start), min(total_pages, end + 1)))
            else:
                # 单页: "3"
                page = int(part.strip()) - 1
                if 0 <= page < total_pages:
                    pages.add(page)

        return sorted(list(pages))

    def select_best_page_with_ai(self, images):
        """使用AI从多个页面中选择最适合作为封面的页面

        Args:
            images: (page_num, image)元组列表

        Returns:
            tuple: (best_page_num, best_image) 或 None
        """
        if not self.ai_enabled:
            print("[WARNING] AI未启用，将使用第一页")
            return images[0] if images else None

        if len(images) == 1:
            return images[0]

        try:
            print(f"[AI] 正在分析 {len(images)} 页，选择最佳封面...")

            # 为每页生成缩略图并转为base64
            page_data = []
            for page_num, image in images:
                # 生成小缩略图以节省token
                thumbnail = image.copy()
                thumbnail.thumbnail((800, 800), Image.Resampling.LANCZOS)

                buffered = BytesIO()
                thumbnail.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

                page_data.append({
                    'page_num': page_num,
                    'base64': img_base64,
                    'original': image
                })

            # 构建AI提示词
            prompt = f"""你现在要从学术论文的 {len(images)} 页中选择最适合作为封面的一页。

请分析每一页，按以下优先级选择：
1. **包含框架图/流程图的页面** - 展示研究方法或系统架构
2. **包含核心结果图表的页面** - 关键数据可视化
3. **包含研究示意图的页面** - 清晰的概念图示

要求：
- 返回最适合的页码（从1开始）
- 说明选择理由
- 如果所有页面都是纯文字，选择第1页

返回JSON格式：
{{
    "best_page": 3,
    "reason": "第3页包含完整的研究框架图",
    "type": "framework_diagram",
    "confidence": "high"
}}

只返回JSON，不要其他文字。"""

            # 构建消息内容
            content = [{"type": "text", "text": prompt}]

            # 添加所有页面图片
            for i, data in enumerate(page_data):
                content.append({
                    "type": "text",
                    "text": f"\n=== 第 {data['page_num']} 页 ==="
                })
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{data['base64']}"
                    }
                })

            # 调用OpenAI Vision API
            response = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": content
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

            selection = json.loads(result_text)

            best_page = selection.get('best_page', 1)
            reason = selection.get('reason', 'No reason provided')

            print(f"[OK] AI选择: 第{best_page}页 - {reason}")

            # 找到对应的图片
            for page_num, image in images:
                if page_num == best_page:
                    return (page_num, image)

            # 如果没找到，返回第一页
            print("[WARNING] AI选择的页面无效，使用第一页")
            return images[0]

        except Exception as e:
            print(f"[WARNING] AI页面选择失败: {e}")
            print("   将使用第一页")
            return images[0] if images else None

    def analyze_with_ai(self, image):
        """使用AI分析图片并识别最佳裁剪区域

        Args:
            image: PIL.Image对象

        Returns:
            dict: 包含裁剪坐标的字典 {'x': int, 'y': int, 'width': int, 'height': int}
                  如果AI分析失败，返回None
        """
        if not self.ai_enabled:
            return None

        try:
            # 将图片转为base64
            buffered = BytesIO()
            image.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

            # 构建AI提示词
            prompt = f"""分析这张学术论文首页图片，识别最适合作为封面的内容。

请按以下优先级识别：
1. **框架图/流程图** - 展示研究方法或系统架构的图表
2. **核心图表** - 关键结果可视化、数据图表
3. **示意图** - 研究对象或概念的图示
4. 如果没有合适的图表，选择**标题和作者区域**

要求：
- 返回JSON格式的裁剪坐标
- 坐标基于原图尺寸 {image.width}x{image.height} 像素
- 裁剪区域尽量保持4:3的宽高比（宽度稍大）
- 确保完整包含识别的图表，不要裁切边缘

返回格式示例：
{{
    "type": "framework_diagram",
    "description": "研究方法框架图",
    "x": 100,
    "y": 150,
    "width": 800,
    "height": 600,
    "confidence": "high"
}}

只返回JSON，不要其他文字。"""

            # 调用OpenAI Vision API
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
                                    "url": f"data:image/png;base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )

            # 解析响应
            result_text = response.choices[0].message.content.strip()

            # 提取JSON（可能被代码块包裹）
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            crop_info = json.loads(result_text)

            print(f"[OK] AI识别: {crop_info.get('description', 'unknown')} (置信度: {crop_info.get('confidence', 'unknown')})")

            return crop_info

        except Exception as e:
            print(f"[WARNING] AI分析失败: {e}")
            print("   将使用默认裁剪策略")
            return None

    def get_default_crop(self, image):
        """获取默认裁剪区域（当AI不可用时）

        Args:
            image: PIL.Image对象

        Returns:
            dict: 裁剪坐标
        """
        width, height = image.size

        # 默认策略：裁剪上半部分的中心区域（通常包含标题和主要图表）
        # 目标比例 4:3
        crop_width = min(width * 0.9, width - 40)  # 留边距
        crop_height = crop_width * 3 / 4

        # 如果高度超出，调整
        if crop_height > height * 0.6:
            crop_height = height * 0.6
            crop_width = crop_height * 4 / 3

        # 居中
        x = (width - crop_width) / 2
        y = height * 0.15  # 从上方15%处开始

        return {
            'type': 'default',
            'description': '默认裁剪区域',
            'x': int(x),
            'y': int(y),
            'width': int(crop_width),
            'height': int(crop_height),
            'confidence': 'default'
        }

    def crop_and_resize(self, image, crop_info):
        """根据裁剪信息裁剪并调整图片尺寸

        Args:
            image: PIL.Image对象
            crop_info: 裁剪信息字典

        Returns:
            PIL.Image: 裁剪并调整尺寸后的图片
        """
        # 提取坐标
        x = crop_info['x']
        y = crop_info['y']
        width = crop_info['width']
        height = crop_info['height']

        # 确保坐标在图片范围内
        img_width, img_height = image.size
        x = max(0, min(x, img_width))
        y = max(0, min(y, img_height))
        width = min(width, img_width - x)
        height = min(height, img_height - y)

        # 裁剪
        cropped = image.crop((x, y, x + width, y + height))

        # 调整到目标尺寸
        resized = cropped.resize((self.output_width, self.output_height), Image.Resampling.LANCZOS)

        print(f"[OK] 裁剪并调整尺寸至 {self.output_width}x{self.output_height}")

        return resized

    def process_pdf(self, pdf_path, output_path, page_range=None):
        """处理单个PDF文件

        Args:
            pdf_path: 输入PDF路径
            output_path: 输出图片路径
            page_range: 页面范围，如 "1-5" 或 "3,5,7" 或 None（扫描所有页）

        Returns:
            bool: 是否成功
        """
        try:
            print(f"\n[PDF] 处理: {pdf_path}")

            # 1. 提取指定页面
            images = self.extract_pages(pdf_path, page_range)

            if not images:
                print("[ERROR] 未能提取任何页面")
                return False

            # 2. 使用AI选择最佳页面（如果有多页）
            if len(images) > 1 and self.ai_enabled:
                selected = self.select_best_page_with_ai(images)
                if selected:
                    page_num, image = selected
                    print(f"[AI] 已选择第 {page_num} 页作为封面")
                else:
                    page_num, image = images[0]
                    print(f"[WARNING] AI选择失败，使用第 {images[0][0]} 页")
            else:
                page_num, image = images[0]
                if len(images) == 1:
                    print(f"[INFO] 仅扫描第 {page_num} 页")

            # 3. AI分析裁剪区域（如果可用）
            crop_info = self.analyze_with_ai(image)

            # 4. 如果AI失败，使用默认策略
            if crop_info is None:
                crop_info = self.get_default_crop(image)

            # 5. 裁剪并调整尺寸
            final_image = self.crop_and_resize(image, crop_info)

            # 6. 保存
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            final_image.save(output_path, 'PNG', optimize=True)

            print(f"[OK] 已保存封面: {output_path}")

            # 7. 复制PDF到下载目录
            pdfs_folder = Path('pdfs')
            pdfs_folder.mkdir(parents=True, exist_ok=True)
            pdf_copy_path = pdfs_folder / Path(pdf_path).name

            if not pdf_copy_path.exists():
                shutil.copy2(pdf_path, pdf_copy_path)
                print(f"[OK] PDF已复制至下载目录: {pdf_copy_path}")
            else:
                print(f"[SKIP] PDF已存在于下载目录: {pdf_copy_path}")

            return True

        except Exception as e:
            print(f"[ERROR] 处理失败: {e}")
            return False

    def batch_process(self, input_folder, output_folder, page_range=None):
        """批量处理文件夹中的所有PDF

        Args:
            input_folder: 输入文件夹路径
            output_folder: 输出文件夹路径
            page_range: 页面范围，如 "1-5" 或 "3,5,7" 或 None（扫描所有页）

        Returns:
            dict: 处理统计信息
        """
        input_path = Path(input_folder)
        output_path = Path(output_folder)

        if not input_path.exists():
            print(f"[ERROR] 输入文件夹不存在: {input_folder}")
            return {'success': 0, 'failed': 0}

        # 查找所有PDF文件
        pdf_files = list(input_path.glob('*.pdf'))

        if not pdf_files:
            print(f"[WARNING] 未找到PDF文件: {input_folder}")
            return {'success': 0, 'failed': 0}

        print(f"\n[SEARCH] 找到 {len(pdf_files)} 个PDF文件")
        if page_range:
            print(f"[INFO] 页面范围: {page_range}")
        else:
            print(f"[INFO] 将扫描每个PDF的所有页面")

        success_count = 0
        failed_count = 0

        for pdf_file in pdf_files:
            # 生成输出文件名
            output_file = output_path / f"{pdf_file.stem}.png"

            # 如果已存在，跳过
            if output_file.exists():
                print(f"[SKIP] 跳过（已存在）: {pdf_file.name}")
                continue

            # 处理
            if self.process_pdf(pdf_file, output_file, page_range):
                success_count += 1
            else:
                failed_count += 1

        return {'success': success_count, 'failed': failed_count}


def main():
    parser = argparse.ArgumentParser(description='PDF论文封面提取工具')
    parser.add_argument('--input', '-i', help='输入PDF文件路径')
    parser.add_argument('--output', '-o', help='输出图片路径')
    parser.add_argument('--batch', '-b', action='store_true', help='批量处理模式')
    parser.add_argument('--input-folder', default='images/raw-papers', help='批量处理输入文件夹')
    parser.add_argument('--output-folder', default='images/papers', help='批量处理输出文件夹')

    args = parser.parse_args()

    # 创建提取器
    extractor = PDFCoverExtractor()

    if args.batch:
        # 批量处理模式
        print("=" * 60)
        print("[DOCS] PDF封面批量提取")
        print("=" * 60)

        stats = extractor.batch_process(args.input_folder, args.output_folder)

        print("\n" + "=" * 60)
        print(f"[SUCCESS] 处理完成: {stats['success']} 成功, {stats['failed']} 失败")
        print("=" * 60)

    elif args.input and args.output:
        # 单文件处理模式
        print("=" * 60)
        print("[PDF] PDF封面提取")
        print("=" * 60)

        success = extractor.process_pdf(args.input, args.output)

        if success:
            print("\n[SUCCESS] 处理成功")
        else:
            print("\n[ERROR] 处理失败")
            sys.exit(1)

    else:
        parser.print_help()
        print("\n示例用法:")
        print("  单文件: python pdf_cover_extractor.py -i paper.pdf -o cover.png")
        print("  批量:   python pdf_cover_extractor.py --batch")


if __name__ == '__main__':
    main()
