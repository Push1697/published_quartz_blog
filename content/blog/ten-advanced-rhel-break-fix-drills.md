---
section: Troubleshooting
title: Ten Advanced RHEL Break-Fix Drills
created: 2026-09-09
tags:
  - rhel
  - troubleshooting
  - rhcsa
  - selinux
  - systemd
  - labs
publish: true
garden: true
series: RHCSA → RHCE
series_order: 14
series_group: Companions
description: Ten RHEL faults that hide - silent until a reboot, one symptom with three causes, and two that look like permissions problems and are not. A saboteur stages them, and only reveals the cause once you have repaired it.
---

# Ten Advanced RHEL Break-Fix Drills

A script damages the machine; you repair it with nothing but the machine itself.

Most troubleshooting practice is too easy because the fault announces itself. A
service is stopped, so you start it. These ten do not announce themselves.
Several stay silent until a reboot. One puts three independent causes behind a
single symptom. Two present as permissions problems that are not permissions
problems at all.

Part of [[rhcsa-to-rhce-a-60-day-lab-curriculum|RHCSA to RHCE - A 60-Day Lab Curriculum]], and the harder counterpart
to the drills in
[[rhcsa-security-labs-selinux-firewalld-and-boot-recovery|RHCSA Security Labs - SELinux firewalld and Boot Recovery]]. Scripts:
**[github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)**

> **Snapshot first, every single time.** Some of these fill a filesystem, move
> the clock, or disable SELinux until you repair them.
>
> ```bash
> virsh snapshot-create-as rhel01 pre-lab
> ```
>
> The saboteur writes **no backups** of what it changed. That is deliberate: the
> snapshot is the escape hatch, and reverting costs you nothing but the drill.
> There is no undo command, and there should not be. Never run this on a machine
> you care about.

## Running a drill

```bash
sudo ./break/break-advanced.sh list            # the ten symptoms, no spoilers
sudo ./break/break-advanced.sh random --yes    # one unknown fault
sudo ./break/break-advanced.sh f4 --yes        # a specific drill
sudo ./break/break-advanced.sh combo --yes     # three distinct faults at once
sudo ./break/break-advanced.sh chaos 5 --yes   # five, for a hostile mock
sudo ./break/break-advanced.sh status          # how many pending, and since when
```

Then repair, verify, reboot, verify again, and only afterwards:

```bash
sudo ./verify advanced --blind     # am I done yet? pass/fail only
sudo ./verify advanced             # what is still wrong, once you have tried
sudo ./break/break-advanced.sh reveal    # the cause, and your elapsed time
```

Two deliberate design choices, because a drill you can peek at is not a drill:

**The saboteur names nothing.** `list` prints only symptoms. `reveal` gives you
the cause *and how long you took*, once you are finished.

**`--blind` exists for the verifier.** Its normal output names the domain each
check examines, which does some of the hunting for you. Blind mode reports only
which numbered checks pass, so you can tell whether you are finished without
being told where to look.

> **Do not read `break-advanced.sh`.** It states the cause of all ten drills in
> plain English. Reading it once spends the only chance you get to meet that
> fault cold, and `reveal` exists so you never need to.

`random` is the version that matters. A named drill tells you the symptom in
advance, which is useful the first time and worthless the second.

## The ten drills

Each gives you a **symptom**, not a fault. The requirement is always the same
three things:

1. The symptom is gone.
2. The repair is **minimal** — nothing disabled, no permissions widened, no
   `setenforce 0`, no `chmod 777`, no blanket policy module.
3. The repair **survives a reboot**.

The acceptance criteria say what "done" looks like from the outside. They
deliberately do not say where to look.

---

### f1 — Names stop resolving, and `/etc/hosts` is demonstrably correct

`ping rhel02` fails. `ping 192.168.124.12` works. You `cat /etc/hosts` and the
entry is right there, correctly spelled. Nothing is wrong with the network, and
DNS itself answers normally.

- [ ] `getent hosts rhel02` resolves again
- [ ] A name that *only* `/etc/hosts` knows about resolves
- [ ] Whatever manages that configuration on RHEL 9 reports itself consistent
- [ ] You changed one thing, not several
- [ ] Survives a reboot

**Target: 10 minutes.**

---

