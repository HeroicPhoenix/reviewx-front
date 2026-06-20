# ================================
# 第一阶段：构建 ReviewX Vue 项目
# ================================
FROM crpi-v2fmzydhnzmlpzjc.cn-shanghai.personal.cr.aliyuncs.com/machenkai/node:24.14-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .
RUN npm run build


# ================================
# 第二阶段：Nginx 运行
# ================================
FROM crpi-v2fmzydhnzmlpzjc.cn-shanghai.personal.cr.aliyuncs.com/machenkai/nginx:1.28.2-alpine

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# 运行时变量默认值，可在 docker run / docker-compose 中覆盖。
# 示例：-e GATEWAY_UPSTREAM=http://reviewx-server:58080
ENV API_BASE_URL=/api
ENV USE_MOCK=false
ENV GATEWAY_UPSTREAM=http://host.docker.internal:58080

# ================================
# 生成 Nginx 配置脚本
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
'    # ===== 静态资源，绝不走 index.html =====' \
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
'    # ===== API 代理 =====' \
'    location /api/ {' \
'        proxy_http_version 1.1;' \
'' \
'        proxy_set_header Host \$http_host;' \
'        proxy_set_header X-Real-IP \$remote_addr;' \
'        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;' \
'        proxy_set_header X-Forwarded-Host \$http_host;' \
'        proxy_set_header X-Forwarded-Port \$server_port;' \
'        proxy_set_header X-Forwarded-Proto \$scheme;' \
'' \
'        proxy_connect_timeout 60s;' \
'        proxy_send_timeout 120s;' \
'        proxy_read_timeout 120s;' \
'' \
'        proxy_pass ${GATEWAY_UPSTREAM};' \
'    }' \
'' \
'    # ===== SPA 路由，只给前端路由用 =====' \
'    location / {' \
'        try_files \$uri \$uri/ /index.html;' \
'    }' \
'}' \
'EOF' \
> /docker-entrypoint.d/30-generate-nginx-conf.sh

RUN chmod +x /docker-entrypoint.d/30-generate-nginx-conf.sh

# ================================
# 生成运行时前端配置脚本
# ================================
RUN printf '%s\n' \
'#!/bin/sh' \
'set -e' \
'' \
'escape_js() {' \
'  printf "%s" "$1" | sed "s/\\\\/\\\\\\\\/g; s/\"/\\\\\"/g"' \
'}' \
'' \
'API_BASE_URL_JS=$(escape_js "${API_BASE_URL}")' \
'USE_MOCK_JS=$(escape_js "${USE_MOCK}")' \
'GATEWAY_UPSTREAM_JS=$(escape_js "${GATEWAY_UPSTREAM}")' \
'' \
'printf "window.__APP_CONFIG__ = {\n" > /usr/share/nginx/html/config.js' \
'printf "  API_BASE_URL: \"${API_BASE_URL_JS}\",\n" >> /usr/share/nginx/html/config.js' \
'printf "  USE_MOCK: \"${USE_MOCK_JS}\",\n" >> /usr/share/nginx/html/config.js' \
'printf "  GATEWAY_UPSTREAM: \"${GATEWAY_UPSTREAM_JS}\"\n" >> /usr/share/nginx/html/config.js' \
'printf "};\n" >> /usr/share/nginx/html/config.js' \
> /docker-entrypoint.d/40-generate-config.sh

RUN chmod +x /docker-entrypoint.d/40-generate-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
