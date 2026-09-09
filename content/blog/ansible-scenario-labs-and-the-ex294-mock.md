---
section: Guides
title: Ansible Scenario Labs and the EX294 Mock
created: 2026-09-09
tags:
  - ansible
  - rhce
  - ex294
  - mock
  - troubleshooting
  - labs
publish: true
garden: true
series: RHCSA → RHCE
series_order: 10
series_group: Month 2 — Ansible
description: Five end-to-end Ansible scenarios, a saboteur that corrupts your automation project nine different ways, and a full four-hour EX294-style mock paper with every value pinned.
---

# Ansible Scenario Labs and the EX294 Mock

Week 8 of [[rhcsa-to-rhce-a-60-day-lab-curriculum|RHCSA to RHCE - A 60-Day Lab Curriculum]]. Stop watching courses.
Every evening gets one scenario: read the requirement, build it, verify it,
reboot, verify again. Then break it and repair it.

Revert both managed nodes to `clean` before each scenario. `ansible-doc` is your
only reference. Checkers: `./verify s1` … `s5` and `./verify ex294-a`
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).

---

## Scenario 1 — Fleet baseline (90 min)

> Configure three RHEL servers with users, SSH keys, sudo and required packages
> using Ansible.

1. Groups `sysadmins` and `developers`; five users distributed across them from a
   variable structure.
2. SSH public keys deployed for all five.
3. `sysadmins` gets passwordless sudo; `developers` gets password-required sudo
   restricted to service management.
4. Baseline packages installed on every host; a different additional set per
   group.
5. SSH hardened: no root login, no password authentication.
6. `/etc/motd` templated with the hostname and the build date.

**Acceptance criteria**

- [ ] One run against three fresh hosts
- [ ] `changed=0` on the second run
- [ ] sudoers validated before deployment
- [ ] Key-only SSH confirmed for every user
- [ ] Survives a reboot

The checker requires the five users to come from a **variable structure**, not
five tasks — it counts the `user:` tasks in the whole project.

---

## Scenario 2 — Web tier, end to end (90 min)

> Deploy Apache to the web group, configure firewall and SELinux, deploy a
> templated configuration, and make everything persistent.

1. Apache installed, enabled, running on the `web` group only.
2. Document root at `/web/site` — **not** the default — with correct SELinux file
   contexts applied via policy, not `chcon`.
3. Templated virtual host, validated before deployment.
4. firewalld permitting http and https, permanently.
5. An extra listener on port 8080, with the matching SELinux port definition.
6. A handler restarting Apache only when configuration actually changes.
7. Index page generated from facts, naming the host.

**Acceptance criteria**

- [ ] `curl rhel01` and `curl rhel01:8080` both return the host's own page
- [ ] `restorecon -Rvn /web` outputs nothing
- [ ] SELinux enforcing throughout
- [ ] A reboot changes nothing
- [ ] Second run: zero changes

"On the web group only" is graded both ways: httpd running on `web`, and httpd
**not installed** anywhere else.

---

## Scenario 3 — Environment separation (75 min)

> Configure different settings for production and development using
> inventory/group variables.

1. `prod` and `dev` groups, one host each.
2. Identical playbook, different outcomes: different document roots, different
   log levels, different package sets, firewall open widely in dev and narrowly
   in prod.
3. Production hosts additionally get a stricter SSH configuration and audit
   settings.
4. A single variable flips a host between environments with no playbook edit.
5. `group_vars/all.yml` supplies defaults that both environments override.

**Acceptance criteria**

- [ ] Zero environment-specific logic hardcoded in tasks
- [ ] Moving a host between groups changes its build with no other change
- [ ] `ansible-inventory --graph` documents the layout
- [ ] Both environments idempotent

> **This is the scenario that tests whether you understood variables.** If you
> find yourself writing `when: inventory_hostname == "rhel01"`, stop. That is the
> wrong answer. Use group membership and variables.

