#!/bin/bash
set -e

# Swap de 2 GB — essencial numa VM de 1 GB de RAM (E2.1.Micro).
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Instala Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Abre 80/443 no firewall do SO (a Security List já abriu na nuvem).
# A imagem Ubuntu da Oracle bloqueia por padrão; inserimos antes da regra de REJECT.
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save

# Endurece o SSH: só chave (sem senha) e sem login direto de root.
# A porta 22 fica aberta (necessária pro deploy via SSH do GitHub Actions),
# mas key-only + fail2ban reduzem bem o risco de brute-force.
cat > /etc/ssh/sshd_config.d/99-atlas-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
EOF
systemctl restart ssh 2>/dev/null || systemctl restart sshd 2>/dev/null || true

# fail2ban bane IPs que erram o login SSH repetidamente.
apt-get update -y
apt-get install -y fail2ban
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 1h
EOF
systemctl enable --now fail2ban

# Pasta de deploy (onde vão docker-compose.yml, Caddyfile e .env)
mkdir -p /home/ubuntu/atlas
chown ubuntu:ubuntu /home/ubuntu/atlas
