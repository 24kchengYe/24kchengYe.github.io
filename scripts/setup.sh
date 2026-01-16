#!/bin/bash

# 个人学术主页自动化设置脚本 (Linux/Mac)
# 用途: 一键安装依赖、创建文件夹、配置环境

set -e  # 遇到错误立即退出

echo "=========================================="
echo "  个人学术主页自动化设置"
echo "=========================================="
echo ""

# 1. 检查Python版本
echo "🔍 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python 3"
    echo "   请先安装Python 3.8或更高版本"
    echo "   访问: https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ 错误: Python版本过低 (当前: $PYTHON_VERSION, 要求: >= $REQUIRED_VERSION)"
    exit 1
fi

echo "✅ Python版本: $PYTHON_VERSION"
echo ""

# 2. 检查pip
echo "🔍 检查pip..."
if ! command -v pip3 &> /dev/null; then
    echo "❌ 错误: 未找到pip3"
    echo "   请先安装pip3"
    exit 1
fi
echo "✅ pip已安装"
echo ""

# 3. 创建虚拟环境(可选)
read -p "是否创建虚拟环境? (推荐) [Y/n]: " CREATE_VENV
CREATE_VENV=${CREATE_VENV:-Y}

if [[ "$CREATE_VENV" =~ ^[Yy]$ ]]; then
    echo "📦 创建虚拟环境..."
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ 虚拟环境已创建: venv/"
    else
        echo "⚠️  虚拟环境已存在，跳过创建"
    fi

    echo "🔄 激活虚拟环境..."
    source venv/bin/activate
    echo "✅ 虚拟环境已激活"
    echo ""
fi

# 4. 安装Python依赖
echo "📦 安装Python依赖包..."
if [ -f "scripts/requirements.txt" ]; then
    pip3 install -r scripts/requirements.txt
    echo "✅ 依赖包安装完成"
else
    echo "❌ 错误: 未找到 scripts/requirements.txt"
    exit 1
fi
echo ""

# 5. 创建必要的文件夹
echo "📁 创建文件夹结构..."

FOLDERS=(
    "data"
    "images/raw-avatars"
    "images/raw-papers"
    "images/papers"
    "docs"
)

for folder in "${FOLDERS[@]}"; do
    if [ ! -d "$folder" ]; then
        mkdir -p "$folder"
        echo "   ✅ 创建: $folder/"
    else
        echo "   ⚠️  已存在: $folder/"
    fi
done
echo ""

# 6. 配置.env文件
echo "⚙️  配置环境变量..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ 已创建 .env 文件 (从 .env.example 复制)"
        echo ""
        echo "⚠️  重要: 请编辑 .env 文件并填入您的OpenAI API密钥"
        echo "   打开方式: nano .env  或  vim .env"
        echo ""
    else
        echo "❌ 错误: 未找到 .env.example 模板文件"
        exit 1
    fi
else
    echo "⚠️  .env 文件已存在，跳过创建"
    echo ""
fi

# 7. 检查关键文件
echo "🔍 检查关键配置文件..."
REQUIRED_FILES=(
    "index.html"
    "css/style.css"
    "js/main.js"
    "js/news-generator.js"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ 缺失: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

if [ $MISSING_FILES -eq 0 ]; then
    echo "✅ 所有关键文件完整"
else
    echo "⚠️  有 $MISSING_FILES 个文件缺失，请检查项目完整性"
fi
echo ""

# 8. 显示下一步操作
echo "=========================================="
echo "✅ 设置完成！"
echo "=========================================="
echo ""
echo "📝 下一步操作:"
echo ""
echo "1️⃣  配置OpenAI API密钥:"
echo "   编辑 .env 文件，填入您的API密钥"
echo "   $ nano .env"
echo ""
echo "2️⃣  处理图片 (可选):"
echo "   将PDF论文放入: images/raw-papers/"
echo "   将个人照片放入: images/raw-avatars/"
echo "   $ python scripts/image_processor.py --all"
echo ""
echo "3️⃣  更新内容:"
echo "   编辑 data/ 文件夹下的JSON文件"
echo "   或使用AI格式化助手:"
echo "   $ python scripts/content_formatter.py --type publication"
echo ""
echo "4️⃣  本地预览:"
echo "   $ python -m http.server 8000"
echo "   访问: http://localhost:8000"
echo ""
echo "5️⃣  部署到GitHub Pages:"
echo "   参考: 部署指南.md"
echo ""
echo "=========================================="
echo "📚 完整文档:"
echo "   - README.md - 项目总体说明"
echo "   - docs/image_processing_guide.md - 图片处理详解"
echo "   - docs/content_update_guide.md - 内容更新指南"
echo "=========================================="
echo ""

# 9. 提示虚拟环境使用
if [[ "$CREATE_VENV" =~ ^[Yy]$ ]]; then
    echo "💡 提示: 虚拟环境使用"
    echo "   激活: source venv/bin/activate"
    echo "   退出: deactivate"
    echo ""
fi

echo "🎉 祝您使用愉快！"
