---
section: Guides
title: RHCSA Foundation Labs - Users Permissions and Storage
created: 2026-09-09
tags:
  - rhcsa
  - rhel
  - linux
  - labs
  - lvm
  - systemd
publish: true
garden: true
description: Fourteen requirement-driven RHCSA labs covering users, ACLs, sudo, SSH, systemd, journald, dnf, nmcli, partitions, LVM, NFS and autofs - with acceptance criteria instead of walkthroughs.
---

# RHCSA Foundation Labs - Users Permissions and Storage

Fourteen labs covering the core RHCSA ground. Each one states a **requirement**
and a set of **acceptance criteria**, and deliberately does not tell you which
commands to use. Hints are collapsed; open them only after a genuine attempt.

Part of [[RHCSA to RHCE - A 60-Day Lab Curriculum]]. Build the environment first:
[[Building a Three-Node RHEL Lab on KVM]].

> **Every lab ends with a reboot.** A configuration that works now but vanishes
> after a restart is not finished — it would score zero. Snapshot before each
> lab: `virsh snapshot-create-as rhel01 pre-lab`.

Run these on `rhel01` unless stated. Each lab has a checker:
`sudo ./verify 1.2`, `sudo ./verify 2.5`, and so on
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).

---

## Week 1

### Lab 1.1 — Navigation, vim, text processing (60 min)

**Requirement.** `/var/log` holds the system logs. Without leaving the terminal:

1. Produce `/root/reports/large-logs.txt` listing every file under `/var/log`
   larger than 100 KB, largest first, showing size and path only.
2. Produce `/root/reports/boot-errors.txt` containing every line of
   `/var/log/messages` (or the journal) that mentions `error` or `fail`,
   case-insensitively, with line numbers preserved.
3. Produce `/root/reports/users.csv` from `/etc/passwd` containing only username,
   UID and shell for accounts with UID ≥ 1000, comma-separated.
4. Do all editing in `vim`. No `nano`, no desktop editor.

**Acceptance criteria**

- [ ] All three files exist under `/root/reports/`
- [ ] `large-logs.txt` is sorted descending by real size, not lexically
- [ ] `boot-errors.txt` catches `Error`, `ERROR`, `failed` and `FAIL`
- [ ] `users.csv` has exactly three comma-separated fields per line and no root

**Verify**

```bash
head -5 /root/reports/large-logs.txt
awk -F, 'NF!=3 {print "BAD:", $0}' /root/reports/users.csv    # prints nothing
awk -F, '$2<1000' /root/reports/users.csv                     # prints nothing
```

> [!tip]- Hint
> `find -size`, `du`, `sort -h`, `grep -n -iE`, and `awk -F:` with `$3>=1000` and
> `OFS=,`. In vim: `:%s/old/new/g`, `:g/pattern/d`, `dd`, `yy`, `:wq`.

---

### Lab 1.2 — Users, groups and password policy (60 min)

**Requirement.** The team needs accounts:

- Group `developers`, GID **5000**. Group `contractors`.
- Users `amit`, `sara`, `raj` — primary group `developers`, homes under `/home`.
- User `vendor1` — member of `contractors`, must **not** have an interactive
  shell, home `/opt/vendor1`.
- `sara`'s password must expire every 30 days and warn 7 days before.
- `raj`'s account must be locked without being deleted.
- `amit` must be forced to change their password at first login.
- Any user created from now on must get UID ≥ 3000.

**Acceptance criteria**

- [ ] `developers` has GID exactly 5000
- [ ] `vendor1` cannot log in interactively but the account exists
- [ ] `sara` shows max 30 / warn 7 in `chage -l`
- [ ] `raj` is locked (`!` prefix in the shadow hash)
- [ ] A test user created afterwards gets a UID of 3000 or above

**Verify**

```bash
getent group developers            # GID 5000
getent passwd vendor1              # shell is nologin/false
chage -l sara | head -6
passwd -S raj                      # LK
useradd testuid && id -u testuid   # >= 3000
userdel -r testuid
```

**Reboot check** — mandatory. Re-run every command above.

