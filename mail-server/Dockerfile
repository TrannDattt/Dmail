FROM debian:bullseye

ENV DEBIAN_FRONTEND=noninteractive
ENV SMTP_USER=admin
ENV SMTP_PASS=12345

RUN apt-get update && \
    apt-get install -y \
      postfix \
      dovecot-core \
      dovecot-imapd \
      dovecot-pop3d \
      dovecot-lmtpd \
      procps \
      net-tools \
      iputils-ping \
      telnet \
      maildrop \
      nano &&\
    apt-get clean

RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app
COPY . /app
RUN npm install

# Copy cấu hình
COPY postfix/ /etc/postfix/
COPY dovecot/ /etc/dovecot/

# Copy script khởi động
COPY start.sh /start.sh
RUN chmod +x /start.sh

# RUN apt-get update && apt-get install -y rsyslog

# Expose các cổng email
EXPOSE 25 587 993 3005

CMD ["/start.sh"]
