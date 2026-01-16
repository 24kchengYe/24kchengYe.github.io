"""
Image Processor - 主图片处理脚本
整合PDF封面提取和头像裁剪功能

Usage:
    python image_processor.py --papers    # 处理论文封面
    python image_processor.py --avatar    # 处理头像
    python image_processor.py --all       # 处理所有图片
"""

import os
import sys
import argparse
from pathlib import Path

# 添加当前目录到路径
sys.path.insert(0, str(Path(__file__).parent))

try:
    from pdf_cover_extractor import PDFCoverExtractor
    from ai_image_analyzer import AvatarCropper
    from pdf_metadata_extractor import PaperMetadataExtractor
except ImportError as e:
    print(f"[ERROR] 导入失败: {e}")
    print("请确保所有处理脚本在同一目录")
    sys.exit(1)


class ImageProcessor:
    """主图片处理类 - 统一管理所有图片处理任务"""

    def __init__(self, extract_metadata=True):
        """初始化处理器

        Args:
            extract_metadata: 是否同时提取论文元数据
        """
        self.pdf_extractor = PDFCoverExtractor()
        self.avatar_cropper = AvatarCropper()
        self.metadata_extractor = PaperMetadataExtractor() if extract_metadata else None

        # 设置路径
        self.raw_papers_folder = Path('images/raw-papers')
        self.papers_folder = Path('images/papers')
        self.raw_avatars_folder = Path('images/raw-avatars')
        self.avatar_output = Path('images/profile.jpg')

        # 元数据提取选项
        self.extract_metadata = extract_metadata

    def ensure_folders(self):
        """确保必要的文件夹存在"""
        folders = [
            self.raw_papers_folder,
            self.papers_folder,
            self.raw_avatars_folder,
            Path('images')
        ]

        for folder in folders:
            if not folder.exists():
                folder.mkdir(parents=True, exist_ok=True)
                print(f"[OK] 创建文件夹: {folder}")

    def process_papers(self, auto_add_metadata=True, page_range=None):
        """处理论文封面和元数据

        Args:
            auto_add_metadata: 是否自动添加元数据到publications.json
            page_range: 页面范围，如 "1-5" 或 "3,5,7" 或 None（扫描所有页）

        Returns:
            bool: 是否成功
        """
        print("\n" + "=" * 70)
        if self.extract_metadata and self.metadata_extractor and self.metadata_extractor.ai_enabled:
            print("[DOCS] 论文处理（封面提取 + 元数据提取）")
        else:
            print("[DOCS] 论文封面自动提取")
        print("=" * 70)

        if not self.raw_papers_folder.exists():
            print(f"[ERROR] 文件夹不存在: {self.raw_papers_folder}")
            print(f"   请创建文件夹并放入PDF文件")
            return False

        # 1. 批量提取封面
        stats = self.pdf_extractor.batch_process(
            self.raw_papers_folder,
            self.papers_folder,
            page_range
        )

        print("\n" + "=" * 70)
        if stats['success'] > 0:
            print(f"[SUCCESS] 成功处理 {stats['success']} 个PDF封面")
            if stats['failed'] > 0:
                print(f"[WARNING] 失败 {stats['failed']} 个")
        else:
            print("[INFO] 没有需要处理的PDF文件")
        print("=" * 70)

        # 2. 如果启用元数据提取，处理元数据
        if self.extract_metadata and self.metadata_extractor and self.metadata_extractor.ai_enabled:
            print("\n" + "=" * 70)
            print("[PREVIEW] 开始提取论文元数据...")
            print("=" * 70)

            self.metadata_extractor.batch_process(
                self.raw_papers_folder,
                auto_add=auto_add_metadata
            )

        return True

    def process_avatar(self):
        """处理头像"""
        print("\n" + "=" * 70)
        print("[PHOTO] 头像智能裁剪")
        print("=" * 70)

        if not self.raw_avatars_folder.exists():
            print(f"[ERROR] 文件夹不存在: {self.raw_avatars_folder}")
            print(f"   请创建文件夹并放入照片")
            return False

        # 批量处理（选择最新的图片）
        success = self.avatar_cropper.batch_process(self.raw_avatars_folder)

        print("\n" + "=" * 70)
        if success:
            print(f"[SUCCESS] 头像已保存至: {self.avatar_output}")
        else:
            print("[ERROR] 头像处理失败")
        print("=" * 70)

        return success

    def process_all(self, page_range=None):
        """处理所有图片

        Args:
            page_range: 页面范围，如 "1-5" 或 "3,5,7" 或 None（扫描所有页）
        """
        print("\n" + "[ART] " * 15)
        print("           自动化图片处理 - 全部模式")
        print("[ART] " * 15)

        # 确保文件夹存在
        self.ensure_folders()

        # 处理论文封面
        papers_ok = self.process_papers(page_range=page_range)

        # 处理头像
        avatar_ok = self.process_avatar()

        # 总结
        print("\n" + "=" * 70)
        print("[STATS] 处理总结")
        print("=" * 70)
        print(f"  论文封面: {'[SUCCESS] 完成' if papers_ok else '[ERROR] 失败'}")
        print(f"  头像裁剪: {'[SUCCESS] 完成' if avatar_ok else '[ERROR] 失败'}")
        print("=" * 70)

        return papers_ok and avatar_ok

    def show_guide(self):
        """显示使用指南"""
        guide = """
╔══════════════════════════════════════════════════════════════════════╗
║                      [DOCS] 图片自动处理工具使用指南                  ║
╚══════════════════════════════════════════════════════════════════════╝

【功能介绍】
  本工具提供三项自动化处理功能：
  1. [PDF] PDF论文封面提取 - 自动识别代表性图片并裁剪
  2. [DATA] PDF论文元数据提取 - AI提取论文信息并结构化
  3. [PHOTO] 头像智能裁剪 - 自动识别人脸并裁剪为正方形

【使用步骤】

┌─ 处理论文（封面+元数据） ─────────────────────────────────┐
│ 1. 将PDF论文放入文件夹: images/raw-papers/                  │
│ 2. 运行命令:                                                │
│    python scripts/image_processor.py --papers               │
│    或指定页面范围:                                          │
│    python scripts/image_processor.py --papers --page-range "1-5" │
│    python scripts/image_processor.py --papers --page-range "1,3,5" │
│ 3. 自动完成:                                                │
│    [OK] AI从指定页面或所有页面中选择最佳封面               │
│    [OK] 提取代表性图片保存到 images/papers/                 │
│    [OK] AI提取论文元数据（标题、作者、期刊等）             │
│    [OK] 自动添加到 data/publications.json                   │
│    [OK] 自动生成News条目                                    │
│                                                             │
│ [TIP] 提示: 只需放入PDF，连论文信息都不用手动输入！        │
└─────────────────────────────────────────────────────────────┘

┌─ 处理头像 ─────────────────────────────────────────────────┐
│ 1. 将照片放入文件夹: images/raw-avatars/                    │
│ 2. 运行命令: python scripts/image_processor.py --avatar    │
│ 3. 生成的头像保存为: images/profile.jpg                     │
│                                                             │
│ [TIP] 提示: 如有多张照片，工具会自动选择最新的一张            │
└─────────────────────────────────────────────────────────────┘

┌─ 一次性处理所有 ───────────────────────────────────────────┐
│ 运行命令: python scripts/image_processor.py --all          │
│                                                             │
│ 将同时处理论文封面和头像                                    │
└─────────────────────────────────────────────────────────────┘

【配置说明】

  [CONFIG] 需要配置 .env 文件以使用AI图片识别功能：

  1. 复制模板: cp .env.example .env
  2. 编辑 .env 文件，填入OpenAI API密钥:
     OPENAI_API_KEY=your_api_key_here

  如果不配置API，工具会使用默认裁剪策略（仍可用）

【可选功能】

  [TOOL] 使用OpenCV本地人脸检测（无需API）:
     python scripts/ai_image_analyzer.py --batch --use-opencv

  需要先安装: pip install opencv-python

【常见问题】

  Q: API调用失败怎么办？
  A: 工具会自动回退到默认裁剪策略，仍可生成图片

  Q: 生成的封面不理想？
  A: 可手动编辑 images/papers/ 中的图片，或放入不同的PDF

  Q: 头像位置不准确？
  A: 尝试使用 --use-opencv 选项，或手动裁剪照片

╔══════════════════════════════════════════════════════════════════════╗
║  [TIP] 提示: 首次运行前请确保已安装依赖                              ║
║      pip install -r scripts/requirements.txt                         ║
╚══════════════════════════════════════════════════════════════════════╝
"""
        print(guide)


