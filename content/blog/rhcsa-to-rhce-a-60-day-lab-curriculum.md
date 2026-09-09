---
section: Guides
title: RHCSA to RHCE - A 60-Day Lab Curriculum
created: 2026-09-09
tags:
  - rhcsa
  - rhce
  - rhel
  - ansible
  - certification
  - labs
publish: true
garden: true
series: RHCSA → RHCE
series_order: 1
series_group: Start here
description: A requirement-driven lab curriculum that takes you from core RHEL administration to Ansible automation in eight weeks, with scripts that grade your work and break your machines.
---

# RHCSA to RHCE - A 60-Day Lab Curriculum

Most certification plans are a list of topics and a list of videos. This one is a
list of **requirements**. Every lab states an outcome a machine must reach and
says nothing about which commands get you there — because that is exactly the
shape of the exam, and exactly the shape of the job.

The whole thing runs on three virtual machines on one Linux box, offline, and
comes with two kinds of script: one that grades your work against the lab's
acceptance criteria, and one that deliberately breaks the machine so you can
practise repairing it.

> All the scripts are here:
> **[github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)**

## Two exams, in this order

**RHCSA (EX200) first. RHCE (EX294) second.** That is not an arbitrary split —
an EX294 pass only becomes RHCE once you hold a current RHCSA. Certifying the
first one at the halfway mark also banks a real credential instead of betting
everything on a single exam at the end.

> **What success looks like.** Not "I finished the videos." This, in order:
>
> 1. Give me a blank RHEL VM and a requirement — I can build it. *(RHCSA)*
> 2. Give me 20 blank RHEL machines — I can automate the same build. *(RHCE)*
>
> If you can only recite `lvextend`, you are not ready for either.

Red Hat restructured its certification framework in 2026 and now separates the
Enterprise Linux and Ansible tracks. Confirm the current exam codes and RHEL
version before you book anything, and build against that version.

## The shape of it

```text
WEEK 1 ─────────────── WEEK 4 ─────────────── WEEK 8
│                      │                      │
│   MONTH 1            │   MONTH 2            │
│   CORE LINUX         │   ANSIBLE            │
│   → RHCSA            │   → RHCE             │
│                      │                      │
└── build → break → ───┴── automate → break → ┘
    fix → CERTIFY          fix → CERTIFY
```

### Month 1 — core RHEL

| Week | Focus | Labs |
| --- | --- | --- |
| 1 | Files, users, permissions, ACLs, sudo, SSH, bash | [[rhcsa-foundation-labs-users-permissions-and-storage|RHCSA Foundation Labs - Users Permissions and Storage]] |
| 2 | systemd, dnf, networking, storage, LVM, NFS | [[rhcsa-foundation-labs-users-permissions-and-storage|RHCSA Foundation Labs - Users Permissions and Storage]] |
| 3 | SELinux, firewalld, boot recovery, **break-fix** | [[rhcsa-security-labs-selinux-firewalld-and-boot-recovery|RHCSA Security Labs - SELinux firewalld and Boot Recovery]] |
| 4 | Containers, tuned, kernel, **mock exams** | [[rhcsa-container-and-kernel-labs|RHCSA Container and Kernel Labs]] · [[two-rhcsa-mock-exam-papers|Two RHCSA Mock Exam Papers]] |

### Month 2 — Ansible

| Week | Focus | Labs |
| --- | --- | --- |
| 5 | Inventories, ad-hoc, playbooks, variables, loops, handlers | [[ansible-fundamentals-labs|Ansible Fundamentals Labs]] |
| 6 | Re-do every Month 1 lab *through* Ansible | [[automating-the-rhcsa-set-with-ansible|Automating the RHCSA Set with Ansible]] |
| 7 | Roles, Jinja2, Vault, collections, failure handling | [[advanced-ansible-labs-roles-templates-and-vault|Advanced Ansible Labs - Roles Templates and Vault]] |
| 8 | Full scenarios, deliberate breakage, mock exam | [[ansible-scenario-labs-and-the-ex294-mock|Ansible Scenario Labs and the EX294 Mock]] |

Week 6 is the hinge, and the one most plans miss entirely. Everything you did by
hand in weeks 1–3 you do again as playbooks, against freshly reverted nodes, with
one rule: **you may not log into a managed node to fix anything.** If something
is wrong, fix the playbook and re-run it. Log in only to verify.

## The method

The usual advice is *watch → understand → do it yourself → break it → fix it*.
Replace it with:

> **Learn it manually → automate it with Ansible → break it → troubleshoot it →
> rebuild it automatically.**

Same topic, same day, both halves. On the day you create users with `useradd`,
you also write the `user` module task. The bridge between the two certifications
gets built daily rather than saved up — the mapping is in
[[manual-to-ansible-a-module-map|Manual to Ansible - A Module Map]].

## Time budget

Around 15 hours a week, which is roughly 120 hours over the eight weeks. Two and
a half hours every single day does not survive contact with a real job.

**Weekdays — 1.5 to 2 hours**

```text
20 min   revision of yesterday
20 min   new concept
60 min   hands-on lab
20 min   break it, then fix it
```

