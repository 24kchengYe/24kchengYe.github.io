"""
Batch PDF Processor - 批量PDF处理器
自动处理raw-papers文件夹中的PDF：提取元数据、生成首页缩略图、更新publications.json

Usage:
    python batch_processor.py  # 处理所有未处理的PDF
    python batch_processor.py --force  # 重新处理所有PDF（覆盖现有条目）
"""

import os
import sys
import json
import argparse
import shutil
from pathlib import Path
from datetime import datetime

# 导入已有的处理器
try:
    from pdf_metadata_extractor import PaperMetadataExtractor
    from pdf_cover_extractor import PDFCoverExtractor
    from dotenv import load_dotenv
except ImportError as e:
    print(f"[ERROR] 导入失败: {e}")
    print("请确保在scripts目录运行此脚本")
    sys.exit(1)


class BatchPDFProcessor:
    """批量PDF处理器 - 整合元数据提取和图片生成"""

    def __init__(self, force_reprocess=False):
        """初始化处理器

        Args:
            force_reprocess: 是否强制重新处理已存在的条目
        """
        # 加载环境变量
        load_dotenv(override=True)

        # 初始化子处理器
        self.metadata_extractor = PaperMetadataExtractor()
        self.cover_extractor = PDFCoverExtractor()
        self.force_reprocess = force_reprocess

        # 定义路径
        self.input_folder = Path('images/raw-papers')
        self.output_images_folder = Path('images/papers')
        self.output_pdfs_folder = Path('pdfs')
        self.publications_file = Path('data/publications.json')

        # 确保文件夹存在
        self.input_folder.mkdir(parents=True, exist_ok=True)
        self.output_images_folder.mkdir(parents=True, exist_ok=True)
        self.output_pdfs_folder.mkdir(parents=True, exist_ok=True)
        self.publications_file.parent.mkdir(parents=True, exist_ok=True)

    def load_existing_publications(self):
        """加载现有的publications.json

        Returns:
            dict: publications数据，如果不存在则返回空结构
        """
        if self.publications_file.exists():
            try:
                with open(self.publications_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                print(f"[OK] 已加载现有publications.json ({len(data.get('publications', []))} 篇论文)")
                return data
            except Exception as e:
                print(f"[WARNING] 读取publications.json失败: {e}")
                return {"publications": []}
        else:
            print("[INFO] publications.json不存在，将创建新文件")
            return {"publications": []}

    def is_pdf_already_processed(self, pdf_filename, publications_data):
        """检查PDF是否已处理

        Args:
            pdf_filename: PDF文件名
            publications_data: 现有publications数据

        Returns:
            tuple: (是否已处理, 现有条目索引或None)
        """
        # 根据PDF文件名生成预期的图片名
        expected_image_name = Path(pdf_filename).stem + '.png'
        expected_image_path = f"images/papers/{expected_image_name}"

        # 检查是否有条目使用了这个图片路径
        for idx, pub in enumerate(publications_data['publications']):
            if pub.get('image') == expected_image_path:
                return True, idx

        # 也检查PDF链接是否匹配
        expected_pdf_link = f"pdfs/{Path(pdf_filename).name}"
        for idx, pub in enumerate(publications_data['publications']):
            if pub.get('links', {}).get('pdf') == expected_pdf_link:
                return True, idx

        return False, None

    def process_single_pdf(self, pdf_path, publications_data):
        """处理单个PDF文件

        Args:
            pdf_path: PDF文件路径
            publications_data: 现有publications数据

        Returns:
            dict: 新生成的publication条目，或None（如果失败或跳过）
        """
        pdf_filename = pdf_path.name
        print(f"\n{'='*70}")
        print(f"[PDF] 处理: {pdf_filename}")

        # 1. 检查是否已处理
        is_processed, existing_idx = self.is_pdf_already_processed(pdf_filename, publications_data)

        if is_processed and not self.force_reprocess:
            print(f"[SKIP] 该PDF已处理过，跳过（索引: {existing_idx}）")
            print(f"   提示: 使用 --force 参数可强制重新处理")
            return None

        if is_processed and self.force_reprocess:
            print(f"[INFO] 强制重新处理模式，将覆盖现有条目（索引: {existing_idx}）")

        # 2. 提取元数据
        print("\n[STEP 1/3] 提取论文元数据...")
        text = self.metadata_extractor.extract_text_from_pdf(pdf_path)
        if not text:
            print("[ERROR] 无法提取PDF文本，跳过此文件")
            return None

        metadata = self.metadata_extractor.parse_metadata_with_ai(text, pdf_filename)
        if not metadata:
            print("[ERROR] 无法解析元数据，跳过此文件")
            return None

        # 3. 生成首页缩略图
        print("\n[STEP 2/3] 生成首页缩略图...")
        output_image_path = self.output_images_folder / f"{pdf_path.stem}.png"

        success = self.cover_extractor.process_pdf(
            pdf_path=str(pdf_path),
            output_path=str(output_image_path),
            page_range="1"  # 只提取首页
        )

        if not success:
            print("[WARNING] 缩略图生成失败，但元数据已提取，将继续")

        # 4. 复制PDF到下载目录
        print("\n[STEP 3/3] 复制PDF到下载目录...")
        pdf_copy_path = self.output_pdfs_folder / pdf_filename
        if pdf_copy_path.exists():
            print(f"[INFO] PDF已存在于下载目录: {pdf_copy_path}")
        else:
            try:
                shutil.copy2(pdf_path, pdf_copy_path)
                print(f"[OK] PDF已复制至: {pdf_copy_path}")
            except Exception as e:
                print(f"[WARNING] PDF复制失败: {e}")

        # 5. 格式化为publications.json条目
        metadata = self.metadata_extractor.verify_metadata_online(metadata)
        publication = self.metadata_extractor.structure_to_json(metadata, pdf_filename)

        # 6. 显示APA引用
        apa_citation = self.metadata_extractor.format_as_apa(metadata)
        try:
            print(f"\n[APA] 引用格式:\n{apa_citation}\n")
        except UnicodeEncodeError:
            # Windows GBK console encoding issue - use ASCII-safe version
            print(f"\n[APA] 引用格式:\n{apa_citation.encode('ascii', 'replace').decode('ascii')}\n")

        # 7. 显示JSON预览
        print(f"[JSON] 生成的条目:")
        try:
            print(json.dumps(publication, ensure_ascii=False, indent=2))
        except UnicodeEncodeError:
            # Fallback to ASCII-safe JSON
            print(json.dumps(publication, ensure_ascii=True, indent=2))

        print(f"{'='*70}\n")

        return publication

    def save_publications(self, publications_data):
        """保存publications.json

        Args:
            publications_data: 更新后的publications数据

        Returns:
            bool: 是否成功
        """
        try:
            with open(self.publications_file, 'w', encoding='utf-8') as f:
                json.dump(publications_data, f, ensure_ascii=False, indent=2)
            print(f"[OK] 已保存到 {self.publications_file}")
            return True
        except Exception as e:
            print(f"[ERROR] 保存publications.json失败: {e}")
            return False

    def batch_process(self):
        """批量处理所有PDF

        Returns:
            dict: 处理统计信息
        """
        print("="*70)
        print("[INFO] 批量PDF处理器")
        print("="*70)

        # 加载现有数据
        publications_data = self.load_existing_publications()

        # 查找所有PDF文件
        pdf_files = list(self.input_folder.glob('*.pdf')) + list(self.input_folder.glob('*.PDF'))

        if not pdf_files:
            print(f"\n[WARNING] 未找到PDF文件: {self.input_folder}")
            print(f"请将PDF文件放入 {self.input_folder.absolute()} 文件夹")
            return {'success': 0, 'skipped': 0, 'failed': 0}

        print(f"\n[SEARCH] 找到 {len(pdf_files)} 个PDF文件")
        if self.force_reprocess:
            print("[MODE] 强制重新处理模式")
        else:
            print("[MODE] 智能跳过已处理文件")

        # 统计
        success_count = 0
        skipped_count = 0
        failed_count = 0
        new_publications = []

        # 处理每个PDF
        for pdf_file in pdf_files:
            result = self.process_single_pdf(pdf_file, publications_data)

            if result is None:
                # 检查是否是跳过还是失败
                is_processed, _ = self.is_pdf_already_processed(pdf_file.name, publications_data)
                if is_processed:
                    skipped_count += 1
                else:
                    failed_count += 1
            else:
                new_publications.append(result)
                success_count += 1

        # 更新publications.json
        if new_publications:
            print(f"\n{'='*70}")
            print(f"[UPDATE] 更新publications.json...")

            if self.force_reprocess:
                # 强制模式：移除旧条目并添加新条目
                # 创建一个映射：图片路径 -> 新条目
                new_pub_map = {pub['image']: pub for pub in new_publications}

                # 过滤掉被替换的旧条目
                updated_pubs = []
                replaced_count = 0
                for old_pub in publications_data['publications']:
                    if old_pub['image'] not in new_pub_map:
                        updated_pubs.append(old_pub)
                    else:
                        replaced_count += 1

                # 添加所有新条目
                updated_pubs.extend(new_publications)
                publications_data['publications'] = updated_pubs

                print(f"[INFO] 替换了 {replaced_count} 个旧条目")
                print(f"[INFO] 添加了 {len(new_publications)} 个新条目")
            else:
                # 普通模式：只添加新条目
                publications_data['publications'].extend(new_publications)
                print(f"[INFO] 添加了 {len(new_publications)} 个新条目")

            # 保存
            if self.save_publications(publications_data):
                # 生成对应的News条目
                print(f"\n[NEWS] 生成News条目...")
                for pub in new_publications:
                    try:
                        self.metadata_extractor.generate_news_entry(pub)
                    except Exception as e:
                        print(f"[WARNING] 生成News失败: {e}")

        # 输出统计
        print(f"\n{'='*70}")
        print(f"[STATS] 批量处理完成")
        print(f"{'='*70}")
        print(f"  总计: {len(pdf_files)} 个PDF")
        print(f"  成功: {success_count}")
        print(f"  跳过: {skipped_count}")
        print(f"  失败: {failed_count}")
        print(f"{'='*70}")

        return {
            'success': success_count,
            'skipped': skipped_count,
            'failed': failed_count
        }


def main():
    parser = argparse.ArgumentParser(description='批量PDF处理器 - 自动提取元数据和生成缩略图')
    parser.add_argument('--force', '-f', action='store_true', help='强制重新处理所有PDF（覆盖现有条目）')

    args = parser.parse_args()

    # 创建处理器
    processor = BatchPDFProcessor(force_reprocess=args.force)

    # 检查AI是否可用
    if not processor.metadata_extractor.ai_enabled:
        print("\n[ERROR] 未配置AI API密钥")
        print("请配置 .env 文件中的 OPENAI_API_KEY")
        print("示例:")
        print("  1. 复制: cp .env.example .env")
        print("  2. 编辑 .env 文件填入API密钥")
        sys.exit(1)

    # 执行批量处理
    stats = processor.batch_process()

    # 根据结果设置退出状态
    if stats['failed'] > 0 and stats['success'] == 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
