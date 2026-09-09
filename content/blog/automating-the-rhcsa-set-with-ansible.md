---
section: Guides
title: Automating the RHCSA Set with Ansible
created: 2026-09-09
tags:
  - ansible
  - rhce
  - ex294
  - automation
  - labs
publish: true
garden: true
description: "The week that joins the two certifications - every manual RHCSA lab redone as an idempotent playbook, against freshly reverted nodes, with one rule: never log in to fix anything."
---

# Automating the RHCSA Set with Ansible

Week 6 of [[RHCSA to RHCE - A 60-Day Lab Curriculum]], and the hinge of the whole
thing. Everything you did by hand in weeks 1–3 you now do again — through
Ansible. Nothing new to learn conceptually; everything to gain in fluency.

Revert both managed nodes to `clean` before each lab, so you are always
automating from a genuinely fresh machine.

> **The one rule this week: you may not SSH into a managed node to fix
> anything.** If something is wrong, fix the playbook and re-run it. Log in only
> to *verify*, never to repair. This rule is the entire point of the week.

Reference throughout: [[Manual to Ansible - A Module Map]]. Checkers:
`./verify 6.1` … `6.5`
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).

> **How these labs are graded.** The end state is identical to the manual labs,
> so the *same* checkers grade it. `verify 6.1` and friends bundle the relevant
> week 1–3 check script, ship it to the managed node with the `script` module,
> and run it there — from the control node, without logging in. If your playbook
> produced the right machine, the manual lab's checker passes on it unchanged.

---

## Lab 6.1 — Users, sudo and SSH (75 min)

Redo the manual users/sudo/SSH labs as `users.yml`, taking a fresh node to:

1. Groups `developers` (GID 5000) and `contractors`.
2. Users amit, sara, raj with correct primary groups; vendor1 with no shell.
3. sara's password ageing: 30-day maximum, 7-day warning.
4. raj locked.
5. SSH public keys deployed for amit and sara.
6. Passwordless sudo for `developers`, limited to two specific httpd commands,
   with the sudoers file **validated before deployment**.
7. sshd: key-only, root denied, port 2222 added — including the SELinux and
   firewall consequences.

**Acceptance criteria**

- [ ] Runs against a `clean` node and reproduces the manual end state exactly
- [ ] Second run: `changed=0`
- [ ] An invalid sudoers template is **rejected**, not deployed
- [ ] You never logged into the node to fix anything

**Verify** — from the control node only:

```bash
ansible managed -m command -a 'getent group developers' --become
ansible managed -m command -a 'chage -l sara' --become
ansible managed -m command -a 'semanage port -l' --become | grep 2222
ansible-playbook users.yml   # changed=0
```

The checker deliberately corrupts your sudoers template, re-runs the playbook,
and requires that the deployment **fail** — then confirms sudoers on the node
still parses. If a broken template reaches a real machine, you have locked
yourself out of root.

Note what is *not* allowed here: `useradd`, `groupadd`, `usermod` and `chage`
smuggled in through `command`. The checker greps for them.

---

## Lab 6.2 — Packages, repositories and services (60 min)

`services.yml`:

1. Define a custom repository via `yum_repository`.
2. Install a defined package list.
3. Deploy a script and its unit file from templates.
4. `daemon_reload` when the unit changes, and only then.
5. Enable and start it.
6. Set the default systemd target to multi-user.
7. Mask `debug-shell.service`.

**Acceptance criteria**

- [ ] The repo file is managed by Ansible, not hand-edited
- [ ] Unit changes trigger a reload; unchanged runs do not
- [ ] Idempotent
- [ ] Survives a reboot triggered *by the playbook itself*

```bash
ansible-playbook services.yml
ansible managed -m reboot --become
ansible managed -m command -a 'systemctl is-active siteguard'
```

The checker disturbs the unit file on one host and requires the reload to fire on
the next run — and requires that it does **not** fire on an unchanged run.

---

## Lab 6.3 — Storage (90 min)

The hardest automation lab of the week. Storage modules live outside
`ansible.builtin`.

Against a `clean` node with two blank disks:

1. Partition the first disk — 2 GB and 1 GB.
2. XFS on the 2 GB partition, mounted persistently at `/data` **by UUID**, with
   `noexec,nodev`.
3. Swap on the 1 GB partition, enabled persistently.
4. Volume group `vgdata` on the second disk, 16 MB extents.
5. `lvapp` 4 GB XFS at `/app`; `lvlogs` 2 GB ext4 at `/applogs`.
6. Re-running the playbook with `lvapp` set to 9 GB extends the LV **and** grows
   the filesystem.

**Acceptance criteria**