The checker is blunt about it: any `when: inventory_hostname ==` anywhere in the
project fails the scenario, however well the estate happens to be configured. It
then proves the two hosts genuinely resolve at least one variable differently,
and that prod's firewall is narrower than dev's.

---

## Scenario 4 — Secrets (60 min)

> Store sensitive information using Vault and consume it from a playbook.

1. Database credentials in an encrypted `group_vars/db.yml`.
2. A user account whose password comes from the vault, hashed correctly — a
   plaintext password in `/etc/shadow` is a failure.
3. A templated application config file containing the secret, mode `0600`, owned
   by the service account.
4. The playbook runs unattended via a vault password file.
5. The secret appears nowhere in output, even with `-vv`.
6. A second, separately-encrypted vault file with a **different** password, both
   used in one run.

**Acceptance criteria**

- [ ] `grep -r` across the repo finds no plaintext secret
- [ ] Runs unattended, no prompt
- [ ] Output shows `censored` where the secret would be
- [ ] Two vault IDs used simultaneously

```bash
ansible-playbook db.yml --vault-id dev@~/.vault_dev --vault-id prod@~/.vault_prod
ansible-playbook db.yml -vv | grep -i s3cret || echo "clean"
ansible db -m command -a 'getent shadow appuser' --become
```

The checker reads the shadow field and requires a real hash prefix. `$6$` or
`$y$` passes; anything that looks like your plaintext fails.

---

## Scenario 5 — A role that builds a server from nothing (90 min)

> Build an Apache role that can configure a completely fresh RHEL server.

1. A single role, scaffolded with `ansible-galaxy role init`.
2. Takes a `clean` node to a fully working, firewalled, SELinux-correct web
   server with one play and no external tasks.
3. Every tunable exposed in `defaults/main.yml` — port, document root, server
   name, package list.
4. Handlers for reload versus restart, used correctly.
5. `meta/main.yml` declares its dependency on your `common` role.
6. Documented in the role's own `README.md`.
7. Works unchanged on a host it has never seen.

**Acceptance criteria**

- [ ] `ansible-playbook -e "apache_port=8888"` visibly changes the result
- [ ] The role runs standalone against a clean node
- [ ] Zero hardcoded hostnames or paths in `tasks/`
- [ ] Idempotent and reboot-safe

---

## Break your own automation

This is where a great deal of the learning actually happens. `break-ansible.sh`
corrupts the *project* rather than the hosts:

```bash
git init && git add -A && git commit -m ok    # commit first, always
./break/break-ansible.sh ~/ansible list
./break/break-ansible.sh ~/ansible random
```

The nine faults are the nine ways automation fails: broken YAML indentation, an
unreachable inventory host, a missing SSH key, `become` turned off, an undefined
variable in a template, a typo'd collection name, a condition that no longer
matches any group, an unclosed Jinja2 block, and a `notify:` pointing at a
handler name that does not exist.

Combine it with the host saboteur from
[[rhcsa-security-labs-selinux-firewalld-and-boot-recovery|RHCSA Security Labs - SELinux firewalld and Boot Recovery]] — a fault on the
target *and* a fault in the automation at the same time is the realistic case.

### The error catalogue to drill

| Fault | Where it shows up | Your first move |
| --- | --- | --- |
| Wrong YAML indentation | Parse error before any task runs | `ansible-playbook --syntax-check` |
| Wrong inventory | `UNREACHABLE`, or "skipping: no hosts matched" | `ansible-inventory --graph` |
| SSH failure | `UNREACHABLE`, permission denied | `ansible <host> -m ping -vvv` |
| sudo failure | `sudo: a password is required` | check `become`, `-K`, sudoers |
| Undefined variable | `'x' is undefined` at template time | `--check`, then `\| default()` |
| Missing collection | `couldn't resolve module/action` | `ansible-galaxy collection list` |
| Incorrect condition | Task silently skips, nothing happens | `--check -vv`, print the fact |
| Bad template | `TemplateSyntaxError` | render with `--check --diff` |
| Service failure | Task fails on start | `journalctl -xeu` on the target |
| SELinux problem | Service starts, access denied | `ausearch -m AVC -ts recent` |
| Firewall problem | Service up, unreachable | `firewall-cmd --list-all` |

