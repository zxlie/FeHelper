#!/bin/bash

# 设置脚本在遇到错误时退出
set -e

# 获取当前日期时间，格式：YYYY-MM-DD_HH-MM-SS
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# 定义路径
TARGET_DIR="../nginx-website/fehelper"
BACKUP_DIR="../backup.release"
SOURCE_DIR="./website"

echo "🚀 开始部署 website..."

# 1. 检查并备份现有目录
if [ -d "$TARGET_DIR" ]; then
    echo "📦 发现现有目录，正在创建备份..."
    
    # 创建备份目录（如果不存在）
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_NAME="fehelper.${TIMESTAMP}.zip"
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
    
    # 切换到目标目录的父目录进行打包
    cd "../nginx-website"
    zip -r "$BACKUP_PATH" "fehelper" > /dev/null 2>&1
    cd - > /dev/null
    
    echo "✅ 备份已创建: $BACKUP_PATH"
    
    # 删除现有目录
    echo "🗑️  删除现有目录..."
    rm -rf "$TARGET_DIR"
else
    echo "ℹ️  目标目录不存在，跳过备份步骤"
fi

# 2. 检查 website 目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ 错误: website 目录不存在!"
    exit 1
fi

# 3. 创建目标目录
echo "📁 创建目标目录..."
mkdir -p "$TARGET_DIR"

# 4. 拷贝 website 下所有内容到目标目录
echo "📤 拷贝 website 下所有内容到目标目录..."
cp -r "$SOURCE_DIR"/. "$TARGET_DIR"/

echo "✅ 部署完成!"
echo "📍 部署位置: $TARGET_DIR"

# 显示目录内容
echo ""
echo "📋 部署文件列表:"
ls -la "$TARGET_DIR" 
