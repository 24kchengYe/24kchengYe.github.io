# 批量PDF处理指南

## 概述

批量处理器（`batch_processor.py`）可以自动完成从PDF到网站发布的完整流程：

1. **提取PDF元数据** - 使用AI识别论文标题、作者、期刊、年份等信息
2. **生成首页缩略图** - 保存完整的PDF首页作为400×300的缩略图
3. **更新publications.json** - 自动添加新论文条目
4. **生成News条目** - 自动创建论文发表新闻
5. **智能去重** - 跳过已处理的PDF文件

## 快速开始

### 1. 准备工作

确保已安装依赖并配置API密钥：

```bash
# 安装依赖
pip install -r scripts/requirements.txt

# 配置API密钥
cp .env.example .env
# 编辑 .env 文件填入你的OpenAI API密钥
```

### 2. 放置PDF文件

将待处理的论文PDF文件放入 `images/raw-papers/` 文件夹：

```
images/raw-papers/
├── paper1.pdf
├── paper2.pdf
└── paper3.pdf
```

### 3. 运行批量处理

```bash
cd "D:\pythonPycharms\工具开发\046个人主页"
python scripts/batch_processor.py
```

**处理过程**：

```
======================================================================
[INFO] 批量PDF处理器
======================================================================
[OK] 已加载现有publications.json (15 篇论文)

[SEARCH] 找到 3 个PDF文件
[MODE] 智能跳过已处理文件

======================================================================
[PDF] 处理: paper1.pdf

[STEP 1/3] 提取论文元数据...
[OK] 已提取前 3 页文本 (12450 字符)
[OK] AI提取成功 (置信度: high)

[STEP 2/3] 生成首页缩略图...
[INFO] 跳过AI智能裁剪，将保存完整PDF首页
[INFO] 使用完整PDF首页 (2481x3508)
[OK] 已调整为 400x300（保持宽高比，居中显示）
[OK] 已保存封面: images/papers/paper1.png

[STEP 3/3] 复制PDF到下载目录...
[OK] PDF已复制至: pdfs/paper1.pdf

[APA] 引用格式:
Zhang Y, Long Y (2025). New Urban Analysis Method. Nature Cities, 12(1), 123-145. https://doi.org/10.1038/xxx

[JSON] 生成的条目:
{
  "id": "new_urban_analysis_2025",
  "title": "New Urban Analysis Method",
  "authors": ["Zhang Y", "Long Y"],
  ...
}
======================================================================

[UPDATE] 更新publications.json...
[INFO] 添加了 2 个新条目

[NEWS] 生成News条目...
[OK] 已生成News条目

======================================================================
[STATS] 批量处理完成
======================================================================
  总计: 3 个PDF
  成功: 2
  跳过: 1
  失败: 0
======================================================================
```

### 4. 查看结果

- **论文条目**: 检查 `data/publications.json` 是否添加了新的论文
- **缩略图**: 查看 `images/papers/` 文件夹中的PNG图片
- **PDF文件**: 查看 `pdfs/` 文件夹，PDF已复制用于下载链接
- **News**: 检查 `data/news.json` 是否添加了发表新闻

### 5. 预览网站

```bash
python -m http.server 8000
```

然后访问 `http://localhost:8000` 查看更新后的网站。

## 高级用法

### 强制重新处理已有论文

如果你想重新处理某个PDF（例如元数据提取错误），使用 `--force` 参数：

```bash
python scripts/batch_processor.py --force
```

**注意**: 这会覆盖现有条目，请谨慎使用！

### 只处理特定PDF

如果只想处理单个PDF，可以使用底层脚本：

```bash
# 只提取元数据
python scripts/pdf_metadata_extractor.py --input images/raw-papers/paper.pdf

# 只生成缩略图
python scripts/pdf_cover_extractor.py --input images/raw-papers/paper.pdf --output images/papers/paper.png
```

## 工作流程详解

### 1. 元数据提取

使用AI模型（通过OpenAI API）从PDF前3页文本中提取：

- **论文标题**
- **作者列表** (标注共同一作†和通讯作者*)
- **发表期刊/会议**
- **发表年份**
- **卷号、页码**
- **DOI**
- **论文类型** (journal/conference/preprint)
- **发表状态** (published/accepted/under_review)

**AI提示词示例**:
```
分析以下论文PDF提取的文本，识别并提取论文的关键元数据。

PDF文件名: paper.pdf

论文文本（前3页）:
[PDF文本内容...]

请仔细阅读并提取以下信息：
1. **论文标题** (完整标题)
2. **作者列表** (所有作者，按顺序，标注共同一作†和通讯作者*)
...
```

### 2. 首页缩略图生成

**新策略：保存完整首页**

- 提取PDF首页（300 DPI高分辨率）
- 不进行智能裁剪（AI裁剪不可靠）
- 缩放至400×300尺寸（保持宽高比）
- 使用白色背景居中显示（letterboxing/pillarboxing）

**为什么放弃AI裁剪？**

经过多次尝试优化（扩展边距、中心点策略等），AI识别框架图边界仍然不可靠，容易裁掉图表的标题、图例等重要元素。完整首页可以确保所有信息完整展示。

### 3. 去重机制

批量处理器会检查每个PDF是否已处理，通过以下两种方式：

