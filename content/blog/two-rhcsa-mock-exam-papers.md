---
section: Reference
title: Two RHCSA Mock Exam Papers
created: 2026-09-09
tags:
  - rhcsa
  - rhel
  - exam
  - mock
  - labs
publish: true
garden: true
description: Two full 2.5-hour RHCSA mock papers with every ambiguous value pinned, plus a hostile third variant, and a grader that scores tasks fully correct out of 300 against the real 210 pass mark.
---

# Two RHCSA Mock Exam Papers

Two complete papers, sat under real conditions. Every value is pinned —
usernames, UIDs, GIDs, sizes, ports, profile names — so that grading is
deterministic and you cannot argue with the result.

Part of [[RHCSA to RHCE - A 60-Day Lab Curriculum]]. Graders:
`./verify ex200-a --spec` and `./verify ex200-b --spec` print these papers;
`sudo ./verify ex200-a --after-reboot` scores them
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).

## The conditions

- **2.5 hours**, timer visible.
- **Closed book** — only `man`, `--help` and `/usr/share/doc`. No search engine,
  no notes, no AI.
- Revert the node to its `clean` snapshot first.
- **Graded after a reboot.** Anything that does not survive scores zero.

That last point is not a technicality. Red Hat exams are performance based and
graded on the state of the machine after a restart, so grade yourself the same
way. Reboot, then check.

## How to score it

The grader runs one section per task, and a task scores only if **every** check
in it passes. That is how Red Hat grades: partial credit does not exist for a
task whose configuration does not survive a reboot.

```bash
./verify ex200-b --spec > ~/paper.txt     # print the paper
# ... 2.5 hours ...
sudo reboot
sudo ./verify ex200-b --after-reboot      # score it
```

Output is tasks fully correct, scaled to 300 against the real **210 pass mark
(70%)**.

> **The go/no-go rule.** Two consecutive mocks at **85% or above**, with
> everything surviving a reboot, means sit the exam. Below 70% means move the
> booking by a week. Sitting it unprepared costs more time than rescheduling.

---

## Mock A

1. Set the hostname to `server-a.lab.local`, permanently.
2. Configure a static IP on the primary interface with two DNS servers and the
   search domain `lab.local`. It must survive a reboot.
3. Group `finance`, GID 6000. Users `fin1` and `fin2` in it. `fin2` must not be
   able to log in interactively.
4. `fin1`'s password expires in 45 days, with a 10-day warning.
5. `/srv/finance` — group-owned by `finance`, group-writable, users cannot delete
   each other's files, new files inherit the group.
6. Read-only ACL for user `auditor` on `/srv/finance`, inherited by new files,
   with no change to group membership.
7. A 3 GB XFS filesystem from the blank disk, mounted at `/finance` by UUID, with
   `nodev`.
8. 1 GB of swap, persistent.
9. Volume group `vgapp` with 32 MB extents; a 2 GB logical volume mounted at
   `/appdata`; then extend it to 5 GB with the filesystem grown.
10. httpd installed and enabled, serving from `/finance/www`, SELinux enforcing.
11. http open in the firewall, permanently.
12. A systemd timer running `/usr/local/bin/audit.sh` daily at 03:00, persistent.
13. The journal persistent and capped at 300 MB.
14. `fin2` denied the use of cron.
15. Reset the root password from GRUB (simulate the lockout).

---

## Mock B

1. A repository named `locallab` from the local directory `/repo`, gpgcheck off,
   and a package installed from it.
2. Three users: `ops1` with UID 3101, `ops2`, and `svc1` with UID 3199 and no
   interactive shell.
3. `/srv/shared` — every new file created there is group-owned by `developers`
   automatically.
4. A default ACL on `/srv/shared` giving user `qa1` write access to new files.
5. Volume group `vgdata` on a blank disk; logical volume `lvapp`, XFS, mounted at
   `/app`; extended by 2 GB to 6 GB with the filesystem grown online.
6. Logical volume `lvlogs`, ext4, mounted at `/applogs`, reduced to 1 GB safely.
7. The second node exports `/srv/share`; this node mounts it persistently at
   `/mnt/share`.
8. autofs mounts that share at `/net/data` on demand, with a 60-second timeout.
9. A **rootless container** serving a page on port 8080 from `/opt/webdata`,
   auto-started at boot via a systemd `--user` unit with lingering enabled.
10. sshd moved to port 2222, with SELinux enforcing and the firewall open.
11. Every SUID file on the system listed in `/root/reports/suid.txt`.
12. `/usr/local/bin/unitcheck` — exits non-zero when any systemd unit has failed.
13. The tuned profile `virtual-guest`, set persistently.
14. A non-default kernel set as the permanent default.
15. `/etc/fstab` arranged so a failed mount does **not** prevent the machine
    booting.

---

## Mock C — hostile

Mock B, on a machine you have already wrecked. Repair the estate first, then
complete the tasks, in the same 2.5 hours.

```bash
virsh snapshot-create-as rhel01 pre-mock
sudo ./break.sh all                       # ten single-cause faults
sudo ./break/break-advanced.sh combo --yes   # three harder ones
sudo reboot
```

Grade with all three: `./verify breakfix`, `./verify advanced`, `./verify ex200-b`.

If Mock C is comfortable, you are ready. Inheriting a broken estate and being
asked to configure it further is much closer to both the exam and the job than a
clean machine ever is.

The faults are described in
[[RHCSA Security Labs - SELinux firewalld and Boot Recovery]] and
[[Ten Advanced RHEL Break-Fix Drills]].

---

## Recording results

| Mock | Date | Score | Time used | Weak areas |
| --- | --- | --- | --- | --- |
| A |  |  |  |  |
| B |  |  |  |  |
| C |  |  |  |  |

The "weak areas" column is the only part of this table that matters. Two days
before the exam, work only on what these mocks proved is weak — and do not start
a new topic, because cramming something unfamiliar in the final week displaces
something you already know.

## What the papers deliberately include

Each paper contains at least one of every mistake that turns a working
configuration into a zero:

- A service that must be **enabled**, not merely started (A10, B13).
- A mount that must be **by UUID** (A7), and one that must not block boot (B15).
- A SELinux context that must survive a relabel, not just a reboot (A10, B10).
- A firewall rule that must be **permanent** (A11, B10).
- A timer that must be `Persistent=true` (A12).
- A `--user` unit that needs **lingering** to start at boot (B9).
- An ACL that must be **inherited** by new files (A6, B4).

If you can name which requirement in each paper hides which trap, you have
understood the exam better than most of the material available for it.

→ Full protocol: [[Red Hat Exam Day Protocol]]