> [!tip]- Hint
> `groupadd -g`, `useradd -g -s -d`, `chage -M -W -d 0`, `usermod -L`, and
> `/etc/login.defs` for `UID_MIN`.

---

### Lab 1.3 — Permissions, special bits and ACLs (75 min)

**Requirement.** Build a shared project area at `/srv/project`:

1. Owned by `root`, group `developers`.
2. Members of `developers` can create files there; **nobody can delete another
   user's files**, including their own group members.
3. Every new file created inside automatically belongs to group `developers`,
   regardless of who creates it.
4. `sara` gets read-write access to `/srv/project/reports` even though the
   directory's group is `developers`, and she must not be added to any new group.
5. `vendor1` gets read-only access to `/srv/project/public` — again without group
   membership changes.
6. New files in `/srv/project/reports` must inherit sara's access automatically.
7. Everything survives a reboot.

**Acceptance criteria**

- [ ] Sticky bit set on `/srv/project`
- [ ] SGID set, so group ownership is inherited
- [ ] Named ACL entry for `sara` = `rw` on `reports`
- [ ] Named ACL entry for `vendor1` = `r` on `public`
- [ ] A **default** ACL exists on `reports` so new files inherit it
- [ ] `amit` cannot delete a file created by `raj` in `/srv/project`

**Verify**

```bash
ls -ld /srv/project              # drwxrws--T or similar
getfacl /srv/project/reports
sudo -u raj  touch /srv/project/rajfile
sudo -u amit rm  /srv/project/rajfile     # must FAIL
```

> [!tip]- Hint
> `chmod 3770`, or `chmod g+s,o+t`. `setfacl -m u:sara:rw`, and the default ACL is
> `setfacl -d -m u:sara:rw`.

---

### Lab 1.4 — sudo and SSH key authentication (60 min)

**Requirement**

1. `developers` may run **only** `systemctl restart httpd` and
   `systemctl status httpd` as root, without a password. Nothing else.
2. `amit` may run any command as root, but must type their password.
3. Key-based SSH login from the control node to rhel01 as `amit` must work.
4. Password authentication over SSH must be **disabled entirely**.
5. Root must not be able to log in over SSH.
6. SSH must listen on port **2222** in addition to 22.

**Acceptance criteria**

- [ ] `sudo -l -U amit` shows ALL, with password
- [ ] A `developers` member can restart httpd without a password
- [ ] The same member cannot run `sudo systemctl restart sshd`
- [ ] `ssh amit@rhel01` works with the key and no password prompt
- [ ] `ssh -o PubkeyAuthentication=no amit@rhel01` is refused
- [ ] `ssh -p 2222 amit@rhel01` works, and `ssh root@rhel01` is refused

**Reboot check** — mandatory. Port 2222 also needs firewalld **and** SELinux to
allow it. If you skipped either, this is where it fails. That is the point.

> [!tip]- Hint
> `/etc/sudoers.d/` plus `visudo -c`. In `sshd_config`:
> `PasswordAuthentication no`, `PermitRootLogin no`, `Port 22` / `Port 2222`. Then
> `semanage port -a -t ssh_port_t -p tcp 2222` and `firewall-cmd --add-port`.

---

### Lab 1.5 — Find, archives, compression (45 min)

**Requirement**

1. Create `/root/backup/etc-$(date +%F).tar.gz` containing all of `/etc`,
   preserving permissions, ownership **and SELinux contexts**.
2. Create `/root/backup/logs.tar.bz2` containing every `*.log` file under
   `/var/log` modified in the last 7 days — and nothing else.
3. Find every file on the system owned by `amit` outside `/home`.
4. Write every SUID file on the system to `/root/reports/suid.txt`.
5. Extract only `etc/hostname` from the first archive into `/tmp/restore/`
   without extracting anything else.

**Acceptance criteria**

- [ ] Both archives exist in the correct compression formats
- [ ] `logs.tar.bz2` contains only `.log` files, all recent
- [ ] `/tmp/restore/etc/hostname` exists, and nothing else does
- [ ] `suid.txt` includes `/usr/bin/passwd` and `/usr/bin/sudo`

**Verify**