### f2 — A service will not start, on a config error you cannot correct

The unit fails. `journalctl -xeu` names the file and the line. You open it, fix
it, and cannot save. As **root**. There is no SELinux denial in the audit log,
the filesystem is read-write, and `ls -l` shows exactly the permissions you
expect.

- [ ] The file is editable by root again
- [ ] The configuration parses and the service runs
- [ ] Nothing else under `/etc` is left in the state that caused this
- [ ] You can name the one command that would have shown you the cause in a line
- [ ] Survives a reboot

**Target: 10 minutes.**

---

### f3 — The website is unreachable, and fixing one thing is not enough

`curl` from another host fails. So does `curl localhost`. This drill has **three
independent causes** behind that one symptom, and they surface one at a time:
each fix reveals the next failure. Do not stop when the first thing works.

- [ ] `curl` against the configured port returns 200 locally **and** remotely
- [ ] SELinux stayed enforcing throughout — no `setenforce 0`, not even briefly
- [ ] A full relabel of the served directory would change nothing
- [ ] Every port the server listens on is permitted, permanently
- [ ] Runtime and permanent firewall configuration match exactly
- [ ] Survives a reboot

**Target: 20 minutes.** The longest of the ten.

---

### f4 — A unit starts by hand but never at boot, citing something that does not exist

`systemctl start httpd` works. After a reboot it is dead. `systemctl status`
mentions a unit name you have never seen, containing an escape sequence, and the
unit file itself looks entirely normal at first glance.

- [ ] The unit starts automatically at boot, confirmed by an actual reboot
- [ ] Nothing on the system depends on anything that does not exist
- [ ] No unit is in a failed state
- [ ] `systemd-analyze verify` is quiet about it
- [ ] You can explain how a filesystem path becomes a systemd unit name, escape
      sequence and all

**Target: 15 minutes.**

---

### f5 — The filesystem is full and `du` cannot account for it

Writes fail. `df` says 100%. `du -sh` over the whole filesystem adds up to a
fraction of that. Deleting things does not help, and there is nothing obviously
large anywhere.

- [ ] The space is back, without deleting anything that mattered
- [ ] `du` and `df` agree again
- [ ] You did **not** reboot to fix it — a reboot would have hidden the cause
- [ ] You can explain why the space was invisible to `du`
- [ ] You can explain why a reboot would have "worked", and why that is worse

**Target: 10 minutes.**

---

### f6 — Everything time-sensitive misbehaves at once

`dnf` complains about certificates. `journalctl` output is out of order and its
newest entries are dated next year. Timers show absurd next-run times. `sudo`
grumbles about a timestamp from the future. SSH still works.

- [ ] The clock is correct and consistent with what is installed on the box
- [ ] The service that maintains it is configured **and** running
- [ ] No files under `/etc` or `/root` are left dated in the future
- [ ] `dnf` works again
- [ ] Survives a reboot

**Target: 15 minutes.** Note that an offline lab has no upstream time source, so
part of this drill is setting the clock by hand and then making the service that
maintains it work against something reachable.

---

### f7 — `sudo` works for some commands and refuses others

`sudo ls` is fine. `sudo systemctl restart httpd` says the command was not found
— though it plainly exists and you can run it by absolute path. Separately, a
group that had sudo rules yesterday now has none, and `sudo -l` for its members
is thinner than it was. Two things are wrong, not one.

- [ ] Administrative commands work through `sudo` without an absolute path
- [ ] The group's rules are honoured again
- [ ] `visudo -c` is clean and `sudo` itself prints no warnings
- [ ] You fixed the rules rather than granting anyone more than they had before
- [ ] Survives a reboot

**Target: 15 minutes.** Know your way back in before you start: if you remove
your own sudo access entirely, `su -` with the root password is the only route
left.

---

### f8 — SELinux is off after a reboot, and the config file says enforcing

`getenforce` reports `Disabled`. `/etc/selinux/config` says `SELINUX=enforcing`
and always has. `setenforce 1` refuses. Everything that used to be blocked now
works, which is its own kind of alarming.

- [ ] `getenforce` reports `Enforcing`, and still does after a **second** reboot
- [ ] `restorecon -Rvn /etc` is silent, and no relabel is left outstanding
- [ ] You can say why `/etc/selinux/config` was never the authority here
- [ ] You can say why coming back from this state needs a relabel at all

