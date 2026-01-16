"""
Content Formatter - AI-Assisted Interactive CLI
帮助用户通过AI智能格式化内容并添加到JSON配置文件

Usage:
    python content_formatter.py --type publication
    python content_formatter.py --type dataset
    python content_formatter.py --type award
    python content_formatter.py --type activity
"""

import os
import sys
import json
import argparse
import re
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    from openai import OpenAI
except ImportError as e:
    print(f"[ERROR] 导入失败: {e}")
    print("请安装: pip install -r requirements.txt")
    sys.exit(1)


class ContentFormatter:
    """内容格式化助手 - 交互式CLI + AI智能格式化"""

    def __init__(self, api_key=None, model=None):
        """初始化格式化器

        Args:
            api_key: OpenAI API密钥
            model: 使用的模型名称
        """
        # 加载环境变量（override=True强制使用.env文件覆盖系统环境变量）
        load_dotenv(override=True)

        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model or os.getenv('CONTENT_FORMAT_MODEL', 'gpt-4-turbo-preview')
        self.base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')

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
            print("[OK] AI服务已启用\n")
        else:
            self.client = None
            self.ai_enabled = False
            self.extra_headers = {}
            print("[WARNING] 未配置AI API，将使用手动模式\n")

        # 数据文件路径
        self.data_folder = Path('data')
        self.publications_file = self.data_folder / 'publications.json'
        self.datasets_file = self.data_folder / 'datasets.json'
        self.awards_file = self.data_folder / 'awards.json'
        self.activities_file = self.data_folder / 'activities.json'
        self.news_file = self.data_folder / 'news.json'

    # =============================================================================
    # AI格式化方法
    # =============================================================================

    def format_publication_with_ai(self, raw_input):
        """使用AI格式化论文信息

        Args:
            raw_input: 用户提供的原始论文信息

        Returns:
            dict: 格式化后的论文条目
        """
        if not self.ai_enabled:
            return None

        try:
            prompt = f"""将以下论文信息格式化为结构化JSON。

用户输入:
{raw_input}

请提取并格式化为以下JSON结构:
{{
    "title": "论文标题",
    "authors": ["Zhang Y†", "Li M*"],
    "author_note": "†co-first, *corresponding (如果有共同一作或通讯作者)",
    "venue": "期刊或会议名称",
    "year": 2025,
    "volume": "卷(期)" (如果有),
    "pages": "页码" (如果有),
    "type": "journal" or "conference",
    "status": "published" or "accepted" or "under_review",
    "badges": ["[AWARD] ESI Highly Cited Paper"] (如果有特殊标记),
    "doi": "10.xxxx/xxxx" (如果有)
}}

**重要提示**:
- authors数组中标记共同一作†和通讯作者*
- type必须是: journal/conference
- status必须是: published/accepted/under_review
- 如果信息不完整,留空字符串或空数组
- 只返回JSON,不要其他文字"""

            response = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的学术内容格式化助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=800
            )

            result_text = response.choices[0].message.content.strip()

            # 提取JSON
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            data = json.loads(result_text)

            print("[OK] AI格式化成功\n")
            return data

        except Exception as e:
            print(f"[WARNING] AI格式化失败: {e}\n")
            return None

    def format_dataset_with_ai(self, raw_input):
        """使用AI格式化数据集信息"""
        if not self.ai_enabled:
            return None

        try:
            prompt = f"""将以下数据集信息格式化为结构化JSON。

用户输入:
{raw_input}

请提取并格式化为以下JSON结构:
{{
    "name": "数据集名称",
    "description": "数据集描述（简短，1-2句话）",
    "downloads": 估计下载量（整数）,
    "icon": "🌍" (选择合适的emoji图标),
    "related_paper": "相关论文ID" (如果有),
    "figshare_url": "Figshare链接" (如果有),
    "github_url": "GitHub链接" (如果有),
    "documentation_url": "文档链接" (如果有)
}}

只返回JSON,不要其他文字。"""

            response = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的学术内容格式化助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=600
            )

            result_text = response.choices[0].message.content.strip()
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            data = json.loads(result_text)
            print("[OK] AI格式化成功\n")
            return data

        except Exception as e:
            print(f"[WARNING] AI格式化失败: {e}\n")
            return None

    def format_award_with_ai(self, raw_input):
        """使用AI格式化奖项信息"""
        if not self.ai_enabled:
            return None

        try:
            prompt = f"""将以下奖项信息格式化为结构化JSON。

用户输入:
{raw_input}

请提取并格式化为以下JSON结构:
{{
    "year": 2025,
    "name": "奖项名称",
    "organization": "颁发机构",
    "level": "national" or "international" or "university"
}}

只返回JSON,不要其他文字。"""

            response = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个专业的学术内容格式化助手。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=400
            )

            result_text = response.choices[0].message.content.strip()
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()

            data = json.loads(result_text)
            print("[OK] AI格式化成功\n")
            return data

        except Exception as e:
            print(f"[WARNING] AI格式化失败: {e}\n")
            return None

    # =============================================================================
    # JSON文件操作方法
    # =============================================================================

    def add_publication(self, pub_data):
        """添加论文到publications.json

        Args:
            pub_data: AI格式化后的论文数据

        Returns:
            dict: 完整的论文条目（包含自动生成的ID和路径）
        """
        # 生成ID
        title_words = pub_data.get('title', '').lower().split()[:3]
        pub_id = '_'.join(title_words) + f"_{pub_data.get('year', '')}"
        pub_id = re.sub(r'[^a-z0-9_]', '', pub_id)

        # 推断图片路径
        image_name = pub_id + '.png'

        # 构建完整条目
        publication = {
            "id": pub_id,
            "title": pub_data.get('title', ''),
            "authors": pub_data.get('authors', []),
            "author_note": pub_data.get('author_note', ''),
            "venue": pub_data.get('venue', ''),
            "year": pub_data.get('year', datetime.now().year),
            "volume": pub_data.get('volume', ''),
            "pages": pub_data.get('pages', ''),
            "type": pub_data.get('type', 'journal'),
            "status": pub_data.get('status', 'published'),
            "badges": pub_data.get('badges', []),
            "image": f"images/papers/{image_name}",
            "links": {
                "pdf": "#",
                "doi": f"https://doi.org/{pub_data.get('doi', '')}" if pub_data.get('doi') else "#"
            },
            "citation_key": pub_id,
            "added_date": datetime.now().strftime('%Y-%m-%d')
        }

        # 读取现有文件
        if self.publications_file.exists():
            with open(self.publications_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {"publications": []}

        # 检查重复
        existing_ids = [p['id'] for p in data['publications']]
        if publication['id'] in existing_ids:
            print(f"[WARNING] 论文ID已存在: {publication['id']}")
            choice = input("是否覆盖现有条目? (y/n): ").strip().lower()
            if choice != 'y':
                return None
            # 覆盖
            for i, p in enumerate(data['publications']):
                if p['id'] == publication['id']:
                    data['publications'][i] = publication
                    break
        else:
            # 添加新条目
            data['publications'].append(publication)

        # 保存
        with open(self.publications_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"[OK] 已添加论文: {publication['id']}")
        return publication

    def add_dataset(self, dataset_data):
        """添加数据集到datasets.json"""
        # 生成ID
        name_words = dataset_data.get('name', '').lower().split()[:2]
        dataset_id = '_'.join(name_words)
        dataset_id = re.sub(r'[^a-z0-9_]', '', dataset_id)

        # 构建完整条目
        dataset = {
            "id": dataset_id,
            "name": dataset_data.get('name', ''),
            "description": dataset_data.get('description', ''),
            "downloads": dataset_data.get('downloads', 0),
            "icon": dataset_data.get('icon', '📊'),
            "links": {
                "dataset": dataset_data.get('figshare_url', '#'),
                "paper": "#",
                "documentation": dataset_data.get('documentation_url', '#'),
                "github": dataset_data.get('github_url', '#')
            },
            "related_paper": dataset_data.get('related_paper', ''),
            "added_date": datetime.now().strftime('%Y-%m-%d')
        }

        # 读取并更新
        if self.datasets_file.exists():
            with open(self.datasets_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {"datasets": []}

        # 检查重复
        existing_ids = [d['id'] for d in data['datasets']]
        if dataset['id'] in existing_ids:
            print(f"[WARNING] 数据集ID已存在: {dataset['id']}")
            return None

        data['datasets'].append(dataset)

        # 保存
        with open(self.datasets_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"[OK] 已添加数据集: {dataset['id']}")
        return dataset

    def add_award(self, award_data):
        """添加奖项到awards.json"""
        award = {
            "year": award_data.get('year', datetime.now().year),
            "name": award_data.get('name', ''),
            "organization": award_data.get('organization', ''),
            "level": award_data.get('level', 'national'),
            "added_date": datetime.now().strftime('%Y-%m-%d')
        }

        # 读取并更新
        if self.awards_file.exists():
            with open(self.awards_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {"awards": []}

        data['awards'].append(award)

        # 按年份降序排序
        data['awards'].sort(key=lambda x: x['year'], reverse=True)

        # 保存
        with open(self.awards_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"[OK] 已添加奖项: {award['name']}")
        return award

    # =============================================================================
    # News生成方法
    # =============================================================================

    def generate_news_for_publication(self, publication):
        """为论文生成News条目"""
        status_text = {
            'published': 'was published in',
            'accepted': 'was accepted by',
            'under_review': 'was submitted to'
        }
        status = publication.get('status', 'published')

        news_content = f"Our paper on <em>{publication['title']}</em> {status_text.get(status, 'appeared in')} <em>{publication['venue']}</em>."

        news_item = {
            "id": f"news_{publication['id']}",
            "date": publication['added_date'],
            "content": news_content,
            "type": "publication",
            "related_id": publication['id'],
            "pinned": False,
            "auto_generated": True
        }

        return self._add_news_item(news_item)

    def generate_news_for_dataset(self, dataset):
        """为数据集生成News条目"""
        news_content = f"Released <em>{dataset['name']}</em> dataset with <strong>{dataset['downloads']}+</strong> downloads."

        news_item = {
            "id": f"news_{dataset['id']}",
            "date": dataset['added_date'],
            "content": news_content,
            "type": "dataset",
            "related_id": dataset['id'],
            "pinned": False,
            "auto_generated": True
        }

        return self._add_news_item(news_item)

    def generate_news_for_award(self, award):
        """为奖项生成News条目"""
        news_content = f"Received <em>{award['name']}</em> from {award['organization']}."

        news_item = {
            "id": f"news_award_{award['year']}_{award['name'][:20]}".lower().replace(' ', '_'),
            "date": award['added_date'],
            "content": news_content,
            "type": "award",
            "related_id": "",
            "pinned": False,
            "auto_generated": True
        }

        return self._add_news_item(news_item)

    def _add_news_item(self, news_item):
        """添加News条目到news.json"""
        # 读取现有news
        if self.news_file.exists():
            with open(self.news_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = {"news": []}

        # 检查重复
        existing_ids = [n['id'] for n in data['news']]
        if news_item['id'] in existing_ids:
            print(f"[INFO] News条目已存在")
            return False

        # 插入到非置顶news的开头
        pinned = [n for n in data['news'] if n.get('pinned', False)]
        regular = [n for n in data['news'] if not n.get('pinned', False)]

        regular.insert(0, news_item)
        data['news'] = pinned + regular

        # 保存
        with open(self.news_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"[OK] 已生成News条目")
        return True

    # =============================================================================
    # 交互式CLI方法
    # =============================================================================

    def interactive_publication(self):
        """交互式添加论文"""
        print("=" * 70)
        print("[DOCS] 添加新论文")
        print("=" * 70)
        print("请输入论文信息（可以粘贴引用、手动输入或自由文本）:\n")

        # 收集用户输入
        lines = []
        print("（输入完成后按Ctrl+D (Linux/Mac) 或 Ctrl+Z然后Enter (Windows)）")
        print("-" * 70)
        try:
            while True:
                line = input()
                lines.append(line)
        except EOFError:
            pass

        raw_input = '\n'.join(lines).strip()

        if not raw_input:
            print("[ERROR] 未输入任何内容")
            return

        print("\n正在使用AI格式化...\n")

        # AI格式化
        pub_data = self.format_publication_with_ai(raw_input)
        if not pub_data:
            print("[ERROR] AI格式化失败，请手动输入")
            return

        # 显示预览
        print("=" * 70)
        print("[PREVIEW] 格式化预览:")
        print("=" * 70)
        print(json.dumps(pub_data, ensure_ascii=False, indent=2))
        print("=" * 70)

        # 确认
        choice = input("\n是否添加到 publications.json? (y/n): ").strip().lower()
        if choice != 'y':
            print("已取消")
            return

        # 添加
        publication = self.add_publication(pub_data)
        if publication:
            self.generate_news_for_publication(publication)
            print("\n[SUCCESS] 论文添加完成！")
            print(f"\n[TIP] 下一步:")
            print(f"  1. 将论文PDF放入: images/raw-papers/")
            print(f"  2. 运行: python scripts/image_processor.py --papers")
            print(f"  3. 刷新网页查看效果")

    def interactive_dataset(self):
        """交互式添加数据集"""
        print("=" * 70)
        print("[DATA] 添加新数据集")
        print("=" * 70)
        print("请输入数据集信息:\n")

        lines = []
        print("（输入完成后按Ctrl+D (Linux/Mac) 或 Ctrl+Z然后Enter (Windows)）")
        print("-" * 70)
        try:
            while True:
                line = input()
                lines.append(line)
        except EOFError:
            pass

        raw_input = '\n'.join(lines).strip()

        if not raw_input:
            print("[ERROR] 未输入任何内容")
            return

        print("\n正在使用AI格式化...\n")

        # AI格式化
        dataset_data = self.format_dataset_with_ai(raw_input)
        if not dataset_data:
            print("[ERROR] AI格式化失败")
            return

        # 显示预览
        print("=" * 70)
        print("[PREVIEW] 格式化预览:")
        print("=" * 70)
        print(json.dumps(dataset_data, ensure_ascii=False, indent=2))
        print("=" * 70)

        # 确认
        choice = input("\n是否添加到 datasets.json? (y/n): ").strip().lower()
        if choice != 'y':
            print("已取消")
            return

        # 添加
        dataset = self.add_dataset(dataset_data)
        if dataset:
            self.generate_news_for_dataset(dataset)
            print("\n[SUCCESS] 数据集添加完成！")

    def interactive_award(self):
        """交互式添加奖项"""
        print("=" * 70)
        print("[AWARD] 添加新奖项")
        print("=" * 70)
        print("请输入奖项信息:\n")

        lines = []
        print("（输入完成后按Ctrl+D (Linux/Mac) 或 Ctrl+Z然后Enter (Windows)）")
        print("-" * 70)
        try:
            while True:
                line = input()
                lines.append(line)
        except EOFError:
            pass

        raw_input = '\n'.join(lines).strip()

        if not raw_input:
            print("[ERROR] 未输入任何内容")
            return

        print("\n正在使用AI格式化...\n")

        # AI格式化
        award_data = self.format_award_with_ai(raw_input)
        if not award_data:
            print("[ERROR] AI格式化失败")
            return

        # 显示预览
        print("=" * 70)
        print("[PREVIEW] 格式化预览:")
        print("=" * 70)
        print(json.dumps(award_data, ensure_ascii=False, indent=2))
        print("=" * 70)

        # 确认
        choice = input("\n是否添加到 awards.json? (y/n): ").strip().lower()
        if choice != 'y':
            print("已取消")
            return

        # 添加
        award = self.add_award(award_data)
        if award:
            self.generate_news_for_award(award)
            print("\n[SUCCESS] 奖项添加完成！")


def main():
    parser = argparse.ArgumentParser(
        description='AI辅助内容格式化工具',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python content_formatter.py --type publication   # 添加论文
  python content_formatter.py --type dataset       # 添加数据集
  python content_formatter.py --type award         # 添加奖项
        """
    )

    parser.add_argument('--type', '-t', required=True,
                        choices=['publication', 'dataset', 'award'],
                        help='内容类型')

    args = parser.parse_args()

    # 创建格式化器
    formatter = ContentFormatter()

    if not formatter.ai_enabled:
        print("[ERROR] 未配置AI API密钥")
        print("请配置 .env 文件中的 OPENAI_API_KEY")
        print("示例: cp .env.example .env")
        sys.exit(1)

    # 根据类型调用对应方法
    try:
        if args.type == 'publication':
            formatter.interactive_publication()
        elif args.type == 'dataset':
            formatter.interactive_dataset()
        elif args.type == 'award':
            formatter.interactive_award()

    except KeyboardInterrupt:
        print("\n\n[WARNING] 用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[ERROR] 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