> **"Skipping" is the dangerous one.** A failed task shouts at you. A wrongly
> conditioned task **succeeds silently** and does nothing. In an exam that is a
> zero with a green playbook run. Always read the recap line: `ok=`, `changed=`,
> and especially `skipped=`.

---

## The EX294-style mock (4 hours)

Revert all three nodes to `clean`. Work only from the control node. You may not
SSH into a managed node except to verify. Graded after a reboot of every node.

**Setup**

1. A project directory with an `ansible.cfg` setting the inventory, roles path,
   collections path, remote user and privilege escalation.
2. An inventory with groups `webservers`, `databases`, `prod`, `dev` and a parent
   group `all_managed`.
3. `ansible.posix` and `community.general` installed into a project-local path
   from a `requirements.yml`.

**Playbooks** — each a separate file.

4. `packages.yml` — install a defined package list on all managed hosts; install
   an extra package only on hosts with more than 1 GB of RAM, decided by a fact.
5. `users.yml` — create users from a **vault-encrypted** variable file; the web
   list gets accounts on webservers only, the db list on databases only.
   Passwords hashed, never plaintext. Deploy SSH keys.
6. `webserver.yml` — install and enable httpd on webservers; serve a templated
   `index.html` naming the host and its IP from facts; open the firewall; set
   correct SELinux contexts for a non-default document root.
7. `storage.yml` — on databases, create a VG and LV from a blank disk, format
   XFS, mount persistently at `/dbdata`. If the disk is absent the play must fail
   with a clear message rather than crash.
8. `roles/apache/` — a role fully configuring a web server, all tunables in
   `defaults/`, with handlers.
9. `site.yml` — runs everything in the right order, with tags per stage.
10. `report.yml` — generates `/root/report.txt` on every managed host containing
    hostname, IP, kernel, memory and free disk, from a template.
11. A rolling update across webservers, two at a time, aborting above 25%
    failure.
12. Every playbook idempotent: a second run reports `changed=0`.

**Grading**

```bash
./verify ex294-a --spec                       # print the paper
# ... 4 hours ...
ansible all_managed -m reboot --become
./verify ex294-a --proj=~/ansible-exam --secret=<your-secret> --pw=~/.vault_pass
```

One section per task, scored as tasks fully correct out of 300, against the real
**210 pass mark**. Requirement 7's "must fail with a clear message" is graded by
running your playbook against a deliberately non-existent disk and requiring a
message rather than a traceback.

**The hostile variant.** Same paper, but you inherit a broken estate: run the
host saboteur and the Ansible saboteur first, repair everything, then complete
the tasks. Additionally, destroy one managed node, rebuild it, and bring it back
to full parity using **only** `site.yml`.

> **A four-hour mock does not fit a weekday evening.** Decide in week 7 whether
> to take a day off for it or move it to a weekend. A half-run mock teaches you
> very little; a properly run one is the single best predictor of your result.

---

## The gate

- [ ] All five scenarios completed unaided
- [ ] Every fault in both saboteurs diagnosed in under 10 minutes
- [ ] I read the play recap for `skipped=` as a matter of habit
- [ ] Every playbook I write is idempotent by habit, not by checking
- [ ] `ansible-doc -s` is faster for me than trying to recall syntax

> **The last thing to internalise.** When you are stuck, the answer is almost
> always `ansible-doc -s <module>` or `man <thing>`. Reaching for documentation
> is not failure — it is the skill being tested. Freezing because you cannot
> recall syntax is what costs marks.

→ [[red-hat-exam-day-protocol|Red Hat Exam Day Protocol]] · [[manual-to-ansible-a-module-map|Manual to Ansible - A Module Map]]
