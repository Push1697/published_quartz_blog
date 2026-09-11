---
section: Troubleshooting
title: Incident Drills — Troubleshooting a Broken Estate Under a Clock
created: 2026-09-11
tags:
  - rhel
  - troubleshooting
  - rhcsa
  - rhce
  - selinux
  - systemd
  - labs
publish: true
garden: true
series: RHCSA → RHCE
series_order: 15
series_group: Companions
description: "Single-fault drills are too kind: you are told what is wrong and that there is one of it. This tier hands you a work order instead — several faults across two hosts, described the way a user would describe them, with a clock, a decoy, and something that undoes your repairs."
---

# Incident Drills — Troubleshooting a Broken Estate Under a Clock

A break-fix drill tells you the symptom and implies there is one cause. Both of
those are gifts, and neither survives contact with a real incident.

This is the last tier of the troubleshooting ladder in
[[rhcsa-to-rhce-a-60-day-lab-curriculum|RHCSA to RHCE - A 60-Day Lab Curriculum]], above the single-cause faults in
[[rhcsa-security-labs-selinux-firewalld-and-boot-recovery|RHCSA Security Labs - SELinux firewalld and Boot Recovery]] and the concealed
causes of [[ten-advanced-rhel-break-fix-drills|Ten Advanced RHEL Break-Fix Drills]]. It introduces no new fault
types at all. What it removes is everything that made those drills tractable:

- You are not told how many things are wrong.
- You are not told whether two reports share a cause.
- You are not told which host the fault is on.
- One of the reports does not matter, and nothing marks it as such.
- There is a clock.

## What a work order looks like

Opening an incident writes a briefing and nothing else. No causes, no file
paths, no hints — only what somebody noticed, in the words they would have
used.

```text
# INCIDENT 20260911-1924 — severity 4

**Opened:** 2026-09-11 19:24:18 UTC
**Target:** restore service within **120 minutes**
**Scope:** rhel01, rhel02

## What was reported

- DNS works now and breaks on every reboot
- dnf fails before it downloads anything
- an NFS mount that worked yesterday now times out, and the client looks fine
- a mount is present now and absent after a restart
- a unit is stopped and disabled, and the journal carries a warning about it
- the filesystem is full and du cannot account for it
- repairs do not stick — something you fixed comes back broken a few minutes later
- everything time-sensitive misbehaves at once

There are **8** reports. They may or may not share a cause, and one
report may turn out to be several faults wearing a single symptom.
```

The reports are shuffled. Their order carries no information about severity,
dependency, or where to start. Deciding that order *is* the exercise, and it is
the part that no single-fault drill can teach you.

## Severity levels

| Sev | Composition | Target |
| --- | --- | --- |
| 1 | one single-cause fault | 15 min |
| 2 | one single-cause + two concealed-cause | 40 min |
| 3 | two + two + one of the two worst, **and a fault on the second host** | 75 min |
| 4 | severity 3, **plus something that undoes your repairs**, plus a decoy | 120 min |

Two properties of the composer matter more than the list above, because they
are what stops the difficulty from being accidental.

**No two faults may share a mechanism.** This sounds like a detail and is not.
An early version cheerfully staged two faults that each pointed the resolver at
a black hole. That is not a harder incident — fixing either one fixes both, and
the reveal reads as though it repeated itself. Faults that share only a
*symptom* are kept, and are the best part of the exercise: SELinux disabled at
the kernel command line hides a mislabelled document root completely, so the
second fault does not exist until you have fixed the first and rebooted.

**A fault that cannot be staged is replaced, not dropped.** If the second host
is down, or a package is missing, the composer substitutes another fault rather
than quietly handing you a lighter drill and calling it severity 4.

## What "resolved" means

The same six things every time, which is the point — this list is worth knowing
by heart, because it is roughly what both exams actually check:

- Every service that should be running is running, and is **enabled**.
- Everything a client needs is reachable **from the other host**, not just from
  localhost.
- SELinux is **enforcing**, and every label survives a relabel.
- The firewall's runtime and permanent configuration are identical.
- `findmnt --verify` is clean and `mount -a` is silent.
- **It all still holds after a reboot.**

## Rules of engagement

- No `setenforce 0`. Not even briefly, not even to test a theory.
- No `chmod 777`, and no widening a permission to make something work.
- No rebuilding the host, and no restoring the snapshot.
- No reading the saboteur.
- Searching, `man`, and the machine's own logs are all fair game.

A grader can check the first three. It cannot check the fourth, which is exactly
why that is the one that decides whether the drill was worth anything.

## Grading against where you started, not against perfection

The obvious way to grade an incident is to require the health sweeps to pass.
That turns out to be wrong, and the reason is worth writing down.

