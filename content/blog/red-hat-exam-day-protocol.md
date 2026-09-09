---
section: Reference
title: Red Hat Exam Day Protocol
created: 2026-09-09
tags:
  - rhcsa
  - rhce
  - exam
  - reference
  - rhel
publish: true
garden: true
description: The loop to run on every task in a performance-based Red Hat exam - the persistence checklist, time management, the reboot ritual, and the nine mistakes that turn a working configuration into a zero.
---

# Red Hat Exam Day Protocol

Applies to any performance-based Red Hat exam. The loop below is identical for
each; only the allowed documentation differs — the core RHEL exam gives you `man`
and `/usr/share/doc`, the Ansible one adds `ansible-doc`.

Part of [[RHCSA to RHCE - A 60-Day Lab Curriculum]].

---

## The loop

```text
Read requirement
      ↓
Identify hosts        ← which group? one host or all?
      ↓
Implement
      ↓
Validate
      ↓
REBOOT
      ↓
Validate again
```

That last step is not optional. Red Hat exams are performance based and graded on
the state of the machine **after a reboot**. A configuration that works now but
disappears on reboot is not a partial answer — it is a zero.

## The persistence checklist

Before you consider any task finished, ask which of these applies:

| Did you… | Persistence requirement |
| --- | --- |
| Start a service | `systemctl enable` as well |
| Mount a filesystem | Entry in `/etc/fstab`, by UUID |
| Set a SELinux boolean | `setsebool` **`-P`** |
| Set a SELinux context | `semanage fcontext` + `restorecon`, not `chcon` |
| Open a firewall port | `--permanent` **and** `--reload` |
| Configure an IP | An `nmcli` profile with autoconnect, not `ip addr add` |
| Set a hostname | `hostnamectl`, not `hostname` |
| Add swap | An fstab entry |
| Change a kernel parameter | `/etc/sysctl.d/`, not just `sysctl -w` |
| Create a timer or cron job | Enabled, and `Persistent=true` for timers |
| Run a rootless container | `loginctl enable-linger`, or it never starts at boot |

> **`findmnt --verify` before every reboot.** A malformed `/etc/fstab` drops the
> machine into emergency mode and can burn twenty minutes of exam time.
> `findmnt --verify` and `mount -a` cost three seconds.

---

## Allowed documentation

Learn to move fast in these. They are all you get.

```bash
# Ansible exam only
ansible-doc -l | grep -i <thing>        # find the module
ansible-doc <module>                    # full options
ansible-doc -s <module>                 # paste-ready skeleton  ← use this most
ansible-galaxy collection list          # what is installed

# Any exam
man <command>
man -k <keyword>                        # apropos, when you forget the name
<command> --help
ls /usr/share/doc/                      # config examples live here
```

`/usr/share/doc` is badly underused. Example configurations for httpd, chrony,
autofs and others are sitting right there, ready to copy.

---

## Time management

```text
First 10 min   Read every task. Number them by difficulty.
               Do NOT start on task 1 by default.
Then           Easy, high-confidence tasks first. Bank the marks.
Middle         Hard tasks, with a hard time cap on each.
Last 30 min    REBOOT. Then verify every task from the top.
```

- Never let one task eat more than about 15% of your time. Flag it, move on,
  come back.
- Tasks are independent. A task you cannot do does not block the rest.
- If a task depends on an earlier one you failed, do it anyway — partial state
  may still score.

## The reboot ritual

Reboot at least **twice**: once in the middle, once near the end. A mid-exam
reboot surfaces persistence failures while you still have time to fix them.
Finding them in the last five minutes is finding them too late.

```bash
findmnt --verify          # fstab sane?
mount -a                  # no errors?
systemctl --failed        # nothing failed?
reboot
# after it returns:
systemctl --failed
df -h; swapon --show; getenforce
firewall-cmd --list-all
# then re-verify every task
```

---

## The nine mistakes that turn work into a zero

1. Service started but not enabled.
2. `setsebool` without `-P`.
3. `chcon` instead of `semanage fcontext` + `restorecon` — survives a reboot,
   dies on a relabel.
4. A firewall rule left runtime-only, with no `--permanent`.
5. fstab using `/dev/sdb1` instead of a UUID, after device names shift.
6. `setenforce 0` to "make it work" — SELinux must be enforcing.
7. A playbook that reports success but `skipped=` everything.
8. A plaintext password where a hash was required.
9. Reading the requirement as you assume it, not as written. **Read it twice.**

Number 6 deserves emphasis: disabling SELinux to unblock yourself converts a
partial score into a guaranteed zero across *multiple* tasks, because the graders
check enforcement separately from the thing you were trying to fix.

---

## If you get stuck

1. Re-read the requirement. Half of all stuck moments are misread requirements.
2. `ansible-doc -s` or `man -k`. The answer is on the machine.
3. Check the logs: `journalctl -xeu <unit>`, `ausearch -m AVC -ts recent`.
4. Still stuck after your time cap? Flag it, move on, come back.

Never sit frozen, and never disable a security control to unblock yourself.

---

## The night before

- No new topics. Cramming something unfamiliar displaces something you know.
- Confirm the exam time, ID requirements and the check-in process.
- Verify your machine and environment requirements if it is a remote exam.
- Sleep properly. Tired beats under-prepared in the wrong direction.

---

## Practising under these conditions

None of the above works as advice; it only works as habit. The way to build the
habit is to sit full timed mocks on a machine you have deliberately broken
beforehand:

- [[Two RHCSA Mock Exam Papers]] — two 2.5-hour papers, plus a hostile variant
- [[Ansible Scenario Labs and the EX294 Mock]] — the four-hour Ansible paper
- [[Verifying Your Own Labs Offline]] — a grader that scores only what survived a
  reboot
- [[Ten Advanced RHEL Break-Fix Drills]] — for the troubleshooting half
