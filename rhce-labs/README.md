# RHCSA → RHCE lab kit

Everything needed to run the lab curriculum published at
<https://learning.overflowbyte.cloud>: build a three-node RHEL lab, work through
the labs, have a script grade your work, then have a different script break the
machine so you can practise repairing it.

Bash and coreutils only. Nothing here needs network access once the lab is
built, and nothing sends anything anywhere.

```text
rhce-labs/
├── vagrant/            the Windows/macOS lab
│   ├── Vagrantfile     three nodes on VirtualBox, disks and spare NIC included
│   ├── lab.ps1         up / snap / restore / check / break, from PowerShell
│   └── provision/      what each node needs, and nothing a lab teaches
├── lab-build.sh        the same lab on KVM/libvirt, from one RHEL image
├── lab-destroy.sh      tear the KVM one down again
├── verify              the check dispatcher — run this
├── lib/
│   ├── verify-lib.sh   the check harness (pass/fail, scoring, reboot proof)
│   └── ansible-lib.sh  additions for the Ansible labs
├── labs/               one checker per lab, plus the mock graders
└── break/
    ├── break.sh            ten single-cause faults, for the first drills
    ├── break-advanced.sh   ten harder faults — DO NOT READ IT
    └── break-ansible.sh    corrupts an Ansible project instead of a host
```

## Quick start

**Windows or macOS — Vagrant + VirtualBox** (the environment this was last built and
tested on: Vagrant 2.4.9, VirtualBox 7.2.16, Windows 11):

```powershell
git clone https://github.com/Push1697/published_quartz_blog.git
cd published_quartz_blog/rhce-labs/vagrant

.\lab.ps1 doctor          # is the host fit? RAM, disk, host-only net, hypervisor
.\lab.ps1 up              # first run downloads a ~1 GB box
.\lab.ps1 check env rhel-control
.\lab.ps1 snap clean      # the baseline you will restore to constantly

.\lab.ps1 check 2.5 rhel01               # grade a lab
.\lab.ps1 break-advanced random rhel01   # then start breaking things
```

The kit is mounted read-only inside every node at `/opt/rhce-labs`, so there is
nothing to copy:

```bash
vagrant ssh rhel01
sudo /opt/rhce-labs/verify 2.5
sudo reboot
sudo /opt/rhce-labs/verify 2.5 --after-reboot     # the run that counts
```

**Linux host — KVM/libvirt:**

```bash
./lab-build.sh                  # three nodes from one RHEL image
sudo ./verify env
sudo ./verify 2.5
```

Both are the same labs. The checkers detect the platform, the blank lab disks
(`sdb`/`sdc` on VirtualBox, `vdb`/`vdc` on KVM) and the lab network, so no lab
text depends on which you chose. `verify env` prints what it found.

The written labs — requirements, acceptance criteria and the reasoning behind
them — are the article series:

