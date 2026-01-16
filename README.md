# 个人学术主页 - AI驱动的自动化学术展示平台

这是一个现代化的、完全自动化的个人学术主页系统，采用数据驱动架构和AI辅助内容管理。

## 🌟 核心特性

### 🤖 AI自动化功能
- ✅ **AI驱动的PDF论文处理** - 放入PDF自动提取封面图和完整元数据，无需手动输入
- ✅ **智能图片裁剪** - AI识别最佳论文封面区域，智能人脸检测和头像裁剪
- ✅ **自动内容格式化** - AI辅助将非结构化文本转换为标准JSON格式
- ✅ **自动News生成** - 添加论文/数据集/奖项时自动生成对应新闻条目
- ✅ **APA引用格式化** - AI自动格式化标准学术引用

### 📊 数据驱动架构
- ✅ **JSON配置文件** - 所有内容存储于结构化JSON，完全分离数据与展示
- ✅ **模块化内容管理** - 独立管理论文、数据集、代码工具、奖项、学术活动
- ✅ **零编程内容更新** - 编辑JSON文件即可更新网站，无需修改HTML/CSS/JS

### 🎨 现代化UI设计
- ✅ **响应式布局** - 完美支持桌面、平板、移动设备
- ✅ **智能分页系统** - News部分10条/页，智能省略号算法（首页...当前...尾页）
- ✅ **置顶统计展示** - 渐变背景的置顶统计行（总下载量、引用数、高被引论文数）
- ✅ **优雅交互动画** - CSS3动画、渐变背景、悬停效果
- ✅ **数学公式支持** - MathJax集成，支持LaTeX公式

### 🔧 开发者友好
- ✅ **GitHub Pages友好** - 纯静态站点，可直接部署
- ✅ **清晰代码结构** - 模块化JavaScript，类型化数据结构
- ✅ **完整文档** - 详细使用指南和API说明
- ✅ **便捷工具链** - Python自动化脚本和交互式CLI工具

## 📁 项目结构

```
046个人主页/
├── index.html                          # 主页面（数据驱动，无硬编码内容）
├── css/
│   └── style.css                       # 样式表（渐变、网格、动画）
├── js/
│   ├── main.js                         # 核心功能（ConfigLoader + PageRenderer）
│   └── news-generator.js               # News自动生成与分页
├── images/
│   ├── profile.jpg                     # 自动处理后的头像（400×400）
│   ├── papers/                         # 自动处理后的论文封面（400×300）
│   ├── raw-avatars/                    # 【新增】原始头像文件夹
│   └── raw-papers/                     # 【新增】原始论文PDF文件夹
├── data/                               # 【新增】JSON数据文件
│   ├── config.json                     # 主配置（个人信息、Biography、Contact）
│   ├── publications.json               # 论文数据（15篇）
│   ├── datasets.json                   # 数据集数据（4个）
│   ├── code-tools.json                 # 代码工具数据（初始为空）
│   ├── awards.json                     # 奖项数据（6个）
│   ├── activities.json                 # 学术活动数据
│   └── news.json                       # News历史记录（自动生成）
├── scripts/                            # 【新增】Python自动化脚本
│   ├── image_processor.py              # 主图片处理脚本
│   ├── pdf_cover_extractor.py          # PDF封面提取（AI识别）
│   ├── ai_image_analyzer.py            # 头像智能裁剪（三重回退）
│   ├── pdf_metadata_extractor.py       # PDF元数据自动提取
│   ├── content_formatter.py            # 内容格式化助手（AI辅助）
│   └── requirements.txt                # Python依赖
├── .env                                # 【新增】API密钥配置（需用户创建）
├── .env.example                        # 【新增】配置模板
└── google-scholar-stats/
    └── gs_data.json                    # Google Scholar引用数据
```

## 🚀 快速开始

### 步骤1: 安装Python依赖

```bash
pip install -r scripts/requirements.txt
```