```bash
file /root/backup/*.tar.*
tar tjf /root/backup/logs.tar.bz2 | grep -cv '\.log$'    # must be 0
ls -R /tmp/restore
```

> [!tip]- Hint
> `tar --selinux --acls --xattrs -czpf`, `find -mtime -7 -name '*.log'` piped with
> `-print0` into `tar -T -`, and `find / -perm -4000 -type f`.

---

### Lab 1.6 — Bash scripting (60 min)

**Requirement.** Write `/usr/local/bin/sysreport`, executable by root only, that:

1. Accepts an optional `-o FILE` argument; defaults to stdout.
2. Prints hostname, kernel version, uptime and RHEL version.
3. Prints the top 5 processes by memory.
4. Prints every filesystem over 80% full, or `OK` if none.
5. Prints any systemd unit in a failed state, or `OK` if none.
6. Exits **1** if any filesystem is over 80% or any unit failed; **0** otherwise.
7. Fails cleanly with a usage message on an unknown flag.

**Acceptance criteria**

- [ ] Runs from any directory without a path prefix
- [ ] `sysreport -o /tmp/r.txt` writes the file and prints nothing
- [ ] `echo $?` reflects the health state correctly
- [ ] `sysreport --bogus` prints usage and exits non-zero
- [ ] Begins with a shebang and uses `set -euo pipefail`

**Verify**

```bash
sysreport -o /tmp/r.txt && echo healthy || echo "problem found"
sysreport --bogus; echo "exit=$?"
sudo systemctl start nonexistent.service 2>/dev/null; sysreport; echo $?
```

> [!tip]- Hint
> `while getopts` or a `case` loop over `$@`, `df -h --output=pcent,target`,
> `systemctl --failed --no-legend`, `ps --sort=-%mem`.

---

### Lab 1.7 — Week 1 consolidation, timed (90 min)

Revert to the `clean` snapshot first. **90 minutes, no notes, no internet.**

From a fresh machine:

1. Group `ops` (GID 4000); users `dev1`, `dev2` in it; `svcacct` with no shell.
2. `/srv/ops` — group-owned by `ops`, SGID, sticky, group-writable.
3. `dev1` may run all commands via sudo without a password; `dev2` may not use
   sudo at all.
4. An ACL giving `svcacct` read-only on `/srv/ops`, inherited by new files.
5. SSH: key-only, root login denied.
6. `/usr/local/bin/opscheck` reporting failed units, exiting 1 when any exist.
7. A gzip archive of `/etc/ssh` at `/root/ssh-backup.tar.gz` preserving contexts.
8. **Everything survives a reboot.**

Score yourself honestly. Anything you had to look up is your week 2 revision
list — write those items down.

---

## Week 2

### Lab 2.1 — systemd services and targets (60 min)

**Requirement**

1. Install `httpd` and make it start automatically at boot.
2. Create a custom service `siteguard.service` running `/usr/local/bin/siteguard`
   (a script that appends a timestamp to `/var/log/siteguard.log` and exits 0),
   which starts after the network is online, restarts automatically on failure,
   and is enabled at boot.
3. The system must boot to a **multi-user** target, never graphical.
4. Mask `debug-shell.service` so it can never be started.
5. Identify which unit is the slowest to start at boot.

**Acceptance criteria**

- [ ] `httpd` enabled and active
- [ ] `siteguard.service` enabled, and its log grows after a reboot
- [ ] `systemctl get-default` → `multi-user.target`
- [ ] `systemctl start debug-shell` fails because it is masked
- [ ] You can name the slowest unit

**Verify**

```bash
systemctl cat siteguard.service
systemctl start debug-shell.service          # must fail
systemd-analyze blame | head -5
```

**Reboot check** — mandatory. Confirm `/var/log/siteguard.log` gained a line
*on this boot*, not a previous one.

> [!tip]- Hint
> Unit files in `/etc/systemd/system/`, `[Unit] After=network-online.target`,
> `[Service] Restart=on-failure`, `[Install] WantedBy=multi-user.target`, then
> `systemctl daemon-reload`.

---

### Lab 2.2 — Processes, journald, scheduled tasks (60 min)

**Requirement**

