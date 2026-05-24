#!/usr/bin/env bash
# ===============================================================
# One-shot deploy script for OMQ Auto Parts Hub Trustpilot clone
# Run on the VPS as root. Asks for your domain + Basic Auth creds.
# ===============================================================
set -euo pipefail

# --- 1. Prompt for inputs ---
read -rp "Domain (e.g. mysite.co.uk): " DOMAIN
read -rp "Email for Let's Encrypt notifications: " EMAIL
read -rp "Basic Auth username: " AUTH_USER
read -rsp "Basic Auth password: " AUTH_PASS
echo
read -rp "Confirm — install everything for ${DOMAIN}? [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Aborted."
    exit 1
fi

# --- 2. Detect OS family ---
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS_FAMILY="$ID_LIKE $ID"
else
    echo "Cannot detect OS — /etc/os-release is missing."
    exit 1
fi

echo
echo "==> Detected: $PRETTY_NAME"
echo "==> Installing nginx, certbot, htpasswd tool, ufw..."

# --- 3. Install packages ---
if echo "$OS_FAMILY" | grep -qiE "debian|ubuntu"; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y nginx certbot python3-certbot-nginx apache2-utils ufw curl
elif echo "$OS_FAMILY" | grep -qiE "rhel|centos|fedora|rocky|almalinux"; then
    dnf install -y epel-release || true
    dnf install -y nginx certbot python3-certbot-nginx httpd-tools firewalld curl
    systemctl enable --now firewalld
else
    echo "Unsupported OS family: $OS_FAMILY"
    exit 1
fi

# --- 4. Firewall: allow 80, 443, 22 only ---
echo "==> Configuring firewall..."
if command -v ufw >/dev/null 2>&1; then
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    ufw --force enable
elif command -v firewall-cmd >/dev/null 2>&1; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --reload
fi

# --- 5. Web root ---
WEBROOT="/var/www/${DOMAIN}"
mkdir -p "$WEBROOT"
mkdir -p /var/www/letsencrypt
echo "==> Web root: $WEBROOT"
echo "==> Upload your site files to $WEBROOT (e.g. via scp from your local machine):"
echo "    scp -r /path/to/website/* root@SERVER:$WEBROOT/"
echo

# --- 6. .htpasswd ---
echo "==> Creating /etc/nginx/.htpasswd ..."
htpasswd -bc /etc/nginx/.htpasswd "$AUTH_USER" "$AUTH_PASS"
chmod 640 /etc/nginx/.htpasswd
chown root:www-data /etc/nginx/.htpasswd 2>/dev/null || chown root:nginx /etc/nginx/.htpasswd 2>/dev/null || true

# --- 7. nginx site config ---
echo "==> Installing nginx site config..."
SITE_CONF="/etc/nginx/sites-available/${DOMAIN}.conf"

# Pick the config dir based on distro
if [[ -d /etc/nginx/sites-available ]]; then
    CONF_DIR="/etc/nginx/sites-available"
    LINK_DIR="/etc/nginx/sites-enabled"
else
    CONF_DIR="/etc/nginx/conf.d"
    LINK_DIR=""
fi

# Copy the nginx-site.conf (must be in the same folder as this script)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ ! -f "$SCRIPT_DIR/nginx-site.conf" ]]; then
    echo "ERROR: nginx-site.conf not found next to install.sh"
    exit 1
fi
sed "s/__DOMAIN__/${DOMAIN}/g" "$SCRIPT_DIR/nginx-site.conf" > "${CONF_DIR}/${DOMAIN}.conf"

# Symlink to sites-enabled if Debian-style
if [[ -n "$LINK_DIR" ]]; then
    ln -sf "${CONF_DIR}/${DOMAIN}.conf" "${LINK_DIR}/${DOMAIN}.conf"
fi

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/conf.d/default.conf

# --- 8. Get SSL cert from Let's Encrypt ---
echo "==> Stopping nginx briefly to issue SSL cert..."
systemctl stop nginx || true
certbot certonly --standalone --non-interactive --agree-tos --no-eff-email \
    --email "$EMAIL" \
    -d "$DOMAIN" -d "www.${DOMAIN}"

# --- 9. Generate strong DH params (so TLS doesn't whine) ---
if [[ ! -f /etc/ssl/certs/dhparam.pem ]]; then
    echo "==> Generating DH params (this takes a minute)..."
    openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
fi

# --- 10. Test + start nginx ---
echo "==> Testing nginx config..."
nginx -t

echo "==> Starting nginx..."
systemctl enable nginx
systemctl restart nginx

# --- 11. Auto-renew certbot ---
systemctl enable --now certbot.timer 2>/dev/null || true

# --- 12. Done! ---
echo
echo "============================================="
echo "  DONE — site is live at https://${DOMAIN}"
echo "============================================="
echo "  Basic Auth user: $AUTH_USER"
echo "  Site files at:   $WEBROOT"
echo
echo "  NEXT: upload your website files to $WEBROOT"
echo "        scp -r /local/path/website/* root@$(hostname -I | awk '{print $1}'):$WEBROOT/"
echo
echo "  To verify bot blocking:"
echo "        curl -A 'GPTBot/1.0' https://${DOMAIN}    # should return 403"
echo "        curl -A 'Mozilla/5.0' -u $AUTH_USER:PASSWORD https://${DOMAIN}  # should return 200"
echo
