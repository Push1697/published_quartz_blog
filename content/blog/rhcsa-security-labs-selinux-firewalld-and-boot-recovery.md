---
section: Troubleshooting
title: RHCSA Security Labs - SELinux firewalld and Boot Recovery
created: 2026-09-09
tags:
  - rhcsa
  - rhel
  - selinux
  - firewalld
  - troubleshooting
  - labs
publish: true
garden: true
series: RHCSA → RHCE
series_order: 4
series_group: Month 1 — Core RHEL
description: SELinux contexts and booleans, firewalld zones and rich rules, the four boot failures, and a saboteur script that breaks a RHEL box ten different ways so you can practise repairing it.
---

# RHCSA Security Labs - SELinux firewalld and Boot Recovery

Week 3 of [[rhcsa-to-rhce-a-60-day-lab-curriculum|RHCSA to RHCE - A 60-Day Lab Curriculum]]. SELinux, firewalld and
boot recovery — and then you deliberately destroy things and repair them.

> **The rule for this week: no search engine, no AI, no notes from previous
> weeks.** Only what is on the machine: `man`, `--help`, `/usr/share/doc`,
> `apropos`. If you cannot fix it from the box itself, you cannot fix it in the
> exam.

Snapshot before every drill: `virsh snapshot-create-as rhel01 pre-lab`.
Checkers: `sudo ./verify 3.1` … `3.4`, and `sudo ./verify breakfix`
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).

---

## Lab 3.1 — Contexts, booleans and ports (75 min)

**Requirement**

1. Confirm SELinux is **enforcing** and will stay that way after a reboot.
2. Serve a website from `/web/site` instead of `/var/www/html`. Apache must be
   able to read it with SELinux enforcing — do **not** disable SELinux, and do
   **not** use `chcon` (the fix must survive a full filesystem relabel).
3. Allow Apache to make outbound network connections to a database.
4. Move `sshd` to port 2222 with SELinux enforcing.
5. Allow Apache to serve content from an NFS-mounted directory.
6. Set the default context for `/web(/.*)?` so anything created there is labelled
   correctly from the start.

**Acceptance criteria**

- [ ] `getenforce` → Enforcing, and `/etc/selinux/config` agrees
- [ ] `curl http://localhost` returns the page from `/web/site`
- [ ] `restorecon -Rv /web` makes **no** changes, proving the policy is right
- [ ] `semanage port -l | grep ssh` includes 2222
- [ ] The relevant booleans are persistent, not runtime-only

**Verify**

```bash
getenforce; grep ^SELINUX= /etc/selinux/config
semanage fcontext -l | grep '^/web'
getsebool -a | grep -E 'httpd_can_network_connect|httpd_use_nfs'
restorecon -Rvn /web            # dry run: must output nothing
```

**Reboot check** — mandatory. A `setsebool` without `-P` disappears on reboot;
that is a zero-mark answer, and this lab is designed to catch it.

> [!tip]- Hint
> `semanage fcontext -a -t httpd_sys_content_t "/web(/.*)?"` then
> `restorecon -Rv /web`. `setsebool -P httpd_can_network_connect on`.
> `semanage port -a -t ssh_port_t -p tcp 2222`.

---

## Lab 3.2 — Reading SELinux denials (60 min)

**Requirement.** Have someone (or the saboteur below) break a service, then
diagnose it **from the audit log alone**:

1. Find the denial.
2. Translate it into plain English — which process, which target, which
   permission.
3. Decide whether the correct fix is a context change, a boolean, or a port
   definition. Justify the choice **before** applying it.
4. Apply the minimal fix. Never `setenforce 0`, never a blanket policy module.

**Acceptance criteria**

- [ ] You can locate the denial without knowing in advance what was broken
- [ ] The fix is minimal and targeted
- [ ] SELinux remains enforcing throughout
- [ ] You wrote down the reasoning before applying the fix

**Verify**

```bash
ausearch -m AVC -ts recent
sealert -a /var/log/audit/audit.log | head -40
journalctl -t setroubleshoot --since -10min
```

> **The trap.** `audit2allow` will happily generate a policy module that "fixes"
> anything. In an exam that is almost always the wrong answer — it papers over a
> mislabelled file. Reach for `semanage fcontext` and `restorecon` first.

The checker for this lab can tell the difference: take a baseline of loaded
policy modules on a clean box (`sudo ./verify 3.2 --snapshot`), and a later run
will report whether your repair added a generated module.

---

## Lab 3.3 — firewalld zones, services, ports, rich rules (75 min)

**Requirement**

1. Default zone `public`; only SSH reachable from anywhere.
2. Zone `internal` containing the `192.168.124.0/24` source, permitting http,
   https and nfs.
3. Open TCP 8080 permanently in `public`, and confirm SELinux also permits Apache
   to bind it.
4. A rich rule rejecting all traffic from `192.168.124.99`, with a log entry.
5. Forward port 8080 → 80 on the same host.
6. Everything permanent — nothing runtime-only.

**Acceptance criteria**

- [ ] `firewall-cmd --list-all-zones` shows the intended layout
- [ ] From the other node, `curl rhel01:8080` succeeds
- [ ] The `--permanent` config matches the runtime config exactly
- [ ] Surviving a reboot changes nothing

**Verify**

