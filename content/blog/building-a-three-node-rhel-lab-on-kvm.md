---
section: Guides
title: Building a Three-Node RHEL Lab on KVM
created: 2026-09-09
tags:
  - rhel
  - kvm
  - libvirt
  - rhcsa
  - rhce
  - labs
publish: true
garden: true
series: RHCSA → RHCE
series_order: 2
series_group: Start here
description: Build a three-node RHEL lab on KVM/libvirt with thin qcow2 overlays, cloud-init and instant snapshot recovery - the environment the RHCSA and RHCE labs run on.
---

# Building a Three-Node RHEL Lab on KVM

Three nodes on one Linux box, running **real RHEL** from the no-cost Red Hat
Developer subscription — so `subscription-manager`, the RHEL repositories and
SELinux behave exactly as they will in an exam. A CentOS or Rocky substitute gets
you most of the way, but you will miss the subscription and repository work,
which is itself examinable.

```text
              CONTROL NODE
               rhel-control          192.168.124.10
               2 vCPU / 2 GB
                    │
             ┌──────┴──────┐
             │             │
          SSH/Ansible   SSH/Ansible
             │             │
             ▼             ▼
          rhel01          rhel02
      192.168.124.11  192.168.124.12
       1 vCPU / 1 GB   1 vCPU / 1 GB
       + 2 blank disks + 2 blank disks   ← for the LVM/partition labs
```

Total footprint is about 4 GB of RAM and, thanks to thin overlays, a few hundred
megabytes of disk beyond the single base image.

This is the environment used by
[[rhcsa-to-rhce-a-60-day-lab-curriculum|RHCSA to RHCE - A 60-Day Lab Curriculum]]. Scripts:
**[github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)**

## 1. Host prerequisites

```bash
# Fedora/RHEL host
sudo dnf install -y qemu-kvm libvirt virt-install virt-manager \
                    libguestfs-tools cloud-utils genisoimage
sudo systemctl enable --now libvirtd
sudo usermod -aG libvirt "$USER"     # log out and back in afterwards

# sanity
virt-host-validate | grep -i kvm
virsh net-list --all                  # 'default' should be active
```

If `default` is inactive: `virsh net-start default && virsh net-autostart default`.

## 2. Get the RHEL image

1. Create a free account and join the **Red Hat Developer Subscription for
   Individuals** at <https://developer.redhat.com>.
2. Download the **KVM Guest Image** (qcow2) — *not* the DVD ISO. Downloads →
   Red Hat Enterprise Linux → *KVM Guest Image*.
3. Put it at `~/rhce-lab/base/rhel-base.qcow2`.

The guest image matters: it ships with `cloud-init`, which is what lets the build
script create users, install SSH keys and set static addresses without touching
an installer.

## 3. The build script

`lab-build.sh` creates each node as a thin qcow2 **overlay** on the single base
image, so a full three-node rebuild costs seconds and almost no disk.

```bash
LAB_DIR=~/rhce-lab ./lab-build.sh
```

What it does per node:

- `qemu-img create -f qcow2 -F qcow2 -b <base>` — a copy-on-write overlay grown
  to 20 GB, rather than a copy of the base image.
- Two extra blank 10 GB disks on `rhel01` and `rhel02`, which the partition and
  LVM labs need. Without these, half of week 2 cannot be done.
- A `cloud-init` seed ISO carrying your user, your SSH public key, passwordless
  sudo, the hostname and an `/etc/hosts` block naming all three nodes.
- A pinned DHCP reservation on the libvirt `default` network, so the inventory
  never drifts.

Edit two things before you run it: the `users:` block in the cloud-config (your
name, your key) and `LAB_PASS`, which defaults to something obvious because this
is a throwaway lab on a private network. Do not carry that habit anywhere else.

The companion `lab-destroy.sh` removes all three domains and their storage, so
the pair gives you a clean rebuild in under a minute.

> **Reboot the nodes once after the first build** so the pinned DHCP leases take
> effect, then `ssh <you>@192.168.124.10`.

## 4. Register the subscription

On **each** node. Do this by hand at least once before you automate it — it is an
RHCSA-relevant skill in its own right:

