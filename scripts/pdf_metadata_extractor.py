"""
PDF Metadata Extractor - 论文元数据自动提取工具
从PDF自动提取论文信息、验证、格式化为APA引用并结构化为JSON

Usage:
    python pdf_metadata_extractor.py --input paper.pdf
    python pdf_metadata_extractor.py --batch  # 批量处理 images/raw-papers/
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from datetime import datetime

try:
    import fitz  # PyMuPDF
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError as e:
    print(f"[ERROR] 导入失败: {e}")
    print("请安装: pip install -r requirements.txt")
    sys.exit(1)


class PaperMetadataExtractor:
    """论文元数据提取器 - 使用AI提取并验证论文信息"""

    def __init__(self, api_key=None, model=None, base_url=None):
        """初始化提取器

        Args:
            api_key: OpenAI API密钥
            model: 使用的模型名称
            base_url: API基础URL
        """
        # 加载环境变量（override=True强制使用.env文件覆盖系统环境变量）
        load_dotenv(override=True)

        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model or os.getenv('CONTENT_FORMAT_MODEL', 'gpt-4-turbo-preview')
        self.base_url = base_url or os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')

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
            print("[OK] AI服务已启用")
        else:
            self.client = None
            self.ai_enabled = False
            self.extra_headers = {}
            print("[WARNING] 未配置AI API，将使用手动模式")

    def extract_text_from_pdf(self, pdf_path, max_pages=3):
        """从PDF提取前几页文本

        Args:
            pdf_path: PDF文件路径
            max_pages: 提取的最大页数

        Returns:
            str: 提取的文本
        """
        try:
            doc = fitz.open(pdf_path)
            total_pages = len(doc)  # Store page count before closing
            pages_to_extract = min(max_pages, total_pages)
            text = ""

            for page_num in range(pages_to_extract):
                page = doc[page_num]
                text += page.get_text()
                text += f"\n\n--- Page {page_num + 1} End ---\n\n"

            doc.close()

            print(f"[OK] 已提取前 {pages_to_extract} 页文本 ({len(text)} 字符)")
            return text

        except Exception as e:
            print(f"[ERROR] PDF文本提取失败: {e}")
            return None

    def parse_metadata_with_ai(self, text, pdf_filename):
        """使用AI解析论文元数据

        Args:
            text: PDF提取的文本
            pdf_filename: PDF文件名（用于提示）

        Returns:
            dict: 解析后的元数据
        """
        if not self.ai_enabled:
            return None

        try:
            prompt = f"""分析以下论文PDF提取的文本，识别并提取论文的关键元数据。

PDF文件名: {pdf_filename}

论文文本（前3页）:
{text[:4000]}  # 限制长度以节省token

请仔细阅读并提取以下信息：
1. **论文标题** (完整标题)
2. **作者列表** (所有作者，按顺序，标注共同一作†和通讯作者*)
3. **发表期刊/会议** (完整名称)
4. **发表年份**
5. **卷号和期号** (如果有)
6. **页码范围** (如果有)
7. **DOI** (如果有)
8. **论文类型** (journal/conference/preprint)
9. **发表状态** (published/accepted/under_review)

返回JSON格式，示例：
{{
    "title": "CMAB: A Multi-Attribute Building Dataset of China",
    "authors": ["Zhang Y†", "Zhao H†", "Long Y*"],
    "author_note": "†co-first, *corresponding",
    "venue": "Scientific Data",
    "year": 2025,
    "volume": "12(1)",
    "pages": "430",
    "doi": "10.1038/s41597-025-04266-w",
    "type": "journal",
    "status": "published",
    "confidence": "high",
    "notes": "Any additional notes or uncertainties"
}}

**重要提示**：
- 如果信息不确定，在notes字段说明
- 作者名字保留原格式（如 Zhang Y），标注共同一作和通讯作者
- DOI格式为 10.xxxx/xxxx
- confidence可以是: high/medium/low