def main():
    parser = argparse.ArgumentParser(
        description='图片自动处理工具 - 论文封面提取 & 头像裁剪',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python image_processor.py --papers                    # 仅处理论文封面（扫描所有页）
  python image_processor.py --papers --page-range "1-5" # 仅扫描PDF的第1-5页
  python image_processor.py --avatar                    # 仅处理头像
  python image_processor.py --all                       # 处理所有图片
  python image_processor.py --all --page-range "1,3,5"  # 处理所有图片，指定页面
  python image_processor.py --guide                     # 显示使用指南
        """
    )

    parser.add_argument('--papers', action='store_true', help='处理论文（封面+元数据）')
    parser.add_argument('--avatar', action='store_true', help='处理头像')
    parser.add_argument('--all', action='store_true', help='处理所有')
    parser.add_argument('--no-metadata', action='store_true', help='仅提取封面，不提取元数据')
    parser.add_argument('--page-range', type=str, help='指定扫描页面范围，如 "1-5" 或 "1,3,5" 或不指定则扫描所有页')
    parser.add_argument('--guide', action='store_true', help='显示使用指南')

    args = parser.parse_args()

    # 创建处理器（根据参数决定是否提取元数据）
    processor = ImageProcessor(extract_metadata=not args.no_metadata)

    # 如果没有指定任何选项，显示帮助
    if not (args.papers or args.avatar or args.all or args.guide):
        parser.print_help()
        print("\n[TIP] 使用 --guide 查看详细使用指南")
        return

    # 显示指南
    if args.guide:
        processor.show_guide()
        return

    # 执行处理
    try:
        if args.all:
            processor.process_all(page_range=args.page_range)
        else:
            if args.papers:
                processor.process_papers(page_range=args.page_range)
            if args.avatar:
                processor.process_avatar()

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
