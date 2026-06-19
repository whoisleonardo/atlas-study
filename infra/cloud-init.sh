#!/bin/bash
set -e

# Instala Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Abre 80/443 no firewall do SO (a Security List já abriu na nuvem).
# A imagem Ubuntu da Oracle bloqueia por padrão; inserimos antes da regra de REJECT.
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save

# Pasta de deploy (onde vão docker-compose.yml, Caddyfile e .env)
mkdir -p /home/ubuntu/atlas
chown ubuntu:ubuntu /home/ubuntu/atlas
