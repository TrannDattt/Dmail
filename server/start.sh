#!/bin/bash

# Tạo user mặc định nếu chưa có
# if ! id "$SMTP_USER" &>/dev/null; then
#   echo "✅ Tạo user mặc định: $SMTP_USER"
#   useradd -m -s /bin/bash "$SMTP_USER"
#   echo "$SMTP_USER:$SMTP_PASS" | chpasswd

#   # Tạo Maildir và thư mục con
#   maildir="/home/$SMTP_USER/Maildir"
#   mkdir -p "$maildir"/{cur,new,tmp} \
#            "$maildir/.Sent"/{cur,new,tmp} \
#            "$maildir/.Drafts"/{cur,new,tmp} \
#            "$maildir/.Trash"/{cur,new,tmp}

#   chown -R "$SMTP_USER:$SMTP_USER" "/home/$SMTP_USER"
#   chmod -R 700 "/home/$SMTP_USER"

#   # ACL cho dovecot (nếu container dovecot truy cập)
#   setfacl -m u:dovecot:x "/home/$SMTP_USER"
#   setfacl -Rm u:dovecot:rwX "/home/$SMTP_USER/Maildir"
# fi

# Khởi động Node server
exec node server.js
