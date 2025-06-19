#!/bin/bash
# deployment-verifier.sh
# 本地部署验证工具

set -eo pipefail

# 配置项
PORT=8000
TIMEOUT=5
SERVER_PID=""
TMP_DIR=$(mktemp -d)

# 清理函数
cleanup() {
    echo "正在清理..."
    [[ -n $SERVER_PID ]] && kill $SERVER_PID 2>/dev/null
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# 启动测试服务器
start_server() {
    echo "启动测试服务器..."
    python3 -m http.server $PORT --directory public > "$TMP_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    sleep 2 # 等待服务器启动
}

# HTTP状态检查
check_http_status() {
    local url=$1
    local expected=$2
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT$url" --connect-timeout $TIMEOUT)
    
    if [[ $status_code -ne $expected ]]; then
        echo "错误: $url 返回状态码 $status_code (预期 $expected)"
        return 1
    fi
    return 0
}

# 内容验证
check_content() {
    local url=$1
    local pattern=$2
    if ! curl -s "http://localhost:$PORT$url" | grep -q "$pattern"; then
        echo "错误: $url 内容中未找到 '$pattern'"
        return 1
    fi
    return 0
}

# 文件类型验证
check_file_type() {
    local url=$1
    local expected_type=$2
    local file_path="public$url"
    
    if ! file -b --mime-type "$file_path" | grep -q "$expected_type"; then
        echo "错误: $url 文件类型不符 (预期 $expected_type)"
        return 1
    fi
    return 0
}

main() {
    # 检查必要文件
    [[ ! -d "public" ]] && { echo "错误: public目录不存在"; exit 1; }
    [[ ! -f "public/data/products.json" ]] && { echo "错误: 缺少数据文件 public/data/products.json"; exit 1; }

    start_server

    # 执行测试用例
    errors=0
    
    # 测试用例组1: 基础路径
    echo "=== 基础路径验证 ==="
    check_http_status "/" 200 || ((errors++))
    check_content "/" "北京科琦科技有限公司" || ((errors++))
    
    # 测试用例组2: 数据接口
    echo "=== 数据接口验证 ==="
    check_http_status "/data/products.json" 200 || ((errors++))
    check_content "/data/products.json" "3588" || ((errors++))
    
    # 测试用例组3: 静态资源
    echo "=== 静态资源验证 ==="
    check_http_status "/images/logo.webp" 200 || ((errors++))
    check_file_type "/images/logo.webp" "image/webp" || ((errors++))
    
    check_http_status "/manuals/A73588J-1.6GHz-board-intro.pdf" 200 || ((errors++))
    check_file_type "/manuals/A73588J-1.6GHz-board-intro.pdf" "application/pdf" || ((errors++))
    
    # 测试用例组4: 产品图片
    echo "=== 产品图片验证 ==="
    check_http_status "/images/products/A7-3588-800.webp" 200 || ((errors++))
    check_file_type "/images/products/A7-3588-800.webp" "image/webp" || ((errors++))

    # 结果报告
    if [[ $errors -gt 0 ]]; then
        echo -e "\n\033[31m验证失败: 发现 $errors 个错误\033[0m"
        echo "调试信息:"
        echo "服务器日志:"
        cat "$TMP_DIR/server.log"
        exit 1
    else
        echo -e "\n\033[32m所有测试通过，部署验证成功！\033[0m"
    fi
}

main