**Target: 15 minutes, plus two reboots.**

---

### f9 — DNS works now and breaks on every reboot

You fix `/etc/resolv.conf`. Resolution works. You reboot to confirm, and it is
broken again, with a nameserver you have never configured. You fix it again. It
survives until the next reboot.

- [ ] Resolution survives a reboot **and** taking the connection down and up
- [ ] At least one configured nameserver actually answers
- [ ] `/etc/resolv.conf` is reproducible — nothing regenerates it differently
- [ ] Hand-editing a generated file was not your final answer
- [ ] You can name two other files on a RHEL box that are generated like this one

**Target: 10 minutes.**

---

### f10 — The NFS mount succeeds and writes fail

`mount` reports success. `findmnt` looks right. `df` shows the share. Writing to
it fails — with one message as your user and a different one as root, which is
the clue.

Stage this one on the **server** for the server-side variant, or on the client for
the client-side variant. They present almost identically and are fixed in
different places, which is the lesson.

- [ ] A write to the mount succeeds as an ordinary user
- [ ] The export permits what it should, and nothing more
- [ ] The mount is read-write both now and after a reboot
- [ ] You fixed it on the correct node, and can say why the other one was wrong
- [ ] `showmount -e` from the client agrees with `exportfs -v` on the server

**Target: 15 minutes.**

---

## The diagnostic order these drills are teaching

By the end of the ten, this should be reflex rather than recall:

```text
What exactly is the symptom?        ← reproduce it, deliberately
        ↓
What changed, and when?             ← journalctl --since, rpm -qa --last, ls -lt /etc
        ↓
Which LAYER?                        ← the question these drills exist for
        ↓
ONE hypothesis, written down
        ↓
Test it without fixing it
        ↓
Fix minimally
        ↓
Verify · REBOOT · verify again
```

The layer question is what separates these from easier drills. When a service
will not start, the cause can be in its own configuration, in something layered
on top of its unit, in a file attribute that is not a permission, in SELinux, in
the kernel command line, or in the clock. **Each of those is invisible to the
tool that reveals the others** — which is why a checklist of commands is not the
same thing as a method.

Work out the list for yourself as you go. That is the exercise. Once you have
finished all ten, compare your list against this one:

> [!tip]- Spoiler: the layers, and the tool that exposes each
> Do not open this until every drill is done. It is effectively an index of the ten
> causes.
>
> | Layer | The tool that shows it |
> | --- | --- |
> | the unit as systemd actually assembles it | `systemctl cat`, `systemd-analyze verify` |
> | file attributes beyond permissions | `lsattr` |
> | SELinux labels, booleans and ports | `ls -Z`, `ausearch -m AVC -ts recent`, `semanage` |
> | the kernel command line | `/proc/cmdline`, `grubby --info=DEFAULT` |
> | name-service resolution order | `/etc/nsswitch.conf`, `authselect check` |
> | files that are generated, not edited | `nmcli con show`, `rpm -qf`, the managing daemon |
> | space with no directory entry | `lsof -nP +L1`, `df -i` |
> | the clock | `timedatectl`, `rpm -qa --last` |
>
> If your own list had all eight before you read this, you are ready for the
> troubleshooting half of any RHEL exam.

## Keep a drill log

The pattern in the "first hypothesis right?" column is the most honest measure of
readiness there is. A rising accuracy rate means the layer question is becoming
automatic; a flat one means you are still guessing.

| Date | Drill | Time to find | Time to fix | First hypothesis right? | What gave it away |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## The gate

- [ ] All ten drills completed at least once
- [ ] Every one re-run cold via `random`, under its time target
- [ ] `combo` repaired inside 45 minutes
- [ ] No drill was ever "fixed" by disabling SELinux, widening permissions, or
      rebooting blindly
- [ ] The drill log is filled in, including the wrong hypotheses
- [ ] I wrote my own layer list before reading the spoiler, and it was close

The counterpart to the saboteur is the grader:
[[verifying-your-own-labs-offline|Verifying Your Own Labs Offline]]. `./verify advanced` also works as a general
sanity sweep — every section passes on a healthy box, so it is worth running
before any mock exam.