```bash
firewall-cmd --get-default-zone
firewall-cmd --list-all --zone=internal
diff <(firewall-cmd --list-all) <(firewall-cmd --permanent --list-all)
```

> [!tip]- Hint
> `--permanent` then `--reload`, or configure the runtime and commit with
> `--runtime-to-permanent`. Rich rule syntax:
> `--add-rich-rule='rule family=ipv4 source address=192.168.124.99 log prefix="BLOCK" reject'`.

---

## Lab 3.4 — The four boot failures (90 min)

Snapshot first. Each of these is a real exam scenario.

**Requirement**

1. **Lost root password.** Reset it from the GRUB prompt with no existing access.
   SELinux must still be correct afterwards.
2. **Broken `/etc/fstab`.** Add a bogus entry referencing a non-existent UUID,
   reboot, land in emergency mode, and recover.
3. **Wrong default target.** Set the system to boot to `rescue.target`, reboot,
   and restore multi-user from there.
4. **Missing boot entry.** Regenerate the GRUB configuration after a kernel
   update leaves the menu broken.

**Acceptance criteria**

- [ ] Root password reset without external media
- [ ] You know why `/.autorelabel` matters after a password reset
- [ ] Recovered from emergency mode by fixing fstab, not by reinstalling
- [ ] `systemctl set-default multi-user.target` restored and verified by reboot
- [ ] GRUB config regenerated at the correct path for the boot mode (BIOS vs UEFI)

**Verify**

```bash
findmnt --verify --verbose        # validates fstab BEFORE you reboot
mount -a                          # must be silent
ls /boot/grub2/grub.cfg /boot/efi/EFI/*/grub.cfg 2>/dev/null
```

> [!tip]- Hint
> At GRUB: press `e`, append `rd.break` to the kernel line, `Ctrl-x`, then
> `mount -o remount,rw /sysroot`, `chroot /sysroot`, `passwd`,
> `touch /.autorelabel`, exit twice.
>
> **`findmnt --verify` before every reboot** is the habit that prevents fstab
> disasters entirely.

---

## The break-fix drills

This is the most valuable block of the entire curriculum.

`break/break.sh` injects one of ten single-cause faults. Run it yourself and wait
long enough to forget which one you picked, or better, have someone else run it.
`./break.sh random` is the honest version.

```bash
sudo ./break.sh list      # fstab selinux_ctx selinux_port firewall service
                          # perms repo dns sudo mount
sudo ./break.sh random
```

Each fault is a realistic one-liner: a bogus fstab UUID, a document root
relabelled with `chcon`, a service moved to an unlabelled port, an `http` service
removed from the firewall, an invalid directive appended to `httpd.conf`,
over-permissive SSH key permissions, a repo pointed at nowhere, a bogus DNS
server, a commented-out `%wheel` line, a mount commented out of fstab.

### The drill

```text
Symptom
   ↓
Reproduce it deliberately        ← never fix what you cannot reproduce
   ↓
Read the logs (journalctl -xe, /var/log, ausearch)
   ↓
Form ONE hypothesis
   ↓
Test the hypothesis
   ↓
Fix minimally
   ↓
Verify
   ↓
REBOOT
   ↓
Verify again
```

Time yourself. Target: **under 10 minutes per fault**, closed-book.

Afterwards run `sudo ./verify breakfix`, which has one section per fault the
script can inject. It is the fastest way to catch the classic mistake — fixing
the symptom you were looking for and leaving a second fault behind.

Keep a log. It becomes your revision list before the mock exams:

| Date | Fault | Time to fix | First hypothesis right? | What gave it away |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

### Diagnostic reflexes worth drilling

| Symptom | First three commands |
| --- | --- |
| Service will not start | `systemctl status -l`, `journalctl -xeu <unit>`, config syntax check |
| Service runs, unreachable | `ss -tlnp`, `firewall-cmd --list-all`, `ausearch -m AVC -ts recent` |
| Permission denied despite correct `ls -l` | `ls -Z`, `ausearch -m AVC`, `getfacl` |
| Works until reboot | `systemctl is-enabled`, `grep /etc/fstab`, `setsebool` without `-P` |
| Cannot resolve names | `resolvectl status`, `cat /etc/resolv.conf`, `nmcli con show` |
| SSH key auth fails | `ls -ld ~/.ssh`, `journalctl -u sshd`, `sshd -T \| grep -i pubkey` |
| dnf fails | `dnf repolist --all`, `dnf clean all`, check `baseurl` reachability |
| Disk full but `du` disagrees | `lsof +L1`, deleted-but-open file handles |

When these ten faults stop being interesting, the harder set is in
[[ten-advanced-rhel-break-fix-drills|Ten Advanced RHEL Break-Fix Drills]] — one symptom with three causes, faults
that only appear after a reboot, and a permissions problem that is not one.

---

## The gate

By now, given a blank RHEL VM and a written requirement, you should build it
without searching. Test yourself: revert to `clean`, then complete lab 1.7 plus
labs 2.5 and 2.6 in **two hours total**, closed-book.

- [ ] SELinux was never disabled to make something work
- [ ] Every fault in `break.sh list` fixed in under 10 minutes
- [ ] `findmnt --verify` is now automatic before any reboot
- [ ] I can reset a root password from GRUB from memory

→ Next: [[rhcsa-container-and-kernel-labs|RHCSA Container and Kernel Labs]]