- [A 60-day RHCSA → RHCE lab curriculum](https://learning.overflowbyte.cloud/blog/rhcsa-to-rhce-a-60-day-lab-curriculum)
- [Building a three-node RHEL lab on KVM](https://learning.overflowbyte.cloud/blog/building-a-three-node-rhel-lab-on-kvm)
- [Verifying your own labs offline](https://learning.overflowbyte.cloud/blog/verifying-your-own-labs-offline)
- [Ten advanced RHEL break-fix drills](https://learning.overflowbyte.cloud/blog/ten-advanced-rhel-break-fix-drills)

## Using the checkers

```bash
./verify                       # list every check and group
./verify 1.2                   # one lab
./verify week1                 # a whole week, in order
./verify breakfix              # after every break.sh drill
./verify advanced              # the ten advanced drills
./verify advanced --blind      # pass/fail only, without saying what was checked
./verify ex200-a --spec        # print a mock exam paper
./verify history               # what has been run on this machine
./verify bundle                # self-contained single-file copies, for transfer
```

Anything after the name is passed to the checker:

| Flag | Effect |
| --- | --- |
| `-v` | show command output for passing checks too, not just failures |
| `--no-mutate` | skip checks that create or delete anything on the box |
| `--after-reboot` | refuse to run unless the machine booted in the last 30 min |
| `--blind` | report pass/fail only, without naming what was checked |
| `--no-color` | plain output (`NO_COLOR=1` works too) |
| `--spec` | mocks only — print the exam paper with every value pinned |
| `--only=fN` | `advanced` only — check a single drill |
| `--proj=PATH` | Ansible labs — the project directory, default `~/ansible` |

Exit status is 0 when every automated check passed, 1 when something failed, and
2 when the script refused to run (wrong user, no reboot, no project directory).

They report **what** is unmet and what the machine actually said — never how to
fix it. That part is the lab.

## Where to run each one

| Checks | Run on | As |
| --- | --- | --- |
| `env` | every node — it detects which one it is on | root |
| `1.x`, `2.x`, `3.x`, `breakfix`, `advanced`, `4.2` | rhel01 | root |
| `2.7` | rhel01 **and** rhel02 | root |
| `4.1` | rhel01 | the ordinary user, **not** root |
| `ex200-a`, `ex200-b` | rhel01 | root |
| `5.x`, `6.x`, `7.x`, `s1`–`s5`, `ex294-a` | the control node | the ordinary user |

## The reboot rule

Red Hat exams grade the state of the machine **after a reboot**, so these
checkers do too. Checks marked `[P]` are the ones that classically disappear on
restart — a `setsebool` without `-P`, a runtime-only firewall rule, a service
started but never enabled.

The harness records the boot ID on every clean pass. Run a lab again after a
reboot and the summary says **reboot-proven** instead of *passed on the same
boot*. That distinction is the difference between full marks and zero.

## Getting them onto a node with no network

`./verify bundle` writes `dist/`, one self-contained file per checker with the
harness embedded, so a single `scp` moves a single check:

```bash
./verify bundle
scp dist/lab-2.5.sh user@rhel01:
ssh user@rhel01 'sudo ./lab-2.5.sh'
```

Or the whole set: `tar czf verify.tgz dist && scp verify.tgz user@rhel01:`.

If a shell complains about `\r`, the files were converted to CRLF in transit:
`sed -i 's/\r$//' *.sh`.

## The saboteurs

`break/break.sh` injects one of ten single-cause faults — a broken fstab entry, a
mislabelled document root, a removed firewall rule. Repair, then run
`./verify breakfix`, which has one section per fault so a second fault you did
not notice shows up immediately.

`break/break-advanced.sh` is the harder set: faults that stay silent until a
reboot, one symptom with three independent causes, and two that present as
permissions problems that are not. It deliberately tells you nothing —

```bash
sudo ./break/break-advanced.sh list          # the ten symptoms, no spoilers
sudo ./break/break-advanced.sh random --yes  # one unknown fault
# ... repair, reboot, repair ...
sudo ./verify advanced --blind               # am I done yet?
sudo ./break/break-advanced.sh reveal        # the cause, and your elapsed time
```

**Do not read `break-advanced.sh`.** It states the cause of all ten drills in
plain English, and `reveal` exists so you never need to.

> [!warning]
> The saboteurs are for a throwaway lab VM you can revert. They fill
> filesystems, move the clock, and disable SELinux until you repair them. They
> write **no backups** — a snapshot is the intended escape hatch:
> `.\lab.ps1 snap pre-lab rhel01` on Vagrant, or
> `virsh snapshot-create-as rhel01 pre-lab` on KVM. Never run them on anything
> you care about.

## Adding a check

```bash
section "3. What the requirement asked for"
check      "a plain-English statement of the requirement" some_command --flags
check -p   "…and it survives a reboot" another_command
check_eq   "the value is exactly this" 5000 "$(group_gid developers)"
check_not  "this must fail" rm /srv/project/someone-elses-file
manual     "something only you can judge" "why the script cannot"
summary
```

`check` runs any command or shell function; a non-zero exit is a failure, and the
captured output is shown so you can see what the machine actually said. `-p`
marks a check as reboot-sensitive. Put the logic in a named function when it
needs more than one line — that keeps quoting sane and the intent readable.

## Licence

Same licence as the rest of this repository. Use them, fork them, break your own
machines with them.