**依赖包含**:
- PyMuPDF（PDF处理）
- Pillow（图片处理）
- python-dotenv（环境变量）
- openai（OpenAI API）
- anthropic（Claude API，可选）
- opencv-python（本地人脸检测，可选）

### 步骤2: 配置AI API密钥

```bash
# 复制配置模板
cp .env.example .env

# 编辑 .env 文件，填入您的OpenAI API密钥
# OPENAI_API_KEY=sk-...
```

**⚠️ 重要安全提示**:
- `.env` 已添加到 `.gitignore`，不会被提交到Git仓库
- 切勿在公开仓库中泄露API密钥
- 部署到GitHub Pages时无需.env（仅本地使用）

**🌍 国内用户配置**:
如果在中国大陆使用，需配置代理或中转服务：
```bash
OPENAI_BASE_URL=https://your-proxy-url.com/v1
```

### 步骤3: 处理图片（可选）

如果您有论文PDF和个人照片需要处理：

```bash
# 1. 将PDF放入文件夹
cp your_paper.pdf images/raw-papers/

# 2. 将照片放入文件夹
cp your_photo.jpg images/raw-avatars/

# 3. 运行自动处理（一键处理所有）
python scripts/image_processor.py --all
```

**自动完成**:
- ✅ 提取PDF代表性图片（AI识别）并裁剪为400×300
- ✅ 提取PDF元数据（标题、作者、期刊、DOI等）
- ✅ 格式化为APA引用
- ✅ 自动添加到 `data/publications.json`
- ✅ 自动生成News条目
- ✅ 智能裁剪头像为400×400正方形

### 步骤4: 更新内容

#### 方式1: 直接编辑JSON文件

打开 `data/` 文件夹下的JSON文件，按格式编辑：

```json
// data/publications.json 示例
{
  "id": "your_paper_2025",
  "title": "Your Paper Title",
  "authors": ["Zhang Y†", "Li M*"],
  "author_note": "†co-first, *corresponding",
  "venue": "Journal Name",
  "year": 2025,
  "type": "journal",
  "status": "published",
  "image": "images/papers/your_paper.png",
  "links": {
    "pdf": "https://...",
    "doi": "https://doi.org/..."
  }
}
```

#### 方式2: 使用AI格式化助手（推荐）

```bash
python scripts/content_formatter.py --type publication
```

**交互式流程**:
1. 粘贴论文信息（自由文本或引用格式）
2. AI自动格式化为标准JSON
3. 预览确认
4. 自动添加到 `data/publications.json`
5. 自动生成News条目

### 步骤5: 本地预览

```bash
# 使用Python启动本地服务器
python -m http.server 8000

# 访问 http://localhost:8000
```

## 🎯 核心功能详解

### 1. AI驱动的PDF论文处理

**完全自动化工作流**（用户原话："这样我连论文信息都不用输入了"）：

```bash
# 将PDF放入文件夹
cp new_paper.pdf images/raw-papers/

# 运行处理脚本
python scripts/image_processor.py --papers
```

**自动完成的事情**:
1. ✅ 提取PDF前3页文本
2. ✅ AI识别并提取元数据（标题、作者、期刊、年份、DOI、卷号、页码）
3. ✅ 标注共同一作†和通讯作者*
4. ✅ 格式化为标准APA引用
5. ✅ 提取代表性图片（框架图/核心图表，AI识别）
6. ✅ 裁剪为400×300像素论文封面
7. ✅ 结构化为JSON并添加到 `data/publications.json`
8. ✅ 自动生成News条目："Our paper on [title] was published in [venue]."
9. ✅ 去重检查（避免重复添加）

**技术细节**:
- 使用 **GPT-4 Turbo** 提取元数据（温度0.1保证准确性）
- 使用 **GPT-4 Vision** 识别最佳封面区域
- 300 DPI高清渲染PDF页面
- LANCZOS算法高质量图片缩放

### 2. 智能头像裁剪

**三重回退策略**确保100%成功率：

```bash
python scripts/image_processor.py --avatar
```