- [ ] Everything created from a blank disk in one run
- [ ] fstab entries use UUIDs, written by the `mount` module
- [ ] Changing the size variable and re-running grows the filesystem safely
- [ ] Second run with unchanged variables: `changed=0`
- [ ] Survives a reboot

> [!tip]- Hint
> `community.general.parted`, `community.general.filesystem` (with
> `resizefs: true`), `community.general.lvg`, `community.general.lvol`
> (`size: 9g`, `resizefs: true`), and `ansible.posix.mount` — where
> `state: mounted` writes fstab **and** mounts, while `state: present` writes fstab
> only.

> **Idempotence and destructive modules.** `filesystem` will happily reformat if
> you let it — `force: false` is the default for a reason. Test with `--check`
> first. This is the one lab where a mistake costs you the node, so snapshot
> before every run.

---

## Lab 6.4 — Networking, firewall and SELinux (75 min)

`security.yml`:

1. Set hostnames via Ansible.
2. Manage the static IP profile with `nmcli`.
3. SELinux enforcing, persistently.
4. The `/web(/.*)?` file context, applied and relabelled.
5. `httpd_can_network_connect` on, persistently.
6. Port 2222 added to `ssh_port_t`.
7. firewalld: zones, services, ports, and a rich rule.
8. Everything permanent, everything idempotent.

**Acceptance criteria**

- [ ] `restorecon -Rvn /web` reports nothing after the run
- [ ] Booleans persist across a reboot
- [ ] Firewall runtime and permanent configs match
- [ ] Re-running changes nothing

Two things the checker is strict about, because they are the two most common
zero-mark answers:

- `seboolean` needs `persistent: true`. Without it the boolean disappears on
  reboot.
- `firewalld` needs both `permanent: true` **and** `immediate: true`, or you have
  configured exactly one of the two states the exam checks.

And again: no `semanage`, `setsebool` or `firewall-cmd` through `shell`. There is
a module for each.

> A network playbook that cuts you off is the one mistake that needs console
> access to recover. Test with `--check --diff` first, and keep a second session
> open.

---

## Lab 6.5 — Ten servers, zero SSH sessions (3–4 hours)

> **Configure 10 new RHEL web servers without manually SSHing into any of them.**

You have two VMs, so simulate the rest: add eight more inventory entries pointing
at the two real hosts with `ansible_host`, or clone two more nodes. The point is
that the playbook must not care how many there are.

**The pipeline your playbook must implement**

```text
Create admin users
        ↓
Configure SSH (keys, hardening)
        ↓
Install packages
        ↓
Deploy configuration (templated per host)
        ↓
Configure firewall
        ↓
Configure SELinux
        ↓
Start services
        ↓
Enable at boot
        ↓
Verify
```

**Requirement**

1. `site.yml` runs the whole pipeline end to end on a fresh node.
2. Per-host values (hostname, IP, site name) come from inventory variables and
   facts — never hardcoded.
3. The final *verify* stage genuinely verifies: it checks the service responds,
   the port is open and the config survives — and **fails the play** if not.
4. The playbook is safe to run repeatedly.
5. It works on a node you have never logged into.

**Acceptance criteria**

- [ ] One command takes N fresh nodes to fully configured
- [ ] `changed=0` on the second run across every host
- [ ] The verification stage fails loudly when you sabotage a host
- [ ] You did not SSH in to fix anything all week

```bash
ansible-playbook site.yml
ansible-playbook site.yml | grep -E 'changed=[1-9]'    # nothing
# then sabotage a host and prove the verification catches it:
ansible rhel01 -m command -a '/root/break.sh firewall' --become
ansible-playbook site.yml --tags verify                # must FAIL
```

> **Verification that actually verifies.** A `debug` message saying "done" is not
> verification. Use `uri`, `wait_for`, or `command` with `failed_when`. `assert`
> is the exam-friendly one:
>
> ```yaml
> - name: Web service is genuinely serving
>   ansible.builtin.assert:
>     that:
>       - result.status == 200
>     fail_msg: "Site not responding on {{ inventory_hostname }}"
> ```

`./verify 6.5 --sabotage` runs that whole sequence for you: it breaks the
firewall on a web host, runs your verify tag, and fails the check if your
verification reported success on a broken machine. A green playbook run against
a broken host is a zero with a smile on it.

---

## The gate

- [ ] Every RHCSA topic from weeks 1–3 now exists as working automation
- [ ] I did not log into a managed node to repair anything all week
- [ ] My playbooks are idempotent, verified by a second run
- [ ] I know which modules need `ansible.posix` versus `community.general`
- [ ] Storage automation works from blank disks

→ Next: [[Advanced Ansible Labs - Roles Templates and Vault]]