1. **图片路径匹配**: 检查 `images/papers/[PDF文件名].png` 是否已在publications.json中
2. **PDF链接匹配**: 检查 `pdfs/[PDF文件名].pdf` 是否已在publications.json中

如果已处理，跳过该PDF（除非使用 `--force` 参数）。

### 4. 自动生成News

每成功处理一个PDF，自动生成News条目：

**格式**:
```json
{
  "id": "news_[publication_id]",
  "date": "2025-01-16",
  "content": "Our paper on <em>[title]</em> was published/accepted in <em>[venue]</em>.",
  "type": "publication",
  "related_id": "[publication_id]",
  "pinned": false,
  "auto_generated": true
}
```

News会根据论文状态自动选择动词：
- `published` → "was published in"
- `accepted` → "was accepted by"
- `under_review` → "was submitted to"

## 常见问题

### Q1: AI提取的元数据不准确怎么办？

**方法1**: 手动编辑 `data/publications.json` 修正错误信息

**方法2**: 删除该条目，重新运行 `batch_processor.py --force`

**方法3**: 使用 `scripts/content_formatter.py` 手动输入正确信息

### Q2: 为什么有些PDF处理失败？

可能原因：
1. **PDF文本无法提取** - 扫描版PDF需要OCR
2. **AI无法识别格式** - 非标准论文格式
3. **API调用失败** - 检查网络和API密钥

**解决方法**: 对于失败的PDF，可以手动使用 `content_formatter.py` 添加。

### Q3: 缩略图质量不够清晰？

默认输出尺寸是400×300。可以修改 `.env` 文件：

```bash
PAPER_COVER_WIDTH=600
PAPER_COVER_HEIGHT=450
```

### Q4: 如何批量更新已有论文的缩略图？

```bash
# 只重新生成缩略图，不修改元数据
for pdf in images/raw-papers/*.pdf; do
    python scripts/pdf_cover_extractor.py --input "$pdf" --output "images/papers/$(basename "$pdf" .pdf).png"
done
```

### Q5: publications.json可以手动编辑吗？

**可以！** JSON文件是人类可读的，你可以：

1. 直接编辑修正错误
2. 手动添加新条目
3. 调整字段顺序
4. 批量查找替换

**建议**: 编辑前先备份文件。

## 文件结构说明

处理完成后的文件结构：

```
046个人主页/
├── images/
│   ├── raw-papers/          # 原始PDF文件（处理前）
│   │   ├── paper1.pdf
│   │   └── paper2.pdf
│   └── papers/              # 生成的缩略图（处理后）
│       ├── paper1.png       # 400×300，保持宽高比
│       └── paper2.png
├── pdfs/                    # 用于网站下载的PDF文件
│   ├── paper1.pdf           # 从raw-papers复制
│   └── paper2.pdf
├── data/
│   ├── publications.json    # 更新后的论文数据（自动）
│   └── news.json            # 更新后的新闻（自动）
└── scripts/
    └── batch_processor.py   # 批量处理脚本
```

## 下一步

处理完PDF后，你可以：

1. **本地预览**: `python -m http.server 8000` → 访问 http://localhost:8000
2. **部署到GitHub Pages**: 按照 `部署指南.md` 操作
3. **手动调整**: 编辑 `data/publications.json` 微调信息
4. **添加Badges**: 为重要论文添加 "🏆 ESI Highly Cited Paper" 等徽章

## 脚本参数参考

```bash
# 批量处理器
python scripts/batch_processor.py [--force]

Options:
  --force, -f    强制重新处理所有PDF（覆盖现有条目）

# 元数据提取器（单独使用）
python scripts/pdf_metadata_extractor.py [--input FILE | --batch]

Options:
  --input, -i FILE         处理单个PDF
  --batch, -b              批量处理模式
  --input-folder PATH      输入文件夹（默认: images/raw-papers）
  --no-auto-add            不自动添加，每个都询问

# 封面提取器（单独使用）
python scripts/pdf_cover_extractor.py [--input FILE --output FILE | --batch]

Options:
  --input, -i FILE         输入PDF文件
  --output, -o FILE        输出图片路径
  --batch, -b              批量处理模式
  --input-folder PATH      输入文件夹（默认: images/raw-papers）
  --output-folder PATH     输出文件夹（默认: images/papers）
```

## 故障排除

### 错误: "未配置AI API密钥"

**解决**:
```bash
# 检查 .env 文件是否存在
ls .env

# 检查API密钥是否配置
cat .env | grep OPENAI_API_KEY

# 如果不存在，复制模板
cp .env.example .env

# 编辑填入API密钥
code .env  # 或用任意编辑器
```

### 错误: "ImportError: No module named 'fitz'"

**解决**:
```bash
pip install PyMuPDF
```

### 错误: "OpenRouter API 401 Unauthorized"

**解决**: 检查 `.env` 文件中的API密钥是否正确，确保使用了 `load_dotenv(override=True)`。

### 警告: "AI解析失败"

**可能原因**:
1. PDF文本格式不标准
2. API调用超时
3. 模型token限制

**解决**: 使用 `scripts/content_formatter.py` 手动输入信息。

## 联系与支持

如有问题，请检查：
1. 日志输出中的详细错误信息
2. `.env` 配置是否正确
3. PDF文件是否损坏或加密

更多信息参见项目README.md。
