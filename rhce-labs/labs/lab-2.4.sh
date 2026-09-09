#!/usr/bin/env bash
# Lab 2.4 — Networking with nmcli                   (01-Labs-RHCSA-Foundation)
# Run on rhel01, as root.
. "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/../lib/verify-lib.sh"

CON=lab-static
IP1=192.168.124.11/24
IP2=192.168.124.51/24
GW=192.168.124.1
FQDN=rhel01.lab.local

cfield() { nmcli -g "$1" con show "$CON" 2>/dev/null; }

profile_is_active() {
  local dev
  dev=$(nmcli -g GENERAL.DEVICES con show "$CON" 2>/dev/null)
  echo "profile is bound to device: ${dev:-<none>}"
  nmcli -t -f NAME,DEVICE con show --active 2>/dev/null | grep -q "^$CON:"
}

both_addresses_live() {
  local missing=0 a
  for a in "${IP1%%/*}" "${IP2%%/*}"; do
    ip -4 -o addr show 2>/dev/null | grep -q "$a" || { echo "not on any interface: $a"; missing=1; }
  done
  return $missing
}

no_handwritten_ifcfg() {
  local n
  n=$(find /etc/sysconfig/network-scripts -maxdepth 1 -name 'ifcfg-*' 2>/dev/null | wc -l)
  echo "ifcfg-* files present: $n"
  ((n == 0))
}

dns_has_both() {
  local d
  d=$(cfield ipv4.dns)
  echo "ipv4.dns = ${d:-<empty>}"
  grep -q "$GW" <<<"$d" && grep -q '8\.8\.8\.8' <<<"$d"
}

# ------------------------------------------------------------------------------
lab_init "2.4" "Networking with nmcli" --host rhel01 --root "$@"

need_cmd "every check in this lab" nmcli || { summary; exit 1; }

section "1. The lab-static profile"
check "a connection profile named lab-static exists" nmcli con show "$CON"
check -p "it is the active profile on its device" profile_is_active
check_eq -p "ipv4.method is manual, not auto" "manual" "$(cfield ipv4.method)"
check_match -p "the static address $IP1 is configured" "${IP1//./\\.}" bash -c "nmcli -g ipv4.addresses con show $CON"
check_eq -p "the gateway is $GW" "$GW" "$(cfield ipv4.gateway)"
check -p "both DNS servers are configured" dns_has_both
check_match -p "the search domain is lab.local" 'lab\.local' bash -c "nmcli -g ipv4.dns-search con show $CON"

section "2. The hostname is permanent"
check_eq -p "static hostname is $FQDN" "$FQDN" "$(hostnamectl --static 2>/dev/null)"
check_match "hostnamectl reports the FQDN" 'rhel01\.lab\.local' hostnamectl

section "3. The second address on the same profile"
check_match -p "$IP2 is on the lab-static profile" "${IP2//./\\.}" bash -c "nmcli -g ipv4.addresses con show $CON"
check "both addresses are live on an interface" both_addresses_live
report "live addresses" bash -c 'ip -4 -o addr show | grep -v " lo "'

section "4. Autoconnect at boot"
check_eq -p "autoconnect is yes" "yes" "$(cfield connection.autoconnect)"

section "5. Resolution and connectivity still work"
check "rhel02 resolves" getent hosts rhel02
check "rhel02 answers a ping" ping -c1 -W2 rhel02
check_match "resolv.conf carries the search domain" 'lab\.local' cat /etc/resolv.conf
check_match "resolv.conf carries a nameserver" '^nameserver' cat /etc/resolv.conf

section "6. It was all done with nmcli"
check "no hand-written ifcfg-* files in network-scripts" no_handwritten_ifcfg
info "The requirement was to never edit those files by hand — this proves it."

summary