**处理流程**:
1. **方法1: AI人脸检测** - 使用GPT-4 Vision识别人脸中心坐标
2. **方法2: OpenCV本地检测** - 使用Haar级联分类器（无需API）
3. **方法3: 中心裁剪** - 如果前两者均失败，裁剪图片中心区域

**输出**: `images/profile.jpg` (400×400像素正方形)

### 3. News自动生成与智能分页

**News作为第一内容区块**（紧接About之后）：

- **置顶统计行** - 渐变背景(`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)，显示：
  - 📊 Total Downloads: 17,000+
  - 📊 Citations: 自动从Google Scholar获取
  - 📊 Highly Cited: 1 paper

- **自动生成规则**:
  - 新增论文 → "Our paper on [title] was published/accepted in [venue]."
  - 新增数据集 → "Released [name] dataset with [downloads] downloads."
  - 新增奖项 → "Received [award] from [organization]."

- **智能分页算法**（10条/页）:
  - 总页数 ≤ 7: 显示所有页码按钮
  - 总页数 > 7: 首页 ... 当前-1 当前 当前+1 ... 尾页
  - 当前页高亮蓝色背景
  - 禁用按钮透明度50%

### 4. Biography三句话设计

**严格3句话结构**（参考优秀学术主页）：

```json
{
  "biography": {
    "identity": "I am a PhD student at Beijing City Lab, Tsinghua University.",
    "education": "I received my bachelor's degree from Hefei University of Technology in 2023.",
    "research_interests": "My research focuses on urban modeling, urbanization processes, AI applications in urban science, and urban resilience."
  }
}
```

渲染为3个独立 `<p>` 标签，清晰呈现身份、教育背景、研究兴趣。

### 5. Contact部分整合

**移除**:
- ❌ 顶部个人信息区域的邮箱
- ❌ 顶部的社交链接
- ❌ 顶部的三个统计数字（总引用、总下载、高被引）

**整合到底部**（网格布局）:
- 📧 Email
- 🎓 Google Scholar
- 💻 GitHub
- 🔗 ORCID
- 📊 Figshare
- 📖 ResearchGate

**配置方式**（`data/config.json`）:
```json
{
  "contact": [
    {
      "display": "Email",
      "value": "your.email@example.com",
      "link": "mailto:your.email@example.com",
      "icon": "📧"
    }
  ]
}
```

## 📚 日常使用工作流程

### 场景1: 发表新论文

**完全自动化方案**:
```bash
# 1. 将论文PDF放入文件夹
cp my_new_paper.pdf images/raw-papers/

# 2. 一键处理（封面+元数据）
python scripts/image_processor.py --papers

# 等待AI处理...
# ✅ 封面已保存: images/papers/my_new_paper.png
# ✅ 元数据已提取并显示APA引用
# ✅ 已添加到 data/publications.json
# ✅ 已生成News条目

# 3. 刷新网页查看效果
```

**预期结果**:
- 论文显示在Publications部分
- News自动添加发表消息
- Google Scholar引用数（如配置）
- 论文封面图自动关联

---

### 场景2: 开源新数据集

```bash
# 使用AI格式化助手
python scripts/content_formatter.py --type dataset

# 输入数据集信息（可粘贴自由文本）:
# 名称: Global Urban Dataset
# 描述: A comprehensive dataset...
# 链接: https://figshare.com/xxx
# 关联论文ID: urban_paper_2025

# AI自动:
# - 格式化为JSON
# - 添加到 data/datasets.json
# - 生成News: "Released Global Urban Dataset with X downloads."

# 刷新网页即可看到
```

---

### 场景3: 获得新奖项

```bash
python scripts/content_formatter.py --type award

# 输入:
# 年份: 2025
# 奖项名称: Best Paper Award
# 颁发机构: IEEE Conference

# AI自动添加到 data/awards.json 并生成News
```

---

### 场景4: 更新个人头像

```bash
# 1. 放入新照片
cp new_photo.jpg images/raw-avatars/

# 2. 运行智能裁剪
python scripts/image_processor.py --avatar

# AI检测人脸并智能裁剪为正方形
# 保存为 images/profile.jpg

# 3. 刷新网页看到新头像
```

---

### 场景5: 手动编辑配置

**直接编辑JSON**（适合小改动）:
```bash
# 修改个人信息
code data/config.json  # 或用任意文本编辑器

# 示例：更新职位
{
  "personal": {
    "title": "Assistant Professor"  // 从 PhD Student 改为 教授
  }
}

# 保存后刷新网页，无需运行任何脚本
```

## 🔧 高级配置

### .env 文件详解

```bash
# OpenAI API配置
OPENAI_API_KEY=sk-your-key-here          # 必填
OPENAI_MODEL=gpt-4-vision-preview        # 图片识别模型
OPENAI_BASE_URL=https://api.openai.com/v1  # API端点（国内用户改为代理）

# 图片处理配置
AVATAR_SIZE=400                          # 头像尺寸
PAPER_COVER_WIDTH=400                    # 论文封面宽度
PAPER_COVER_HEIGHT=300                   # 论文封面高度

# 内容格式化配置
CONTENT_FORMAT_MODEL=gpt-4-turbo-preview # 文本格式化模型（更便宜）
```

### Google Scholar集成

**自动显示引用数**:

1. 更新 `google-scholar-stats/gs_data.json`:
```json
{
  "citedby": 1250,
  "publications": {
    "cmab_2025": {
      "num_citations": 145,
      "title": "CMAB: A Multi-Attribute Building Dataset"
    }
  }
}
```

2. 确保论文的 `citation_key` 与JSON中的key匹配

3. 页面加载时自动显示引用数

**自动化更新**（可选）:
- 可编写Python脚本定期爬取Google Scholar
- 或使用GitHub Actions定期更新

### 模块显隐控制

**Code & Tools部分自动隐藏**:
- 如果 `data/code-tools.json` 为空，该部分自动隐藏
- 添加第一个工具后自动显示
- 无需修改HTML/CSS

```javascript
// js/main.js 自动检测
renderCodeTools(codeTools) {
    const section = document.getElementById('code');
    if (!codeTools.tools || codeTools.tools.length === 0) {
        section.style.display = 'none';  // 自动隐藏
        return;
    }
    section.style.display = 'block';  // 有内容时显示
}
```

## 📤 部署到GitHub Pages

### 方法1: 标准部署

```bash
# 1. 创建GitHub仓库
# 仓库名: username.github.io（或任意名称）

# 2. 推送代码
git init
git add .
git commit -m "Deploy academic homepage"
git branch -M main
git remote add origin https://github.com/username/repo-name.git
git push -u origin main

# 3. 在GitHub Settings → Pages
# Source: main 分支
# 保存并等待部署

# 4. 访问 https://username.github.io/repo-name
```

**⚠️ 安全注意事项**:
- `.env` 文件已在 `.gitignore` 中，不会被推送
- API密钥仅在本地使用（运行Python脚本时）
- 部署的网站是纯静态HTML/CSS/JS，无需API密钥

### 方法2: 自定义域名

```bash
# 1. 在仓库根目录创建 CNAME 文件
echo "yourdomain.com" > CNAME

# 2. 在域名服务商配置DNS
# A记录指向: 185.199.108.153
# 或 CNAME 指向: username.github.io

# 3. 推送代码
git add CNAME
git commit -m "Add custom domain"
git push

# 4. GitHub Settings → Pages → Custom domain
# 输入: yourdomain.com
```

## 🎨 自定义样式

### 修改主题色

编辑 `css/style.css`:

```css
/* 主色调 */
#0366d6  /* 蓝色 - 链接、按钮 */
#28a745  /* 绿色 - 数据集强调色 */
#6f42c1  /* 紫色 - 代码工具强调色 */
#ffd700  /* 金色 - 奖项边框 */

/* 渐变背景（置顶News） */
linear-gradient(135deg, #667eea 0%, #764ba2 100%)
```

全局替换颜色值即可更换主题。

### 修改字体

```css
body {
    font-family: "YOUR-FONT", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

### 调整分页数量

编辑 `js/news-generator.js`:

```javascript
class NewsGenerator {
    constructor(itemsPerPage = 10) {  // 改为15或20
        this.itemsPerPage = itemsPerPage;
    }
}
```

或在 `data/config.json` 配置:
```json
{
  "news_config": {
    "items_per_page": 15
  }
}
```

## 🐛 常见问题

### Q: API调用失败怎么办？

**A**: 图片处理脚本有回退策略：
- PDF封面: AI失败 → 使用首页完整截图
- 头像裁剪: AI失败 → OpenCV本地检测 → 中心裁剪
- 元数据提取: AI失败 → 手动编辑JSON

### Q: 国内访问OpenAI API慢？

**A**: 配置代理或中转服务：
```bash
# .env 文件
OPENAI_BASE_URL=https://your-proxy.com/v1
```

或使用国内Claude API（Anthropic）:
```bash
# 安装anthropic库后，脚本会自动支持
pip install anthropic
```

### Q: 如何批量导入历史论文？

**A**: 方法1 - 批量PDF处理:
```bash
# 将所有PDF放入 images/raw-papers/
# 运行批量处理
python scripts/image_processor.py --papers

# AI会逐个提取并添加
```

**A**: 方法2 - 手动编辑JSON:
直接编辑 `data/publications.json`，复制粘贴格式化条目。

### Q: News太多，如何归档？

**A**: 编辑 `data/news.json`，将旧news移到单独的归档文件:
```bash
# 创建归档
mv data/news.json data/news_backup_2024.json

# 创建新的news.json，仅保留置顶统计和最近20条
```

前端会自动只显示 `data/news.json` 中的内容。

### Q: 如何禁用某个模块？

**A**: 编辑 `index.html`，给 section 添加 `style="display:none"`：
```html
<section id="datasets" class="section" style="display:none">
```

或删除对应的数据文件（如删除 `data/datasets.json`）。

## 📚 学习资源

- [HTML教程](https://www.w3school.com.cn/html/)
- [CSS教程](https://www.w3school.com.cn/css/)
- [JavaScript教程](https://www.w3school.com.cn/js/)
- [MathJax文档](https://docs.mathjax.org/)
- [OpenAI API文档](https://platform.openai.com/docs)
- [GitHub Pages指南](https://pages.github.com/)
- [JSON格式教程](https://www.json.org/json-zh.html)

## 🙏 致谢

本项目架构参考了优秀的学术主页设计：
- [liq22.github.io](https://liq22.github.io/) - Biography设计灵感

## 📊 技术栈

**前端**:
- HTML5 (语义化标签)
- CSS3 (Flexbox, Grid, 渐变, 动画)
- JavaScript ES6+ (类, async/await, 模块化)
- MathJax (数学公式)

**自动化**:
- Python 3.8+
- PyMuPDF (PDF处理)
- Pillow (图片处理)
- OpenAI GPT-4 Vision (AI识别)
- OpenAI GPT-4 Turbo (文本处理)
- OpenCV (可选本地人脸检测)

**数据**:
- JSON (结构化存储)
- Google Scholar API (引用统计)

## 📄 许可证

本项目采用 MIT 许可证，可自由使用和修改。

## 📧 支持与反馈

如有问题或建议，欢迎通过以下方式联系：

1. **GitHub Issues** - 提交bug报告或功能请求
2. **邮件** - 发送至配置文件中的联系邮箱
3. **Pull Requests** - 欢迎贡献代码改进

---

## 🚀 下一步

完成上述配置后，建议：

1. ✅ 运行 `python scripts/image_processor.py --all` 处理所有图片
2. ✅ 使用 `python scripts/content_formatter.py` 添加内容
3. ✅ 本地浏览器测试所有功能
4. ✅ 部署到GitHub Pages
5. ✅ 配置自定义域名（可选）
6. ✅ 设置GitHub Actions自动更新引用数（可选）

**祝您的学术主页运行顺利！** 🎉

---

⭐ 如果这个项目对您有帮助，欢迎Star支持！
