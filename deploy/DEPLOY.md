# Deployment Guide

This deploys the site to your VPS with **nginx + HTTPS + HTTP Basic Auth + bot blocking + Cloudflare**.

## Total time: ~15 minutes

---

## Prerequisites

- A VPS with root SSH access (Ubuntu/Debian/CentOS/Rocky all work)
- A registered domain
- A free Cloudflare account (https://dash.cloudflare.com/sign-up)

---

## Step 1 — Point your domain at Cloudflare

1. Log into your **domain registrar** and find DNS / nameserver settings.
2. Log into **Cloudflare** → Add Site → enter your domain → choose **Free** plan.
3. Cloudflare will give you 2 nameservers (e.g. `kim.ns.cloudflare.com`, `tom.ns.cloudflare.com`).
4. Back at your registrar, replace the existing nameservers with Cloudflare's.
5. **Wait** for propagation (5 min – 24 h, usually under 1 h). Cloudflare emails you when active.

---

## Step 2 — Add the DNS A records in Cloudflare

In Cloudflare → DNS → Records, add **two** records (both proxied = orange cloud):

| Type | Name | IPv4 address     | Proxy status |
|------|------|------------------|--------------|
| A    | @    | `YOUR.VPS.IP.ADDR` | Proxied (orange) |
| A    | www  | `YOUR.VPS.IP.ADDR` | Proxied (orange) |

The orange cloud means traffic is filtered through Cloudflare (hides your VPS IP, adds bot protection).

---

## Step 3 — Cloudflare SSL/TLS settings

In Cloudflare → SSL/TLS:
- **Overview** → set to **Full (strict)** *(after step 4 finishes — see note below)*
- **Edge Certificates** → enable **Always Use HTTPS**
- **Edge Certificates** → enable **Automatic HTTPS Rewrites**
- **Bots** → enable **Bot Fight Mode** (extra layer, free)

> **Note:** During step 4 the VPS will issue its own Let's Encrypt cert. Until that completes,
> temporarily set Cloudflare SSL to **Flexible**. Switch to **Full (strict)** after step 4.

---

## Step 4 — Run the install script on your VPS

SSH into the VPS as root:

```bash
ssh root@YOUR.VPS.IP.ADDR
```

Upload the `deploy/` folder from your local machine (run on your laptop, **not** the server):

```bash
scp -r "C:/Users/omar_/Desktop/New Website/website/deploy" root@YOUR.VPS.IP.ADDR:/root/
```

Back on the VPS:

```bash
cd /root/deploy
chmod +x install.sh
./install.sh
```

The script will ask you for:
- Domain (e.g. `mysite.co.uk`)
- Email for Let's Encrypt
- Basic Auth username
- Basic Auth password

It will install nginx, certbot, get a real SSL cert, configure the site, and set up bot blocking.

---

## Step 5 — Upload the website files

From your **local machine** (not the VPS):

```bash
scp -r "C:/Users/omar_/Desktop/New Website/website/"*.{html,css,js,txt} \
       "C:/Users/omar_/Desktop/New Website/website/assets" \
       root@YOUR.VPS.IP.ADDR:/var/www/YOUR_DOMAIN/
```

Or use rsync (cleaner — re-uploads only changed files later):

```bash
rsync -avz --exclude='deploy' --exclude='.git' \
  "C:/Users/omar_/Desktop/New Website/website/" \
  root@YOUR.VPS.IP.ADDR:/var/www/YOUR_DOMAIN/
```

---

## Step 6 — Switch Cloudflare to Full (strict)

Cloudflare → SSL/TLS → Overview → set to **Full (strict)**.

---

## Step 7 — Verify

Open `https://YOUR_DOMAIN` in your browser. You should:

1. See the browser auth prompt → enter the username/password you chose
2. Then see the site

### Test bot blocking

```bash
# These should all return 403:
curl -A "GPTBot/1.0" https://YOUR_DOMAIN
curl -A "ClaudeBot" https://YOUR_DOMAIN
curl -A "AhrefsBot" https://YOUR_DOMAIN

# This should return 401 (auth required), then 200 with credentials:
curl https://YOUR_DOMAIN                                            # 401
curl -u "USER:PASS" https://YOUR_DOMAIN                             # 200

# Check the X-Robots-Tag header is present:
curl -I -u "USER:PASS" https://YOUR_DOMAIN  | grep -i robots
# X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex, nocache
```

---

## What's protecting the site

| Layer | Defense |
|-------|---------|
| Cloudflare proxy | Hides VPS IP, Bot Fight Mode, edge SSL, DDoS protection |
| nginx UA blocking | ~50 bot UAs return 403 before they even reach the site |
| nginx empty-UA block | Requests with no User-Agent → 403 (typical scraper signature) |
| HTTP Basic Auth | Every visitor must enter username/password |
| `X-Robots-Tag` HTTP header | Search engines told to never index, even if they bypass robots.txt |
| `<meta robots>` in HTML | Same signal in the HTML head |
| `robots.txt` | All ~50 known crawlers explicitly disallowed |
| Strict CSP/Referrer/COOP headers | No leaking, no framing, no cross-origin embedding |

---

## Updating the site later

After making local changes, re-upload:

```bash
rsync -avz --exclude='deploy' --exclude='.git' \
  "C:/Users/omar_/Desktop/New Website/website/" \
  root@YOUR.VPS.IP.ADDR:/var/www/YOUR_DOMAIN/
```

No nginx reload needed — it's static files.

---

## Rotating the Basic Auth password

SSH to VPS as root:
```bash
htpasswd /etc/nginx/.htpasswd USERNAME    # prompts for new password
systemctl reload nginx
```

## Adding a second user

```bash
htpasswd /etc/nginx/.htpasswd second_username   # then enter their password
systemctl reload nginx
```
