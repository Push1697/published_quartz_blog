---
section: Guides
title: Verifying Your Own Labs Offline
created: 2026-09-09
tags:
  - rhcsa
  - rhce
  - bash
  - testing
  - labs
publish: true
garden: true
series: RHCSA → RHCE
series_order: 13
series_group: Companions
description: An offline bash harness that grades a RHEL lab against its acceptance criteria, proves a fix survived a reboot by tracking boot IDs, and scores mock exams the way Red Hat does.
---

# Verifying Your Own Labs Offline

Self-study has one structural weakness: nobody marks your work. You finish a lab,
it looks right, you move on — and the thing that would have cost you marks goes
unnoticed for weeks.

This is a small bash harness that marks it for you. It reads the state of the
machine, checks it against the lab's **acceptance criteria**, and tells you what
is unmet — never how to fix it, because that part is the lab.

Bash and coreutils only. No network, nothing to install, nothing sent anywhere.
Part of [[rhcsa-to-rhce-a-60-day-lab-curriculum|RHCSA to RHCE - A 60-Day Lab Curriculum]]; source at
**[github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)**.

## What it looks like

```text
== Lab 2.5 — Partitions, filesystems, swap, fstab
   rhel01 · up 0d 00h 04m · 2026-09-09 14:02:11

3. /data is mounted by UUID, persistently
  [PASS] /data is mounted right now
  [PASS] and it is /dev/vdb1 that is mounted there
  [FAIL] the fstab entry uses UUID=, not /dev/vdb1 [P]
        /dev/vdb1  /data  xfs  defaults,noexec,nodev  0 0
        the entry does not start with UUID=
  [PASS] findmnt --verify is happy with /etc/fstab [P]

--------------------------------------------------------
  14 passed   1 failed   0 warn   0 skipped   2 to check by hand

  Not yet met:
    - the fstab entry uses UUID=, not /dev/vdb1
```

Three things in that output are deliberate.

**It shows what the machine actually said.** A failing check prints the captured
output, so you diagnose from evidence rather than guessing what the checker
wanted.

**It never prints the fix.** No "run `blkid` and use the UUID". Working that out
from a stated requirement is the skill being trained.

**Some criteria are marked `[P]`.** Those are the ones that vanish on a reboot.

## The reboot problem

Red Hat exams grade the machine **after a restart**. A `setsebool` without `-P`,
a firewall rule never made permanent, a service started but not enabled — each
looks perfect until the machine comes back.

So the harness records the boot ID on every clean pass:

```bash
sudo ./verify 2.5                    # passes
sudo reboot
sudo ./verify 2.5 --after-reboot     # the run that counts
```

```text
  OK: passed on a different boot than the last clean run — reboot-proven.
```

Until you see that line, you have proved nothing. A pass on the same boot as the
last pass says only that the machine is still in the state you left it in.
`--after-reboot` refuses to run at all if the machine has been up more than half
an hour, so you cannot accidentally claim the credit.

## Grading a requirement rather than a command

The interesting checks are the ones that test the *outcome* rather than the
method. Three examples.

**Did the filesystem actually grow, or just the volume?** Comparing the logical
volume's size against what the filesystem reports catches the half-answer —
`lvextend` without `-r`:

```bash
lvb=$(lvs --noheadings --units b --nosuffix -o lv_size "$src")
fsb=$(df -B1 --output=size /app | tail -1)
awk -v l="$lvb" -v f="$fsb" 'BEGIN { exit !(f > l * 0.9) }'
```

**Did the SELinux label come from policy, or from `chcon`?** A dry-run relabel
that wants to change something proves the label is not backed by policy and will
not survive `restorecon`:

```bash
out=$(restorecon -Rvn /web 2>&1)
[[ -z ${out//[[:space:]]/} ]]
```

**Does the sticky bit actually work?** Not "is the bit set", but "can one group
member delete another's file":

```bash
runuser -u raj  -- touch /srv/project/testfile
runuser -u amit -- rm -f /srv/project/testfile   # must fail
```

That last kind matters most. Checking the mode string tells you what was
configured; trying the operation tells you whether it works. Those are different
questions, and only the second one is what a grader asks.