```bash
sudo subscription-manager register --username <rh-login>
sudo subscription-manager attach --auto        # no-op under simple content access
sudo subscription-manager repos --list-enabled
sudo dnf repolist
```

## 5. Snapshots — the single most valuable habit here

Break-fix practice is only sustainable if recovery is instant. Take a clean
snapshot **before** every destructive lab.

```bash
# once the lab is built, registered and known-good
for n in rhel-control rhel01 rhel02; do
  virsh snapshot-create-as "$n" clean "Registered, pre-lab baseline"
done

virsh snapshot-create-as rhel01 pre-lab    # before a break-fix drill
virsh snapshot-revert   rhel01 clean       # recovery, in seconds
virsh snapshot-list     rhel01
virsh snapshot-delete   rhel01 pre-lab
```

> **Snapshot the *clean registered* state, not the empty state.** Reverting past
> subscription registration means re-registering every single time, which gets
> old by the sixth lab.

## 6. Control-node setup

```bash
sudo dnf install -y ansible-core
ansible --version

ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519      # if not already done
ssh-copy-id <you>@rhel01
ssh-copy-id <you>@rhel02

mkdir -p ~/ansible && cd ~/ansible
```

`~/ansible/ansible.cfg`:

```ini
[defaults]
inventory      = ./inventory
remote_user    = <you>
host_key_checking = False
roles_path     = ./roles
collections_path = ./collections

[privilege_escalation]
become        = True
become_method = sudo
become_user   = root
become_ask_pass = False
```

`~/ansible/inventory`:

```ini
[web]
rhel01

[db]
rhel02

[prod]
rhel01

[dev]
rhel02

[managed:children]
web
db
```

Two hosts in four overlapping groups is deliberate: it lets the variable
precedence and environment-separation labs in
[[advanced-ansible-labs-roles-templates-and-vault|Advanced Ansible Labs - Roles Templates and Vault]] work on a two-node lab.

> **The `ansible.cfg` trap.** Ansible silently ignores an `ansible.cfg` that
> lives in a **world-writable** directory. If your config seems to have no
> effect, check the directory permissions before you check anything else.

## 7. Acceptance test

Do not start week 1 until every line passes.

```bash
virsh list --all                                  # 3 nodes running
ssh <you>@rhel01 'hostname; sudo whoami'          # rhel01 / root, no password
ssh <you>@rhel02 'sudo dnf repolist'              # RHEL repos, not "no repos"
lsblk                                             # on rhel01: vdb and vdc, 10G, unpartitioned
ansible managed -m ping                           # SUCCESS from the control node
ansible managed -m command -a 'id' --become       # uid=0(root)
virsh snapshot-list rhel01 | grep clean           # baseline snapshot exists
```

Or run the checker, which tests all of that plus a few things the list above
misses — that the images really are overlays rather than full copies, that the
extra disks are attached, and that passwordless sudo works over SSH rather than
just locally:

```bash
sudo ./verify env        # on the KVM host, and again on the control node
```

Each side checks what only it can see, so run it in both places.

- [ ] All three nodes build and boot
- [ ] Passwordless SSH **and** passwordless sudo from control to both managed nodes
- [ ] `ansible managed -m ping` returns SUCCESS for both
- [ ] Blank disks visible on rhel01 and rhel02
- [ ] `clean` snapshot taken on all three

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `virt-install` fails on `--osinfo` | Wrong variant name → `virt-install --osinfo list \| grep rhel` |
| Node boots but has no IP | `default` network is down → `virsh net-start default` |
| The cloud-init user does not exist | You used the DVD ISO, not the KVM guest image |
| SSH asks for a password | Wrong public key path in the build script, or `~/.ssh` permissions |
| `ansible -m ping` → `sudo: a password is required` | `NOPASSWD` missing; check `/etc/sudoers.d/90-cloud-init-users` |
| Disk fills up fast | You copied the base image instead of creating an overlay — `qemu-img info` should show a backing file |

## Next

→ [[rhcsa-foundation-labs-users-permissions-and-storage|RHCSA Foundation Labs - Users Permissions and Storage]]
