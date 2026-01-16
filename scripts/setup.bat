@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 个人学术主页自动化设置脚本 (Windows)
REM 用途: 一键安装依赖、创建文件夹、配置环境

echo ==========================================
echo   个人学术主页自动化设置
echo ==========================================
echo.

REM 1. 检查Python版本
echo 🔍 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Python
    echo    请先安装Python 3.8或更高版本
    echo    访问: https://www.python.org/downloads/
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python版本: %PYTHON_VERSION%
echo.

REM 2. 检查pip
echo 🔍 检查pip...
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到pip
    echo    请确保Python安装时勾选了pip
    pause
    exit /b 1
)
echo ✅ pip已安装
echo.

REM 3. 创建虚拟环境(可选)
set /p CREATE_VENV="是否创建虚拟环境? (推荐) [Y/n]: "
if "!CREATE_VENV!"=="" set CREATE_VENV=Y

if /i "!CREATE_VENV!"=="Y" (
    echo 📦 创建虚拟环境...
    if not exist "venv" (
        python -m venv venv
        echo ✅ 虚拟环境已创建: venv\
    ) else (
        echo ⚠️  虚拟环境已存在，跳过创建
    )

    echo 🔄 激活虚拟环境...
    call venv\Scripts\activate.bat
    echo ✅ 虚拟环境已激活
    echo.
)

REM 4. 安装Python依赖
echo 📦 安装Python依赖包...
if exist "scripts\requirements.txt" (
    pip install -r scripts\requirements.txt
    if errorlevel 1 (
        echo ❌ 依赖包安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖包安装完成
) else (
    echo ❌ 错误: 未找到 scripts\requirements.txt
    pause
    exit /b 1
)
echo.

REM 5. 创建必要的文件夹
echo 📁 创建文件夹结构...

set FOLDERS=data images\raw-avatars images\raw-papers images\papers docs

for %%f in (%FOLDERS%) do (
    if not exist "%%f" (
        mkdir "%%f"
        echo    ✅ 创建: %%f\
    ) else (
        echo    ⚠️  已存在: %%f\
    )
)
echo.

REM 6. 配置.env文件
echo ⚙️  配置环境变量...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ 已创建 .env 文件 (从 .env.example 复制)
        echo.
        echo ⚠️  重要: 请编辑 .env 文件并填入您的OpenAI API密钥
        echo    打开方式: notepad .env
        echo.
    ) else (
        echo ❌ 错误: 未找到 .env.example 模板文件
        pause
        exit /b 1
    )
) else (
    echo ⚠️  .env 文件已存在，跳过创建
    echo.
)

REM 7. 检查关键文件
echo 🔍 检查关键配置文件...
set MISSING_FILES=0

set REQUIRED_FILES=index.html css\style.css js\main.js js\news-generator.js

for %%f in (%REQUIRED_FILES%) do (
    if not exist "%%f" (
        echo    ❌ 缺失: %%f
        set /a MISSING_FILES+=1
    )
)

if !MISSING_FILES!==0 (
    echo ✅ 所有关键文件完整
) else (
    echo ⚠️  有 !MISSING_FILES! 个文件缺失，请检查项目完整性
)
echo.

REM 8. 显示下一步操作
echo ==========================================
echo ✅ 设置完成！
echo ==========================================
echo.
echo 📝 下一步操作:
echo.
echo 1️⃣  配置OpenAI API密钥:
echo    编辑 .env 文件，填入您的API密钥
echo    $ notepad .env
echo.
echo 2️⃣  处理图片 (可选):
echo    将PDF论文放入: images\raw-papers\
echo    将个人照片放入: images\raw-avatars\
echo    $ python scripts\image_processor.py --all
echo.
echo 3️⃣  更新内容:
echo    编辑 data\ 文件夹下的JSON文件
echo    或使用AI格式化助手:
echo    $ python scripts\content_formatter.py --type publication
echo.
echo 4️⃣  本地预览:
echo    $ python -m http.server 8000
echo    访问: http://localhost:8000
echo.
echo 5️⃣  部署到GitHub Pages:
echo    参考: 部署指南.md
echo.
echo ==========================================
echo 📚 完整文档:
echo    - README.md - 项目总体说明
echo    - docs\image_processing_guide.md - 图片处理详解
echo    - docs\content_update_guide.md - 内容更新指南
echo ==========================================
echo.

REM 9. 提示虚拟环境使用
if /i "!CREATE_VENV!"=="Y" (
    echo 💡 提示: 虚拟环境使用
    echo    激活: venv\Scripts\activate.bat
    echo    退出: deactivate
    echo.
)

echo 🎉 祝您使用愉快！
echo.
pause
