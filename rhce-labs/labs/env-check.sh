#!/usr/bin/env bash
# Environment acceptance test                       (00-Lab-Environment)
# Run on the KVM host (virsh checks) and/or on rhel-control (ansible checks).
# Do not start Week 1 until every line passes.
_D=$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")
. "$_D/../lib/verify-lib.sh"

NODES="rhel-control rhel01 rhel02"
LABUSER=${SUDO_USER:-$USER}
for a in "$@"; do case "$a" in --labuser=*) LABUSER=${a#--labuser=} ;; esac; done

# ------------------------------------------------------------------ host side --
all_nodes_running() {
  local bad=0 n
  for n in $NODES; do
    virsh domstate "$n" 2>/dev/null | grep -q running || { echo "$n is not running"; bad=1; }
  done
  virsh list --all
  return $bad
}

snapshots_exist() {
  local bad=0 n
  for n in $NODES; do
    virsh snapshot-list "$n" 2>/dev/null | grep -q clean || { echo "$n has no 'clean' snapshot"; bad=1; }
  done
  return $bad
}

overlays_not_copies() {
  local bad=0 f
  while read -r f; do
    [[ -f $f ]] || continue
    qemu-img info "$f" 2>/dev/null | grep -q 'backing file' ||
      { echo "no backing file — this is a full copy, not an overlay: $f"; bad=1; }
  done < <(virsh domblklist rhel01 2>/dev/null | awk '/qcow2/ { print $2 }' | head -1)
  return $bad
}

blank_disks_present() {
  local bad=0 n c
  for n in rhel01 rhel02; do
    c=$(virsh domblklist "$n" 2>/dev/null | grep -c 'disk[12]\.qcow2')
    echo "$n has $c extra disk(s) attached"
    [[ ${c:-0} -ge 2 ]] || bad=1
  done
  return $bad
}

run_host_checks() {
  section "H1. The three nodes exist and run"
  check "libvirtd is running" systemctl is-active --quiet libvirtd
  check "KVM acceleration is available" \
    bash -c "virt-host-validate 2>/dev/null | grep -i 'kvm' | grep -qv FAIL"
  check "the default network is active" bash -c "virsh net-list 2>/dev/null | grep -q default"
  check "all three nodes are running" all_nodes_running

  section "H2. Disks"
  check "the node images are thin overlays, not full copies" overlays_not_copies
  check "rhel01 and rhel02 each have two extra blank disks" blank_disks_present

  section "H3. The baseline snapshot"
  check "every node has a 'clean' snapshot" snapshots_exist
  info "Snapshot the REGISTERED state, not the empty one — see 00-Lab-Environment."
  report "snapshots on rhel01" bash -c 'virsh snapshot-list rhel01 2>/dev/null'
}

# --------------------------------------------------------------- control side --
ssh_passwordless() {
  local bad=0 n out
  for n in rhel01 rhel02; do
    out=$(sudo -u "$LABUSER" ssh -o BatchMode=yes -o ConnectTimeout=5 \
          "$LABUSER@$n" 'hostname' 2>&1)
    if grep -qE 'Permission denied|password|timed out|refused' <<<"$out"; then
      echo "$n: $out"; bad=1
    else
      echo "$n -> $out"
    fi
  done
  return $bad
}

sudo_passwordless_remote() {
  local bad=0 n out
  for n in rhel01 rhel02; do
    out=$(sudo -u "$LABUSER" ssh -o BatchMode=yes -o ConnectTimeout=5 \
          "$LABUSER@$n" 'sudo -n whoami' 2>&1)
    grep -q '^root$' <<<"$out" || { echo "$n: sudo -n did not return root ($out)"; bad=1; }
  done
  return $bad
}

repos_available() {
  local bad=0 n out
  for n in rhel01 rhel02; do
    out=$(sudo -u "$LABUSER" ssh -o BatchMode=yes "$LABUSER@$n" 'sudo dnf repolist' 2>&1)
    local c
    c=$(grep -cE '^[a-zA-Z0-9]' <<<"$out")
    echo "$n: $c repository line(s)"
    [[ ${c:-0} -ge 2 ]] || { echo "$out" | tail -3; bad=1; }
  done
  return $bad
}

blank_disks_visible() {
  local bad=0 n out
  for n in rhel01 rhel02; do
    out=$(sudo -u "$LABUSER" ssh -o BatchMode=yes "$LABUSER@$n" 'lsblk -dno NAME,SIZE,FSTYPE' 2>&1)
    echo "--- $n"; echo "$out"
    grep -q 'vdb' <<<"$out" || { echo "$n: no vdb"; bad=1; }
    grep -q 'vdc' <<<"$out" || { echo "$n: no vdc"; bad=1; }
  done
  return $bad
}

run_control_checks() {
  section "C1. ansible-core and the project"
  check "ansible-core is installed" command -v ansible
  report "version and config file" bash -c 'ansible --version | head -3'
  check "an inventory resolves" bash -c 'ansible-inventory --list >/dev/null 2>&1'

  section "C2. Connectivity to the managed nodes"
  check "ansible managed -m ping returns SUCCESS for both" \
    bash -c 'out=$(ansible managed -m ping 2>&1); echo "$out" | tail -6;
             [[ $(grep -c SUCCESS <<<"$out") -eq 2 ]]'
  check "become returns uid 0" \
    bash -c 'out=$(ansible managed -m command -a "id -u" --become 2>&1); echo "$out" | tail -4;
             ! grep -q "password is required" <<<"$out"'
  check "passwordless SSH works for $LABUSER" ssh_passwordless
  check "passwordless sudo works on both nodes" sudo_passwordless_remote

  section "C3. Subscription and repositories"
  check "both nodes have working RHEL repositories" repos_available

  section "C4. The blank disks the storage labs need"
  check "vdb and vdc are visible on both nodes" blank_disks_visible
}

# ------------------------------------------------------------------------------
lab_init "env" "Lab environment acceptance test" "$@"
info "lab user: $LABUSER"

if command -v virsh >/dev/null 2>&1; then
  run_host_checks
else
  skipped "the KVM host checks" "virsh is not installed — run this on the host as well"
fi

if command -v ansible >/dev/null 2>&1; then
  run_control_checks
else
  skipped "the control-node checks" "ansible is not installed — run this on rhel-control as well"
fi

section "The gate"
info "Every box in 00-Lab-Environment's acceptance list must pass before Week 1."
manual "You registered each node by hand at least once" \
  "subscription-manager register — it is itself an EX200 skill."

summary
