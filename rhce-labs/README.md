# Lab verification scripts

Offline check scripts for every lab in this project. They read the state of the
machine and tell you whether the lab's **acceptance criteria** are actually met —
after the reboot, which is how both exams are graded.

No network, no packages to install, no internet access needed. Bash and
coreutils only.

> They report **what** is wrong, never **how** to fix it. Working that out is the
> lab. Read only the *Requirement* in the note, build it, then run the checker.

The same scripts run on Vagrant/VirtualBox and on KVM/libvirt. They detect the
platform, the blank lab disks (`sdb`/`sdc` versus `vdb`/`vdc`) and the lab
network rather than assuming any of them, and read
`/etc/rhce-lab.env` where the environment recorded a deliberate choice.
`verify env` prints what it found.

## Getting them onto the lab machines

**On Vagrant/VirtualBox there is nothing to copy.** `vagrant/Vagrantfile` mounts
this whole directory into every node, read-only, at `/opt/rhce-labs`:

```powershell
cd vagrant
.\lab.ps1 up
.\lab.ps1 check 2.5 rhel01           # drive it from Windows
```

```bash
# or from inside a node
sudo /opt/rhce-labs/verify 2.5
```

Read-only is deliberate: a lab mistake inside a VM can never reach this copy.
It also means `./verify bundle` cannot write here — and does not need to.

**For any node you only have `scp` to** (a KVM lab, a remote box), the bundle
path still works. Each file in `dist/` embeds the harness, so one file is one
complete checker:

```bash
./verify bundle
scp dist/lab-2.5.sh user@rhel01:
ssh user@rhel01 'sudo ./lab-2.5.sh'
```

If a shell complains about `\r`, the files reached the guest with CRLF endings;
`.gitattributes` pins `*.sh eol=lf`, so check your git config did not override it.

## Using them

```bash
./verify                       # list every check and group
./verify 1.2                   # one lab
./verify week1                 # a whole week, in order
./verify breakfix              # after every break.sh drill
./verify advanced              # the ten advanced drills
./verify advanced --only=f4    # just one of them
./verify incident              # grade a whole incident against its work order
./verify incident --hard       # no diagnostics, warnings are failures
./verify ex200-a --spec        # print a mock's exam paper
./verify history               # what has been run on this machine
```

Anything after the name is passed to the lab script:

| Flag | Effect |
| --- | --- |
| `-v` | show command output for passing checks too, not just failures |
| `--no-mutate` | skip checks that create or delete anything on the box |
| `--after-reboot` | refuse to run unless the machine booted in the last 30 min |
| `--hard` | no diagnostics, warnings become failures, tolerances halve, success needs a reboot |
| `--no-color` | plain output (`NO_COLOR=1` works too) |
| `--spec` | mocks only — print the exam paper with pinned values |
| `--proj=PATH` | Ansible labs — the project directory, default `~/ansible` |
| `--blind` | report pass/fail only, without saying what was checked |

Exit status is 0 when every automated check passed, 1 when something failed,
2 when the script refused to run (wrong user, no reboot, no project directory).

## Where to run each one

| Labs | Run on | As |
| --- | --- | --- |
| `env` | every node — it detects which one it is on | root |
| 1.x, 2.x, 3.x, `breakfix`, `advanced`, 4.2 | rhel01 | root |
| 2.7 | rhel01 **and** rhel02 | root |
| 4.1 | rhel01 | the ordinary user, **not** root |
| `ex200-a`, `ex200-b` | rhel01 | root |
| 5.x, 6.x, 7.x, `s1`–`s5`, `ex294-a` | rhel-control | the ordinary user |

## The reboot rule

Checks marked `[P]` are the ones that classically disappear on restart — a
`setsebool` without `-P`, a runtime-only firewall rule, a service that was
started but never enabled.

The harness records the boot ID on every clean pass. Run a lab again after
`sudo reboot` and the summary says **reboot-proven** instead of *passed on the
same boot*. That distinction is the difference between full marks and zero.

```bash
sudo ./verify 2.5        # passes
sudo reboot
sudo ./verify 2.5 --after-reboot   # this is the run that counts
```

## What a script will not grade

Some acceptance criteria are about judgement or about something transient. Those
appear as `[CHECK]` lines with a note, and they are counted separately from
passes and failures — for example "you can explain why XFS cannot shrink", or
"you reset the root password from the GRUB prompt". Be honest with those; they
are usually the ones that matter.

## The mock graders