1. Make the journal **persistent** across reboots, capped at 200 MB.
2. Find every process owned by `amit` and terminate them all with one command.
3. Start a long-running process, renice it to priority 10, and prove it.
4. A cron job as `amit` running `/usr/local/bin/sysreport -o /tmp/hourly.txt` at
   the top of every hour.
5. A **systemd timer** (not cron) running the same script daily at 02:30, with
   the run persisted if the machine was off.
6. `dev2` must be forbidden from using cron at all.

**Acceptance criteria**

- [ ] `/var/log/journal/` exists and survives a reboot
- [ ] `journalctl --disk-usage` respects the 200 MB cap
- [ ] The timer shows a NEXT run at 02:30 and `Persistent=true`
- [ ] `crontab -e` as `dev2` is denied
- [ ] Yesterday's boot is readable via `journalctl -b -1`

**Reboot check** — mandatory; this lab is mostly *about* persistence.

> [!tip]- Hint
> `Storage=persistent` and `SystemMaxUse=200M` in `journald.conf`.
> `/etc/cron.deny`. `pkill -u`. A timer needs both `.timer` and `.service` units,
> with `OnCalendar=*-*-* 02:30:00` and `Persistent=true`.

---

### Lab 2.3 — dnf, rpm, repositories (45 min)

**Requirement**

1. Configure a repository from a local directory `/repo` containing at least one
   RPM you place there, with gpgcheck disabled, named `locallab`.
2. Install a package from it.
3. Find which package owns `/etc/hosts`, and which files a given package installs.
4. Install the `container-tools` module/group, then list what came with it.
5. Downgrade a package, then roll the transaction back using dnf history.
6. List every package installed in the last 24 hours.

**Acceptance criteria**

- [ ] `dnf repolist` shows `locallab` as enabled
- [ ] The local package installs cleanly
- [ ] You can name the owner of `/etc/hosts` without guessing
- [ ] `dnf history undo` successfully reverses the downgrade

> [!tip]- Hint
> `createrepo_c /repo`, then a `.repo` file in `/etc/yum.repos.d/` with
> `baseurl=file:///repo`. `dnf history undo <ID>`.

---

### Lab 2.4 — Networking with nmcli (60 min)

**Requirement.** Without ever editing a file in
`/etc/sysconfig/network-scripts` by hand:

1. Create a connection profile named `lab-static` on the primary interface with a
   **static** address `192.168.124.11/24`, gateway `192.168.124.1`, DNS
   `192.168.124.1` and `8.8.8.8`, search domain `lab.local`.
2. Set the hostname to `rhel01.lab.local` permanently.
3. Add a second IP `192.168.124.51/24` to the same profile.
4. Ensure the profile autoconnects at boot.
5. Confirm name resolution and outbound connectivity still work.

**Acceptance criteria**

- [ ] `nmcli con show lab-static` reports the static addresses
- [ ] `hostnamectl` shows the FQDN
- [ ] Both IPs respond to ping from another node
- [ ] Connectivity survives `nmcli con down`/`up` **and** a reboot

**Reboot check** — mandatory. A static IP that reverts to DHCP after a reboot is
a zero-mark answer.

> [!tip]- Hint
> `nmcli con add type ethernet con-name lab-static ifname ens3 ipv4.method manual
> ipv4.addresses ... ipv4.gateway ... ipv4.dns "..."`, then `nmcli con up`. Add a
> second address with `+ipv4.addresses`. `hostnamectl set-hostname`.

---

### Lab 2.5 — Partitions, filesystems, swap, fstab (75 min)

Uses the blank disk `/dev/vdb`.

**Requirement**

1. Partition `/dev/vdb`: a 2 GB partition, a 1 GB partition, and leave the rest
   free.
2. Format the 2 GB partition XFS, labelled `DATA`; mount persistently at `/data`
   **by UUID**.
3. Make the 1 GB partition swap and activate it persistently with priority 10.
4. Mount `/data` with `noexec` and `nodev`.
5. Prove that a script in `/data` cannot execute.
6. Grow the XFS filesystem after enlarging its partition to 4 GB.

**Acceptance criteria**