> A note on the obvious trap: testing permission bits with a regex over the octal
> mode is wrong in a way that silently passes. `^[0-9]?[0-9]?[2367]` matches
> `750` through backtracking, so a directory with no group write permission
> reports as group-writable. Test the bit:
> `(( (8#$mode & 0020) != 0 ))`.

## Scoring mock exams

For the mock papers the harness runs one section per exam task and scores **tasks
fully correct**, scaled to 300 against the real 210 pass mark. A task with one
failed check scores nothing for that task, which is how Red Hat grades:

```text
  Tasks fully correct: 12/15
  Scaled score: 240/300 (80%) — pass mark is 210/300 (70%)
  -> Pass, but below the 85% go/no-go bar.
```

Each mock grader also prints its own paper, with every ambiguous value pinned —
usernames, UIDs, sizes, ports — so the grading is deterministic:

```bash
./verify ex200-b --spec > ~/paper.txt
```

Papers: [[two-rhcsa-mock-exam-papers|Two RHCSA Mock Exam Papers]] and
[[ansible-scenario-labs-and-the-ex294-mock|Ansible Scenario Labs and the EX294 Mock]].

## Grading automation with the same checks

The Ansible half of the curriculum re-does every manual lab as a playbook, and
the end state is identical — so the *same* checkers grade it. The Ansible-lab
checkers bundle the relevant manual check script, ship it to the managed node
with the `script` module, and run it there, from the control node:

```bash
a_remote_verify() {
  # library + lab script concatenated into one self-contained file
  { cat lib/verify-lib.sh; grep -v '^\. "\$(dirname' "labs/$lab"; } > "$tmp"
  ansible "$pat" -m script -a "$tmp --no-color --no-mutate" --become
}
```

You never log in, which is the rule for that week
([[automating-the-rhcsa-set-with-ansible|Automating the RHCSA Set with Ansible]]). The Ansible checkers additionally
run your playbooks twice, because idempotence cannot be verified any other way.

## What a script will not grade

Some acceptance criteria are judgement, and pretending otherwise would be worse
than admitting it. Those print as `[CHECK]` and are counted separately from
passes and failures:

```text
  [CHECK] You can explain why XFS can never be shrunk
          If you cannot say it out loud in one sentence, revisit it now.
  [CHECK] You reset the root password from the GRUB prompt
```

Nobody is checking those but you. In practice they are the ones that decide how
the exam goes.

## Getting it onto a machine with no network

`./verify bundle` writes one self-contained file per checker, each with the
library embedded, so a single `scp` moves a single check:

```bash
./verify bundle
scp dist/lab-2.5.sh user@rhel01:
ssh user@rhel01 'sudo ./lab-2.5.sh'
```

## Writing your own checks

The harness is about 470 lines and the API is deliberately small:

```bash
section "3. What the requirement asked for"
check      "a plain-English statement of the requirement" some_command --flags
check -p   "…and it survives a reboot" another_command
check_eq   "the value is exactly this" 5000 "$(group_gid developers)"
check_not  "this must fail" rm /srv/project/someone-elses-file
manual     "something only you can judge" "why the script cannot"
summary
```

`check` runs any command *or shell function*, so the logic for anything
non-trivial lives in a named function in the lab script rather than in a nest of
quoted subshells:

```bash
noexec_enforced() {
  local f=/data/verify-noexec-$$.sh
  printf '#!/bin/bash\necho hi\n' > "$f" && chmod +x "$f"
  if "$f" >/dev/null 2>&1; then
    echo "a script under /data executed — noexec is not in force"
    rm -f "$f"; return 1
  fi
  rm -f "$f"
}

check "a script under /data genuinely cannot execute" noexec_enforced
```

Checks that create or delete anything are gated behind `mutating`, so
`--no-mutate` gives you a read-only pass, and every artefact is cleaned up on
exit whatever happens.

## The daily loop it enforces

```text
Read the requirement (not the hint)
        ↓
Build it
        ↓
./verify <lab>                    ← fix what it reports, not what it suggests
        ↓
findmnt --verify   (if you touched fstab)
        ↓
sudo reboot
        ↓
./verify <lab> --after-reboot     ← this is the run that counts
        ↓
"reboot-proven" → the lab is done
```

The counterpart is a script that breaks the machine instead of grading it:
[[ten-advanced-rhel-break-fix-drills|Ten Advanced RHEL Break-Fix Drills]].
