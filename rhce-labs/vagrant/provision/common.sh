#!/usr/bin/env bash
# Runs on every node. Sets up only what the *environment* needs — never what a
# lab is supposed to teach you to install.
set -Eeuo pipefail

LAB_USER=${LAB_USER:-vagrant}
LAB_IP=${LAB_IP:-}
WANT_SPARE=${LAB_SPARE:-0}

# --- name resolution between the nodes ---------------------------------------
# The labs reach each other by name constantly (SSH, NFS, Ansible inventory).
if ! grep -q 'rhce-lab hosts' /etc/hosts; then
  {
    echo ""
    echo "# --- rhce-lab hosts ---"
    printf '%s\n' "$HOSTS_BLOCK"
  } >> /etc/hosts
fi

# --- the shared lab key, so the control node can reach the managed nodes -----
install -d -m 0700 -o "$LAB_USER" -g "$LAB_USER" "/home/$LAB_USER/.ssh"
AUTH="/home/$LAB_USER/.ssh/authorized_keys"
touch "$AUTH"
grep -qxF "$LAB_PUBKEY" "$AUTH" || printf '%s\n' "$LAB_PUBKEY" >> "$AUTH"
chown "$LAB_USER:$LAB_USER" "$AUTH"
chmod 0600 "$AUTH"

# --- what the checkers themselves need to be able to run ---------------------
# acl/attr for the ACL and archive-context checks, lsof for the disk-space
# drill, bzip2 and tar for the archive lab, vim because Lab 1.1 requires it.
# Deliberately absent: httpd, podman, nfs, and the SELinux tooling — working out
# that you need those, and installing them, is the lab.
need=()
for p in vim-enhanced acl attr lsof bzip2 tar; do
  rpm -q "$p" >/dev/null 2>&1 || need+=("$p")
done
if ((${#need[@]})); then
  echo "==> installing environment packages: ${need[*]}"
  dnf install -y -q "${need[@]}" || echo "!! could not install: ${need[*]} (check repositories)"
fi

# --- the spare interface the nmcli lab configures ----------------------------
# VirtualBox runs a DHCP server on the host-only network, so NetworkManager
# helpfully leases an address onto the third NIC. The lab needs it *empty*, so
# strip the lease and stop NM bringing it back.
SPARE=""
if [[ $WANT_SPARE == 1 ]]; then
  for i in $(ls /sys/class/net | grep -Ev '^(lo|virbr|docker)'); do
    a=$(ip -4 -o addr show dev "$i" 2>/dev/null | awk '{print $4}' | cut -d/ -f1)
    # skip the NAT interface Vagrant reaches us on, and the configured lab NIC
    [[ $a == 10.0.2.* ]] && continue
    [[ -n ${LAB_IP:-} && $a == "$LAB_IP" ]] && continue
    SPARE=$i
  done
  if [[ -n ${SPARE:-} ]]; then
    echo "==> reserving $SPARE for the nmcli lab (removing its DHCP lease)"
    # `nmcli dev set ... autoconnect no` is runtime only: after a reboot
    # NetworkManager creates a fresh automatic DHCP profile for any carrier-up
    # device that has none. no-auto-default stops that permanently, while still
    # letting nmcli configure the device by hand — which is the whole lab.
    install -d -m 0755 /etc/NetworkManager/conf.d
    cat > /etc/NetworkManager/conf.d/99-lab-spare.conf <<NMCONF
# Reserved for the nmcli lab: NetworkManager must not auto-configure $SPARE.
[main]
no-auto-default=$SPARE
NMCONF
    while read -r c; do
      [[ -n ${c// /} ]] && nmcli con delete "$c" >/dev/null 2>&1 || true
    done < <(nmcli -t -f NAME,DEVICE con show 2>/dev/null | awk -F: -v d="$SPARE" '$2 == d { print $1 }')
    nmcli general reload conf >/dev/null 2>&1 || systemctl reload NetworkManager >/dev/null 2>&1 || true
    ip addr flush dev "$SPARE" 2>/dev/null || true
  fi
fi

# --- tell the checkers what the environment actually built -------------------
# The labs detect their platform, but where the environment made a deliberate
# choice it says so here rather than making a script infer it.
cat > /etc/rhce-lab.env <<ENV
# Written by the lab provisioner. The verification harness sources this.
LAB_PLATFORM=virtualbox
LAB_USER=$LAB_USER
LAB_NET=${LAB_NET_PREFIX:-192.168.56}
LAB_PRIMARY_IP=${LAB_IP:-}
LAB_SPARE_IFACE=${SPARE:-}
ENV
chmod 0644 /etc/rhce-lab.env

# --- make the blank lab disks obvious ----------------------------------------
echo "==> block devices on $(hostname -s):"
lsblk -dno NAME,SIZE,TYPE | sed 's/^/    /'

echo "==> $(hostname -s) ready"
