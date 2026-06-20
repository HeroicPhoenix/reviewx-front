# ================================
# ReviewX 前端运行镜像
# ================================
# 构建镜像前先在宿主机执行：
#   npm ci
#   npm run build
#
# 当前 Docker 环境拉取 Node 基础镜像会被 registry mirror 拦截，因此镜像只负责
# 打包已生成的 dist 目录，确保 docker build 在本机和部署机上稳定通过。
FROM nginx:1.28.2-alpine

RUN rm -rf /usr/share/nginx/html/*
COPY dist /usr/share/nginx/html

# 后端服务地址，可在 docker run / docker-compose 中覆盖。
# 示例：-e REVIEWX_API_UPSTREAM=http://reviewx-server:58080
ENV REVIEWX_API_UPSTREAM=http://host.docker.internal:58080

# ================================
# 生成 Nginx 配置
# ================================
RUN printf '%s\n' \
'#!/bin/sh' \
'set -e' \
'' \
'cat > /etc/nginx/conf.d/default.conf <<EOF' \
'server {' \
'    listen 80;' \
'    server_name _;' \
'' \
'    root /usr/share/nginx/html;' \
'    index index.html;' \
'' \
'    location /assets/ {' \
'        access_log off;' \
'        expires 30d;' \
'        add_header Cache-Control "public, immutable";' \
'        try_files \$uri =404;' \
'    }' \
'' \
'    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp|woff2?|ttf|map)$ {' \
'        access_log off;' \
'        expires 30d;' \
'        add_header Cache-Control "public, immutable";' \
'        try_files \$uri =404;' \
'    }' \
'' \
'    location /api/ {' \
'        proxy_http_version 1.1;' \
'        proxy_set_header Host \$http_host;' \
'        proxy_set_header X-Real-IP \$remote_addr;' \
'        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;' \
'        proxy_set_header X-Forwarded-Host \$http_host;' \
'        proxy_set_header X-Forwarded-Port \$server_port;' \
'        proxy_set_header X-Forwarded-Proto \$scheme;' \
'        proxy_connect_timeout 60s;' \
'        proxy_send_timeout 120s;' \
'        proxy_read_timeout 120s;' \
'        proxy_pass ${REVIEWX_API_UPSTREAM};' \
'    }' \
'' \
'    location / {' \
'        try_files \$uri \$uri/ /index.html;' \
'    }' \
'}' \
'EOF' \
> /docker-entrypoint.d/30-generate-reviewx-conf.sh

RUN chmod +x /docker-entrypoint.d/30-generate-reviewx-conf.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