`ex200-a`, `ex200-b` and `ex294-a` run one section per exam task and score
**tasks fully correct**, scaled to 300 with the real 210 pass mark. A task with
one failed check scores nothing for that task, which is how Red Hat grades.

Their `--spec` output is the exam paper, with every ambiguous value pinned
(usernames, UIDs, sizes, ports), so the grader is deterministic. Print the spec,
build it, reboot, then grade:

```bash
./verify ex200-b --spec > /tmp/paper.txt
# ... 2.5 hours ...
sudo reboot
sudo ./verify ex200-b --after-reboot
```

Mock EX200-C is EX200-B on a box you first wrecked with `break.sh all`: grade it
with `ex200-b` plus `breakfix`. Mock EX294-B is EX294-A on a wrecked estate:
grade it with `ex294-a`.

## Month 2: the Month 1 checks, run remotely

Week 6 re-does the RHCSA labs through Ansible, so the Week 1–3 check scripts
grade it. `lab-6.1.sh` and friends bundle the relevant Month 1 script, ship it to
the managed node with the `script` module and run it there — from the control
node, without logging in, which is the rule for that week.

## The advanced drills

`break/break-advanced.sh` stages ten harder faults — silent until a reboot, or
with several causes behind one symptom. It names nothing: `list` prints only the
symptoms, `status` says how many are pending, and `reveal` gives you the cause
and your elapsed time once you are finished. `./verify advanced` checks all ten
domains; `--only=fN` checks one. Requirements are in
`10-Advanced-Breakfix-Labs.md`.

Do not read `break/break-advanced.sh`. It contains every answer in plain
English, and `reveal` exists so you never have to.

The check descriptions in `./verify advanced` name the domain they examine, so
running it before you have diagnosed anything narrows the hunt for you. Use
`--blind` while you are still working — it reports pass/fail per check and
nothing else:

```bash
sudo ./verify advanced --blind     # am I done yet?
sudo ./verify advanced             # what is still wrong (after you have tried)
```

## Incidents

`break/incident.sh` is the same fault library, delivered as a **work order**
instead of a drill. `open <1-4>` stages several non-overlapping faults across
the estate, writes `/root/INCIDENT.md` describing only what a user would have
reported, and starts a clock. At severity 3 and above one fault lands on rhel02;
at severity 4 something on the box re-applies a fault every few minutes until
you find and delete it, and one report is a decoy.

```bash
sudo ./break/incident.sh open 3 --yes   # snapshot FIRST — there is no undo
sudo ./break/incident.sh objective      # re-print the work order
sudo ./break/incident.sh status         # elapsed against the target
sudo ./verify incident --blind          # am I there yet?
sudo ./verify incident                  # what is still wrong
sudo ./break/incident.sh reveal         # the causes, and your time
sudo ./break/incident.sh abandon --yes  # surrender: reveal, and drop the persistence
```

`./verify incident` aggregates both health sweeps into one verdict each, times
you against the work order's target, and fails a repair that was bought with a
security control (SELinux off in any of its three places, a widened permission,
a generated policy module) or left its persistence behind. Requirements are in
`11-Incident-Drills.md`.

Do not read `break/incident.sh` either. Its first lines say so, and `reveal`
exists so you never have to.

## Layout

```text
verify/
├── verify                  the dispatcher
├── vagrant/
│   ├── Vagrantfile         the three-node lab on VirtualBox
│   ├── lab.ps1             the Windows wrapper: up / snap / check / break
│   └── provision/          what each node needs, and nothing a lab teaches
├── lib/
│   ├── verify-lib.sh       the check harness (pass/fail, scoring, reboot proof)
│   └── ansible-lib.sh      additions for the Month 2 labs
├── break/
│   ├── break.sh            the single-cause saboteur
│   ├── break-advanced.sh   the advanced saboteur — DO NOT READ IT
│   ├── break-ansible.sh    the Month 2 saboteur
│   └── incident.sh         the work-order composer — DO NOT READ IT EITHER
├── labs/
│   ├── env-check.sh        00-Lab-Environment acceptance test
│   ├── lab-1.1.sh … 4.2    the RHCSA labs
│   ├── breakfix-health.sh  post-repair health check for every break.sh fault
│   ├── breakfix-advanced.sh   the ten advanced drills
│   ├── incident-check.sh   grades a whole incident, against its SLA
│   ├── mock-ex200-a.sh     mock graders
│   ├── lab-5.1.sh … 7.5    the Ansible labs
│   ├── scenario-1.sh … 5   Week 8 scenarios
│   └── mock-ex294-a.sh
└── dist/                   generated by ./verify bundle — not in git
```

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
