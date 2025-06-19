#!/bin/bash

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null
    then
        echo "错误: 未找到 $1 命令"
        echo "请先执行: sudo apt-get install webp imagemagick"
        exit 1
    fi
}

check_command cwebp
check_command convert

# 通用图片处理
process_image() {
    input=$1
    extension="${input##*.}"
    basename=$(basename "$input" .$extension)

    echo "正在处理: $input"

    # 生成webp版本
    cwebp -quiet -q 85 "$input" -o "public/images/products/${basename}.webp"

    # 生成多尺寸版本
    convert "$input" -resize 480x360 -quality 85 "public/images/products/${basename}-480.webp"
    convert "$input" -resize 800x600 -quality 85 "public/images/products/${basename}-800.webp"
    convert "$input" -resize 1200x900 -quality 85 "public/images/products/${basename}-1200.webp"
}

# 创建输出目录
mkdir -p public/images/products

# 处理目录中的所有图像文件
for image in public/images/*.{jpg,jpeg,png}
do
    if [ -f "$image" ]; then
        process_image "$image"
    fi
done

# 特殊处理其他类型的图像，如logo
if [ -f "public/images/logo.png" ]; then
    echo "正在处理: public/images/logo.png"
    cwebp -quiet -q 90 "public/images/logo.png" -o "public/images/logo.webp"
fi

echo "图片处理完成！"