On an estate that has not reached the web labs yet, httpd is not installed, so
three checks fail on a completely clean machine. Requiring an outright pass
means no incident can ever be graded green, and the grader spends its output
telling you about work you have not done instead of the work you just did.

So the grader records how many checks were failing **before** anything was
staged, and compares. The incident is resolved when the estate is back to where
it started — which is the only definition that is true of a real one, too.

On top of that it checks five things the individual checkers cannot:

1. **You finished inside the target**, measured from when the incident opened.
2. **SELinux was never left off** — in all three places it can be turned off:
   the running state, `/etc/selinux/config`, and the kernel command line.
3. **Nothing was made world-writable**, and no generated policy module was
   loaded. `audit2allow` papers over a mislabelled file; it is not a repair.
4. **The persistence mechanism is gone, not merely stopped.** A repair that
   lasts until the next timer firing is not a repair.
5. **The host has rebooted since the incident opened.**

That last one is harder to implement honestly than it looks. Comparing
timestamps is the natural approach and it is broken: one of the faults moves the
clock, which makes a boot from *before* the incident opened compare as later
than it. The check passed while nothing whatsoever had been rebooted. Boot ids
are exact and do not care what the clock says:

```bash
cat /proc/sys/kernel/random/boot_id
```

Record it when the incident opens, compare it when grading. If it is the same
id, nothing has restarted, regardless of what `uptime` or `date` claim.

## The thing that fights back

At severity 4 something on the host re-applies a fault every few minutes.

It is not hidden by obscurity — the script and both units carry a comment
marking them as a lab artifact — but nothing points you at them. The symptom is
simply that a repair does not stick, and you find the cause the way you would
find a real one:

```text
a repair that does not stick
        ↓
what runs on a schedule here?          systemctl list-timers --all
        ↓
what did it run, and when?             journalctl -u <unit> --since -20min
        ↓
what does that unit actually execute?  systemctl cat <unit>
        ↓
remove the cause, not the symptom      disable AND delete, then daemon-reload
```

The grader fails you for leaving the timer merely stopped, because a stopped
timer comes back at the next boot.

Making this fault honest took two attempts. The first version re-applied a
firewall rule — on a host where firewalld was not installed, so the command
failed silently and the promised symptom never appeared at all. A drill that
reports something that is not happening is worse than no drill, because you will
spend the clock hunting it. It now picks a payload the host can actually be
subjected to, applies it, checks that it took effect, and backs the whole fault
out if it did not.

## The decoy is half the exercise

One report at severity 4 is deliberately irrelevant: a service is stopped and
disabled, and there is an alarming line in the journal about it. Nothing depends
on it, and nothing in "what resolved means" mentions it.

Every real incident contains one of these. Recognising it — and then *leaving it
alone* while seven other things are broken and the clock runs — is a skill, and
it is one you cannot practise on a drill that has a single known fault. It is
also the reason the decoy is not marked in the reveal as "the easy one": the
whole value is in not spending time on it, and you only find out whether you
can by being timed.

## Hard mode

Every checker takes `--hard`, which changes what the harness is willing to tell
you:

| Normally | With `--hard` |
| --- | --- |
| a failed check prints the value it found | it prints nothing but the requirement |
| a warning is a warning | a warning is a **failure** |
| numeric tolerances are generous | the tolerance **halves** |
| a pass is a pass | success is not reported until it is **boot-proven** |

The first pass through an incident, with diagnostics, teaches you the faults.
The `--hard` pass proves you can tell that you are finished without being told
where to look — which is the actual exam condition, and a different skill from
fixing things.

## Why this tier exists

The single-fault drills build a repertoire: you meet a mislabelled file, an
immutable config, a mount unit that does not exist, and you learn what each one
looks like. That is necessary and it is not sufficient, because in a real
incident nobody hands you the fault one at a time with its symptom attached.

What this tier drills is the layer above the repertoire — triage. Which report
do you take first. Which two are probably the same thing. Which one is noise.
When do you stop investigating and start fixing. When do you reboot. And the
honest answer to "is it fixed", which is almost never "the symptom went away".

The setup, the checkers and the saboteurs are all in
[[verifying-your-own-labs-offline|Verifying Your Own Labs Offline]], and the whole lab — three nodes, 48
checkers and all three tiers of break-fix — is a single clone:

```bash
git clone https://github.com/Push1697/rhce-ex294-lab.git
```

## The gate

- [ ] Severity 1 and 2 each completed inside target
- [ ] Severity 3 completed with the second host genuinely in scope
- [ ] Severity 4 completed once, persistence found and **deleted**, decoy left
      alone
- [ ] One incident graded with `--hard` and passed
- [ ] No incident was ever "fixed" with `setenforce 0`, a `chmod`, or a policy
      module
- [ ] No incident ended in a snapshot restore
- [ ] For every report in the last drill, I can name the cause without the
      reveal
