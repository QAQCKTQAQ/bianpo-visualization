# 使用官方 Nginx 镜像作为基础镜像
FROM nginx:alpine

# 将构建的前端静态文件复制到 Nginx 默认的服务目录中
COPY build/ /usr/share/nginx/html/

# 复制自定义的 Nginx 配置文件（如果需要）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 Nginx 运行的端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]