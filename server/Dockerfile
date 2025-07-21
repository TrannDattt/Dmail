FROM node:18-alpine

# Thư mục làm việc
WORKDIR /app

# Copy toàn bộ mã nguồn vào container
COPY . .

# Cài các gói cần thiết
RUN apk update && apk add \
    shadow \
    acl \
    busybox-extras \
    bash

# Cài node modules
RUN npm install

# Copy script start
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Mở cổng cho backend
EXPOSE 3001

# # Biến môi trường mặc định (có thể override khi docker run)
# ENV SMTP_USER=trann_dattt
# ENV SMTP_PASS=123456

# Chạy script khởi động
CMD ["/bin/bash", "/start.sh"]