只返回JSON，不要其他文字。"""

            # 调用OpenAI
            response = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的学术论文元数据提取助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # 低温度以提高准确性
                max_tokens=800
            )

            # 解析响应
            result_text = response.choices[0].message.content.strip()

            # 提取JSON
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            metadata = json.loads(result_text)

            print(f"[OK] AI提取成功 (置信度: {metadata.get('confidence', 'unknown')})")
            if metadata.get('notes'):
                print(f"  备注: {metadata['notes']}")

            return metadata

        except Exception as e:
            print(f"[WARNING] AI解析失败: {e}")
            return None

    def verify_metadata_online(self, metadata):
        """在线验证元数据（通过DOI或标题搜索）

        Args:
            metadata: 待验证的元数据

        Returns:
            dict: 验证后的元数据
        """
        # 这里可以集成CrossRef API、Google Scholar API等
        # 当前版本先跳过在线验证，返回AI提取的结果
        print("[INFO] 在线验证功能待实现（可通过CrossRef API或DOI.org）")

        # 添加验证标记
        metadata['verified_online'] = False

        return metadata

    def format_as_apa(self, metadata):
        """格式化为APA引用格式

        Args:
            metadata: 论文元数据

        Returns:
            str: APA格式引用
        """
        try:
            # 作者部分
            authors = ', '.join(metadata.get('authors', []))

            # 年份
            year = metadata.get('year', 'n.d.')

            # 标题
            title = metadata.get('title', 'Unknown title')

            # 期刊/会议
            venue = metadata.get('venue', '')

            # 卷号和页码
            volume = metadata.get('volume', '')
            pages = metadata.get('pages', '')

            # DOI
            doi = metadata.get('doi', '')

            # 构建APA引用
            apa = f"{authors} ({year}). {title}."

            if venue:
                apa += f" {venue}"

            if volume:
                apa += f", {volume}"

            if pages:
                apa += f", {pages}"

            apa += "."

            if doi:
                apa += f" https://doi.org/{doi}"

            return apa

        except Exception as e:
            print(f"[WARNING] APA格式化失败: {e}")
            return "格式化失败"

    def structure_to_json(self, metadata, pdf_filename):
        """结构化为publications.json格式

        Args:
            metadata: 元数据
            pdf_filename: PDF文件名

        Returns:
            dict: publications.json条目
        """
        # 生成ID（从标题生成）
        title_words = metadata.get('title', '').lower().split()[:3]
        pub_id = '_'.join(title_words) + f"_{metadata.get('year', '')}"
        pub_id = re.sub(r'[^a-z0-9_]', '', pub_id)

        # 推断图片路径和PDF路径
        image_name = Path(pdf_filename).stem + '.png'
        pdf_name = Path(pdf_filename).name

        # 构建JSON结构
        publication = {
            "id": pub_id,
            "title": metadata.get('title', ''),
            "authors": metadata.get('authors', []),
            "author_note": metadata.get('author_note', ''),
            "venue": metadata.get('venue', ''),
            "year": metadata.get('year', datetime.now().year),
            "volume": metadata.get('volume', ''),
            "pages": metadata.get('pages', ''),
            "type": metadata.get('type', 'journal'),
            "status": metadata.get('status', 'published'),
            "badges": [],
            "image": f"images/papers/{image_name}",
            "links": {
                "pdf": f"pdfs/{pdf_name}",
                "doi": f"https://doi.org/{metadata.get('doi', '')}" if metadata.get('doi') else "#"
            },
            "citation_key": pub_id,
            "added_date": datetime.now().strftime('%Y-%m-%d'),
            "_metadata": {
                "extracted_by": "AI",
                "confidence": metadata.get('confidence', 'unknown'),
                "verified_online": metadata.get('verified_online', False),
                "notes": metadata.get('notes', '')
            }
        }

        return publication

    def add_to_publications_file(self, publication, publications_file='data/publications.json'):
        """添加到publications.json文件

        Args:
            publication: 论文条目
            publications_file: publications.json路径

        Returns:
            bool: 是否成功
        """
        try:
            # 读取现有文件
            if Path(publications_file).exists():
                with open(publications_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                data = {"publications": []}

            # 检查是否已存在（通过ID或标题）
            existing_ids = [p['id'] for p in data['publications']]
            existing_titles = [p['title'].lower() for p in data['publications']]

            if publication['id'] in existing_ids:
                print(f"[WARNING] 论文ID已存在: {publication['id']}")
                # 更新而不是添加
                for i, p in enumerate(data['publications']):
                    if p['id'] == publication['id']:
                        data['publications'][i] = publication
                        print(f"[OK] 已更新现有论文条目")
                        break
            elif publication['title'].lower() in existing_titles:
                print(f"[WARNING] 论文标题已存在，跳过添加")
                return False
            else:
                # 添加新条目
                data['publications'].append(publication)
                print(f"[OK] 已添加新论文条目")

            # 保存文件
            with open(publications_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            return True

        except Exception as e:
            print(f"[ERROR] 添加到publications.json失败: {e}")
            return False

    def generate_news_entry(self, publication, news_file='data/news.json'):
        """生成并添加对应的News条目

        Args:
            publication: 论文信息
            news_file: news.json路径

        Returns:
            bool: 是否成功
        """
        try:
            # 读取现有news
            if Path(news_file).exists():
                with open(news_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                data = {"news": []}

            # 生成news内容
            status_text = {
                'published': 'was published in',
                'accepted': 'was accepted by',
                'under_review': 'was submitted to'
            }
            status = publication.get('status', 'published')

            news_content = f"Our paper on <em>{publication['title']}</em> {status_text.get(status, 'appeared in')} <em>{publication['venue']}</em>."

            # 创建news条目
            news_item = {
                "id": f"news_{publication['id']}",
                "date": publication['added_date'],
                "content": news_content,
                "type": "publication",
                "related_id": publication['id'],
                "pinned": False,
                "auto_generated": True
            }

            # 检查是否已存在
            existing_ids = [n['id'] for n in data['news']]
            if news_item['id'] not in existing_ids:
                # 插入到非置顶news的开头（置顶的保持在最前）
                pinned = [n for n in data['news'] if n.get('pinned', False)]
                regular = [n for n in data['news'] if not n.get('pinned', False)]

                regular.insert(0, news_item)
                data['news'] = pinned + regular

                # 保存
                with open(news_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                print(f"[OK] 已生成News条目")
                return True
            else:
                print(f"[INFO] News条目已存在")
                return False

        except Exception as e:
            print(f"[WARNING] 生成News失败: {e}")
            return False

    def process_pdf(self, pdf_path, auto_add=True):
        """处理单个PDF文件（完整流程）

        Args:
            pdf_path: PDF文件路径
            auto_add: 是否自动添加到publications.json

        Returns:
            dict: 提取的论文信息
        """
        print(f"\n{'='*70}")
        print(f"[PDF] 处理PDF: {Path(pdf_path).name}")
        print(f"{'='*70}")

        # 1. 提取文本
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            print("[ERROR] 无法提取PDF文本")
            return None

        # 2. AI解析元数据
        metadata = self.parse_metadata_with_ai(text, Path(pdf_path).name)
        if not metadata:
            print("[ERROR] 无法解析元数据")
            return None

        # 3. 在线验证（当前版本跳过）
        metadata = self.verify_metadata_online(metadata)

        # 4. 格式化APA引用
        apa_citation = self.format_as_apa(metadata)
        print(f"\n[APA] APA引用:\n{apa_citation}\n")

        # 5. 结构化为JSON
        publication = self.structure_to_json(metadata, Path(pdf_path).name)

        # 6. 显示预览
        print(f"[PREVIEW] 结构化预览:")
        print(json.dumps(publication, ensure_ascii=False, indent=2))

        # 7. 自动添加或询问
        if auto_add:
            if self.add_to_publications_file(publication):
                self.generate_news_entry(publication)
        else:
            response = input("\n是否添加到 publications.json? (y/n): ").strip().lower()
            if response == 'y':
                if self.add_to_publications_file(publication):
                    self.generate_news_entry(publication)

        print(f"\n{'='*70}")
        return publication

    def batch_process(self, input_folder='images/raw-papers', auto_add=True):
        """批量处理文件夹中的所有PDF

        Args:
            input_folder: 输入文件夹
            auto_add: 是否自动添加

        Returns:
            list: 处理结果列表
        """
        input_path = Path(input_folder)

        if not input_path.exists():
            print(f"[ERROR] 文件夹不存在: {input_folder}")
            return []

        # 查找所有PDF文件
        pdf_files = list(input_path.glob('*.pdf')) + list(input_path.glob('*.PDF'))

        if not pdf_files:
            print(f"[WARNING] 未找到PDF文件: {input_folder}")
            return []

        print(f"\n[SEARCH] 找到 {len(pdf_files)} 个PDF文件")

        results = []
        for pdf_file in pdf_files:
            result = self.process_pdf(pdf_file, auto_add=auto_add)
            results.append(result)

        # 统计
        success = sum(1 for r in results if r is not None)

        print(f"\n{'='*70}")
        print(f"[STATS] 批量处理完成")
        print(f"{'='*70}")
        print(f"  成功: {success}/{len(pdf_files)}")
        print(f"{'='*70}")

        return results


def main():
    parser = argparse.ArgumentParser(description='PDF论文元数据自动提取工具')
    parser.add_argument('--input', '-i', help='输入PDF路径')
    parser.add_argument('--batch', '-b', action='store_true', help='批量处理模式')
    parser.add_argument('--input-folder', default='images/raw-papers', help='批量处理输入文件夹')
    parser.add_argument('--no-auto-add', action='store_true', help='不自动添加，每个都询问')

    args = parser.parse_args()

    # 创建提取器
    extractor = PaperMetadataExtractor()

    if not extractor.ai_enabled:
        print("\n[ERROR] 未配置AI API密钥")
        print("请配置 .env 文件中的 OPENAI_API_KEY")
        print("示例: cp .env.example .env")
        sys.exit(1)

    if args.batch:
        # 批量处理模式
        print("="* 70)
        print("[INFO] PDF论文元数据自动提取 - 批量模式")
        print("=" * 70)

        extractor.batch_process(
            args.input_folder,
            auto_add=not args.no_auto_add
        )

    elif args.input:
        # 单文件处理模式
        extractor.process_pdf(args.input, auto_add=not args.no_auto_add)

    else:
        parser.print_help()
        print("\n示例用法:")
        print("  单文件: python pdf_metadata_extractor.py -i paper.pdf")
        print("  批量:   python pdf_metadata_extractor.py --batch")
        print("  手动确认: python pdf_metadata_extractor.py --batch --no-auto-add")


if __name__ == '__main__':
    main()
