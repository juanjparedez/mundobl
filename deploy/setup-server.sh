#!/usr/bin/env bash
# Preparacion unica de un servidor Ubuntu 24.04 (Oracle Cloud ARM o x86).
# Uso: curl -fsSL https://raw.githubusercontent.com/juanjparedez/mundobl/main/deploy/setup-server.sh | bash
set -euo pipefail

sudo apt-get update -y
sudo apt-get install -y ca-certificates curl git iptables-persistent

# Docker oficial (incluye compose y buildx).
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

# Las imagenes de Ubuntu de Oracle traen iptables que rechaza todo salvo SSH:
# sin esto, 80/443 no responden aunque la Security List los permita.
for port in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null ||
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport "$port" -j ACCEPT
done
sudo iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null ||
  sudo iptables -I INPUT 6 -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# 2 GB de swap: el build de Next pide memoria de golpe.
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

[ -d ~/mundobl ] || git clone https://github.com/juanjparedez/mundobl.git ~/mundobl

echo
echo "Listo. Cerra sesion y volve a entrar (para el grupo docker),"
echo "crea ~/mundobl/.env y corre ~/mundobl/deploy/deploy.sh"