**Weekends — 3 to 4 hours,** almost entirely labs. The weekends carry the long
labs and every timed mock exam.

> **That last 20-minute block is the one that produces exam readiness.** Skip the
> concept video before you skip the break-fix block. Deliberately breaking a
> working system and repairing it teaches more per minute than anything else in
> this curriculum.

## Three habits that decide the result

**1. Reboot before you believe it.** Red Hat exams grade the state of the machine
*after a restart*. A `setsebool` without `-P`, a firewall rule that was never
made permanent, a service started but not enabled — each of those looks perfect
until the machine comes back, and then scores zero. Every lab here ends with a
reboot, and the checkers track the boot ID so a pass can be proven to have
survived one.

**2. Snapshot before every destructive lab.** Break-fix practice is only
sustainable when recovery is instant.

```bash
virsh snapshot-create-as rhel01 clean "Registered, pre-lab baseline"
virsh snapshot-revert rhel01 clean          # seconds
```

Snapshot the *registered, known-good* state, not the empty one — reverting past
subscription registration gets old by the sixth time.

**3. Use only the documentation the exam gives you.** `man`, `--help`,
`/usr/share/doc`, and for the Ansible exam `ansible-doc`. Build that reflex from
week 1, because reaching for documentation is not failure — it is the skill being
measured. Full protocol: [[red-hat-exam-day-protocol|Red Hat Exam Day Protocol]].

## The tooling

Two scripts per lab, and they exist to hold you to the habits above.

**Checkers** grade a lab against its acceptance criteria and report *what* is
unmet plus what the machine actually said — never how to fix it:

```bash
sudo ./verify 2.5                    # partitions, filesystems, swap, fstab
sudo reboot
sudo ./verify 2.5 --after-reboot     # the run that actually counts
```

**Saboteurs** damage the machine so you can practise diagnosis. The advanced set
tells you nothing at all: `list` prints symptoms, and the cause is revealed only
after you have finished:

```bash
sudo ./break/break-advanced.sh random --yes
# ... diagnose, repair, reboot, verify ...
sudo ./break/break-advanced.sh reveal
```

How the harness works: [[verifying-your-own-labs-offline|Verifying Your Own Labs Offline]]. The hardest drills:
[[ten-advanced-rhel-break-fix-drills|Ten Advanced RHEL Break-Fix Drills]].

## Start here

1. Build the lab: [[building-a-three-node-rhel-lab-on-kvm|Building a Three-Node RHEL Lab on KVM]]
2. Do not start week 1 until `sudo ./verify env` passes every line.
3. Work the labs from their *requirements*. Read the hints only after a genuine
   attempt — a lab you were walked through teaches you nothing about an exam you
   will sit alone.
4. Reboot, re-verify, and keep a written list of everything you had to look up.
   That list is your revision plan.

## The series

| Article | What it covers |
| --- | --- |
| [[building-a-three-node-rhel-lab-on-kvm|Building a Three-Node RHEL Lab on KVM]] | The environment: three nodes, thin overlays, snapshots, acceptance test |
| [[rhcsa-foundation-labs-users-permissions-and-storage|RHCSA Foundation Labs - Users Permissions and Storage]] | Weeks 1–2: 14 labs from text processing to LVM and NFS |
| [[rhcsa-security-labs-selinux-firewalld-and-boot-recovery|RHCSA Security Labs - SELinux firewalld and Boot Recovery]] | Week 3: SELinux, firewalld, the four boot failures, break-fix drills |
| [[rhcsa-container-and-kernel-labs|RHCSA Container and Kernel Labs]] | Week 4: rootless podman, tuned, kernel management |
| [[two-rhcsa-mock-exam-papers|Two RHCSA Mock Exam Papers]] | Two full 2.5-hour papers with every value pinned |
| [[ansible-fundamentals-labs|Ansible Fundamentals Labs]] | Week 5: inventory, ad-hoc, playbooks, variables, loops, handlers |
| [[automating-the-rhcsa-set-with-ansible|Automating the RHCSA Set with Ansible]] | Week 6: every Month 1 lab, redone as automation |
| [[advanced-ansible-labs-roles-templates-and-vault|Advanced Ansible Labs - Roles Templates and Vault]] | Week 7: roles, Jinja2, Vault, collections, failure at scale |
| [[ansible-scenario-labs-and-the-ex294-mock|Ansible Scenario Labs and the EX294 Mock]] | Week 8: five scenarios, the Ansible saboteur, the mock paper |
| [[manual-to-ansible-a-module-map|Manual to Ansible - A Module Map]] | Every RHCSA task, its command, its module, and its collection |
| [[red-hat-exam-day-protocol|Red Hat Exam Day Protocol]] | The loop to run on every exam task, and the zero-mark mistakes |
| [[verifying-your-own-labs-offline|Verifying Your Own Labs Offline]] | The check harness: how it grades, and how it proves persistence |
| [[ten-advanced-rhel-break-fix-drills|Ten Advanced RHEL Break-Fix Drills]] | Faults that hide, faults with three causes, and the layer method |
