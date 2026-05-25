#!/usr/bin/env python3
"""
Deploy the OMQ Trustpilot clone to the VPS using paramiko.
Reads connection config from environment vars (set in calling script).
"""
import os
import sys
import time
from pathlib import Path

import paramiko

# --- Config from environment ---
HOST = os.environ["VPS_HOST"]
PORT = int(os.environ.get("VPS_PORT", 22))
USER = os.environ["VPS_USER"]
PASS = os.environ["VPS_PASS"]
DOMAIN = os.environ["DOMAIN"]
SUBPATH = os.environ["SUBPATH"]              # e.g. "www.omq-wingmirrorparts.co.uk"
WEBROOT = f"/var/www/{DOMAIN}"
SITE_DIR = f"{WEBROOT}/{SUBPATH}"
AUTH_USER = os.environ["AUTH_USER"]
AUTH_PASS = os.environ["AUTH_PASS"]
LE_EMAIL = os.environ["LE_EMAIL"]
LOCAL_SITE_DIR = os.environ["LOCAL_SITE_DIR"]


def connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"==> Connecting to {USER}@{HOST}:{PORT}")
    client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=30, look_for_keys=False, allow_agent=False)
    return client


def run(client, cmd, sudo=False, quiet=False, get_pty=False):
    """Run a command and print output. Returns (exit_code, stdout, stderr)."""
    if not quiet:
        print(f"\n$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=get_pty, timeout=600)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    exit_code = stdout.channel.recv_exit_status()
    if not quiet:
        if out.strip():
            print(out.rstrip())
        if err.strip():
            print(f"[stderr] {err.rstrip()}")
        print(f"[exit {exit_code}]")
    return exit_code, out, err


def sftp_put_dir(client, local_path, remote_path):
    """Recursively upload local_path → remote_path via SFTP."""
    sftp = client.open_sftp()
    local_path = Path(local_path)

    def _mkdir_p(path):
        try:
            sftp.stat(path)
        except IOError:
            parent = os.path.dirname(path.rstrip("/"))
            if parent and parent != "/":
                _mkdir_p(parent)
            try:
                sftp.mkdir(path)
            except IOError:
                pass

    _mkdir_p(remote_path)
    files_uploaded = 0
    for item in local_path.rglob("*"):
        rel = item.relative_to(local_path).as_posix()
        target = f"{remote_path}/{rel}"
        if item.is_dir():
            _mkdir_p(target)
        else:
            parent_remote = os.path.dirname(target)
            _mkdir_p(parent_remote)
            sftp.put(str(item), target)
            files_uploaded += 1
            if files_uploaded % 10 == 0:
                print(f"  ... uploaded {files_uploaded} files")
    sftp.close()
    print(f"==> Uploaded {files_uploaded} files to {remote_path}")


def main():
    client = connect()
    print("==> Connected.")
    rc, out, _ = run(client, "cat /etc/os-release | head -3", quiet=True)
    print(out.rstrip())

    # 1. Update + install packages
    print("\n===== STEP 1: Install packages =====")
    run(client, "DEBIAN_FRONTEND=noninteractive apt-get update -y -q", get_pty=True)
    run(client,
        "DEBIAN_FRONTEND=noninteractive apt-get install -y -q nginx certbot python3-certbot-nginx apache2-utils ufw curl",
        get_pty=True)

    # 2. Firewall
    print("\n===== STEP 2: Firewall =====")
    run(client, "ufw allow 22/tcp")
    run(client, "ufw allow 80/tcp")
    run(client, "ufw allow 443/tcp")
    run(client, "ufw --force enable")
    run(client, "ufw status")

    # 3. Create webroot + .htpasswd
    print("\n===== STEP 3: Webroot + auth =====")
    run(client, f"mkdir -p {SITE_DIR}")
    run(client, f"mkdir -p /var/www/letsencrypt")
    run(client, f"htpasswd -bc /etc/nginx/.htpasswd {AUTH_USER} '{AUTH_PASS}'")
    run(client, "chmod 644 /etc/nginx/.htpasswd")
    run(client, "chown www-data:www-data /etc/nginx/.htpasswd")

    # 4. Upload site files
    print("\n===== STEP 4: Upload site files =====")
    sftp_put_dir(client, LOCAL_SITE_DIR, SITE_DIR)
    run(client, f"chown -R www-data:www-data {WEBROOT}")
    run(client, f"find {WEBROOT} -type d -exec chmod 755 {{}} +")
    run(client, f"find {WEBROOT} -type f -exec chmod 644 {{}} +")

    # 5. Write nginx config
    print("\n===== STEP 5: nginx config =====")
    nginx_conf = build_nginx_conf()
    remote_conf_path = f"/etc/nginx/sites-available/{DOMAIN}.conf"
    sftp = client.open_sftp()
    with sftp.open(remote_conf_path, "w") as f:
        f.write(nginx_conf)
    sftp.close()
    run(client, f"ln -sf {remote_conf_path} /etc/nginx/sites-enabled/{DOMAIN}.conf")
    run(client, "rm -f /etc/nginx/sites-enabled/default")
    run(client, "nginx -t")
    run(client, "systemctl restart nginx")
    run(client, "systemctl enable nginx")

    # 6. SSL with certbot
    print("\n===== STEP 6: Let's Encrypt SSL =====")
    rc, out, err = run(client,
        f"certbot --nginx --non-interactive --agree-tos --no-eff-email "
        f"--redirect --email {LE_EMAIL} -d {DOMAIN}",
        get_pty=True)
    if rc != 0:
        print("WARNING: certbot failed — site will work on HTTP, you can re-run later")
    else:
        run(client, "systemctl enable --now certbot.timer")

    # 7. Verify
    print("\n===== STEP 7: Verify =====")
    rc, out, _ = run(client, f"curl -sI -A 'Mozilla/5.0' https://{DOMAIN}/{SUBPATH}/")
    print(out)
    rc, out, _ = run(client, f"curl -sI -A 'GPTBot/1.0' https://{DOMAIN}/{SUBPATH}/")
    print("Bot test (should be 403):")
    print(out)

    print("\n========================================")
    print(f"  DONE — site live at:")
    print(f"    https://{DOMAIN}/{SUBPATH}/")
    print(f"  Basic Auth: {AUTH_USER} / {AUTH_PASS}")
    print("========================================")
    client.close()


def build_nginx_conf():
    return f"""# nginx config for {DOMAIN} — serves {SUBPATH} subpath only
# Auth + bot blocking + noindex headers

map $http_user_agent $is_bot {{
    default 0;
    ~*googlebot                    1;
    ~*bingbot                      1;
    ~*slurp                        1;
    ~*duckduckbot                  1;
    ~*baiduspider                  1;
    ~*yandexbot                    1;
    ~*sogou                        1;
    ~*facebookexternalhit          1;
    ~*twitterbot                   1;
    ~*linkedinbot                  1;
    ~*whatsapp                     1;
    ~*GPTBot                       1;
    ~*ChatGPT-User                 1;
    ~*OAI-SearchBot                1;
    ~*ClaudeBot                    1;
    ~*Claude-Web                   1;
    ~*anthropic-ai                 1;
    ~*Bytespider                   1;
    ~*PerplexityBot                1;
    ~*Perplexity-User              1;
    ~*Applebot                     1;
    ~*CCBot                        1;
    ~*Diffbot                      1;
    ~*Meta-ExternalAgent           1;
    ~*Meta-ExternalFetcher         1;
    ~*FacebookBot                  1;
    ~*ImagesiftBot                 1;
    ~*Amazonbot                    1;
    ~*cohere-ai                    1;
    ~*omgili                       1;
    ~*AhrefsBot                    1;
    ~*SemrushBot                   1;
    ~*MJ12bot                      1;
    ~*DotBot                       1;
    ~*BLEXBot                      1;
    ~*PetalBot                     1;
    ~*DataForSeoBot                1;
    ~*ZoominfoBot                  1;
    ~*ia_archiver                  1;
    ~*archive\\.org_bot             1;
    ~*HTTrack                      1;
    ~*Scrapy                       1;
    ~*HeadlessChrome               1;
}}

server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN};

    location /.well-known/acme-challenge/ {{
        root /var/www/letsencrypt;
    }}

    location / {{
        return 301 https://$host$request_uri;
    }}
}}

server {{
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name {DOMAIN};

    root /var/www/{DOMAIN};
    index index.html;

    # SSL — certbot will overwrite these lines:
    ssl_certificate     /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    # Block bots before anything
    if ($is_bot) {{ return 403; }}
    if ($http_user_agent = "") {{ return 403; }}

    server_tokens off;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer" always;
    add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Allow /robots.txt at root without auth so robots see "Disallow: /"
    location = /robots.txt {{
        auth_basic off;
        alias /var/www/{DOMAIN}/{SUBPATH}/robots.txt;
    }}

    # Bare path with no trailing slash → redirect
    location = /{SUBPATH} {{
        return 301 /{SUBPATH}/;
    }}

    # Site lives under the subpath
    location /{SUBPATH}/ {{
        alias /var/www/{DOMAIN}/{SUBPATH}/;
        try_files $uri $uri/ /{SUBPATH}/index.html;
        index index.html;

        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/.htpasswd;

        # Cache HTML aggressively-not (so updates appear) but cache assets:
        location ~* \\.html$ {{
            auth_basic "Restricted";
            auth_basic_user_file /etc/nginx/.htpasswd;
            add_header Cache-Control "no-store, no-cache, must-revalidate" always;
            add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache" always;
        }}
        location ~* \\.(?:css|js|jpg|jpeg|png|gif|webp|avif|svg|woff2?|ico)$ {{
            auth_basic "Restricted";
            auth_basic_user_file /etc/nginx/.htpasswd;
            expires 30d;
            add_header Cache-Control "public, no-transform";
            add_header X-Robots-Tag "noindex, nofollow, noarchive" always;
        }}
    }}

    # Anything else → 404
    location / {{
        return 404;
    }}

    # Block hidden files
    location ~ /\\. {{
        deny all;
        return 404;
    }}

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;
}}
"""


if __name__ == "__main__":
    main()