- [ ] `/data` mounted from a **UUID** entry, not `/dev/vdb1`
- [ ] `swapon --show` lists the partition with priority 10
- [ ] Executing a script under `/data` fails with permission denied
- [ ] `df -h /data` shows ~4 GB after the grow
- [ ] A reboot changes nothing

**Reboot check** — mandatory, and this is the classic exam killer. A wrong
`/etc/fstab` line can leave the box unbootable. Snapshot first, and run
`findmnt --verify` **before** you reboot, every time.

> [!tip]- Hint
> `parted`/`fdisk`, `mkfs.xfs -L`, `mkswap`, `blkid`, the fstab field order,
> `xfs_growfs` (XFS grows only, never shrinks), and `mount -a` to test *before*
> rebooting.

---

### Lab 2.6 — LVM (75 min)

Uses `/dev/vdc`. This is the canonical example of learning by requirement:

> Add a new disk → create a PV → add it to a VG → extend an LV by 5 GB → grow the
> XFS filesystem → make sure everything survives a reboot.

Concretely:

1. Volume group `vgdata` with a 16 MB extent size, built on `/dev/vdc`.
2. Logical volume `lvapp`, 4 GB, XFS, mounted persistently at `/app`.
3. Logical volume `lvlogs`, 2 GB, ext4, mounted persistently at `/applogs`.
4. Extend `lvapp` by 5 GB and grow its filesystem online, with no unmount.
5. Reduce `lvlogs` to 1 GB — note which filesystem allows this and which does not.
6. Create a 500 MB snapshot of `lvapp`, then remove it.

**Acceptance criteria**

- [ ] `vgs` shows `vgdata` with a 16 MB extent size
- [ ] `/app` is ~9 GB after extension, with no downtime
- [ ] `/applogs` is 1 GB after reduction and still mounts
- [ ] Both mounts persist across a reboot
- [ ] You can explain why shrinking XFS is impossible

> [!tip]- Hint
> `pvcreate`, `vgcreate -s 16M`, `lvcreate -L 4G -n`, and `lvextend -L +5G -r`
> (the `-r` resizes the filesystem for you). For an ext4 shrink: unmount →
> `e2fsck -f` → `resize2fs` → `lvreduce`. XFS cannot shrink, ever.

---

### Lab 2.7 — NFS, autofs and consolidation (90 min)

**Requirement**

1. On **rhel02**: export `/srv/share` read-write to rhel01 only, and
   `/srv/home-dirs` read-write for home directories.
2. On **rhel01**: mount `rhel02:/srv/share` persistently at `/mnt/share`.
3. Configure **autofs** on rhel01 so `/net/data` mounts `rhel02:/srv/share` on
   demand and unmounts after 60 seconds idle.
4. Configure autofs so `amit`'s home directory is served from
   `rhel02:/srv/home-dirs/amit` on login.
5. The firewall on rhel02 must permit NFS and nothing extra.

**Acceptance criteria**

- [ ] `showmount -e rhel02` from rhel01 lists both exports
- [ ] `/mnt/share` is writable from rhel01 and persists across a reboot
- [ ] `ls /net/data` triggers the mount; it disappears after the idle timeout
- [ ] `su - amit` lands in the NFS-served home
- [ ] `firewall-cmd --list-services` on rhel02 shows nfs, mountd, rpc-bind only

**Reboot check** — mandatory on **both** nodes.

> [!tip]- Hint
> `/etc/exports` plus `exportfs -rav`. Direct versus indirect autofs maps in
> `/etc/auto.master.d/*.autofs`, `--timeout=60`, and a wildcard `*` with `&` for
> homes.

---

## The gate

Do not move on until every box is ticked. Week 3 layers security on top of all
of this, and a shaky foundation here shows up as lost marks later.

- [ ] I can add a disk, build LVM on it and grow a filesystem without notes
- [ ] I can configure a static IP with nmcli without notes
- [ ] I can write a systemd unit and timer from memory
- [ ] I can set ACLs, including default ACLs, without notes
- [ ] I have rebooted after every lab and fixed what broke
- [ ] Nothing on my week 1 "had to look up" list is still unresolved

→ Next: [[RHCSA Security Labs - SELinux firewalld and Boot Recovery]]
