#!/bin/bash

set -e

# Kiểm tra Postfix và Dovecot
command -v postfix >/dev/null 2>&1 || { echo >&2 "Postfix chưa được cài"; exit 1; }
command -v dovecot >/dev/null 2>&1 || { echo >&2 "Dovecot chưa được cài"; exit 1; }

# Tạo /home nếu cần
mkdir -p /home
chmod 755 /home

# Tạo user nếu chưa có
if ! id "$SMTP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$SMTP_USER"
  echo "$SMTP_USER:$SMTP_PASS" | chpasswd
  
  # Tạo Maildir
  runuser -l "$SMTP_USER" -c "maildirmake ~/Maildir"
  runuser -l "$SMTP_USER" -c "maildirmake ~/Maildir/.Sent"
  runuser -l "$SMTP_USER" -c "maildirmake ~/Maildir/.Trash"
  runuser -l "$SMTP_USER" -c "maildirmake ~/Maildir/.Drafts"

  # Gán quyền
  chown -R "$SMTP_USER:$SMTP_USER" "/home/$SMTP_USER/Maildir"
fi


# Ensure dovenull user exists
if ! id dovenull &>/dev/null; then
  useradd -r -u 97 -g nogroup -s /usr/sbin/nologin -d / dovenull
fi

# Khởi động Postfix và Dovecot
service postfix start
service dovecot start

# Đảm bảo log tồn tại
mkdir -p /var/log/mail
touch /var/log/mail.log

# Sync user từ server API
echo "Đang đồng bộ user từ server..."
node /app/index.js &
tail -f /var/log/mail.log
