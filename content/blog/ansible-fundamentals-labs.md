---
section: Guides
title: Ansible Fundamentals Labs
created: 2026-09-09
tags:
  - ansible
  - rhce
  - ex294
  - automation
  - labs
publish: true
garden: true
description: Seven requirement-driven Ansible labs - inventory and config, ad-hoc administration, your first playbook, variable precedence, loops, handlers and error handling - graded on idempotence.
---

# Ansible Fundamentals Labs

Week 5 of [[RHCSA to RHCE - A 60-Day Lab Curriculum]], and where the RHCE half
properly begins. Seven labs, each stated as a requirement.

> **The only reference you are allowed is `ansible-doc`.** Not the web, not a
> cheat sheet. The exam gives you the installed documentation and nothing else,
> so build the habit now:
>
> ```bash
> ansible-doc -l | grep -i firewall
> ansible-doc ansible.builtin.user
> ansible-doc -s ansible.builtin.dnf      # ready-to-paste snippet
> ```
>
> `ansible-doc -s` is the single highest-value command in this entire week.

All work happens on the control node in `~/ansible/`, against the two managed
nodes from [[Building a Three-Node RHEL Lab on KVM]]. Checkers:
`./verify 5.1` … `5.7`
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).
These ones **run your playbooks**, twice, because idempotence is the requirement
and it cannot be checked any other way.

---

## Lab 5.1 — Make the control node work (60 min)

**Requirement**

1. `~/ansible/ansible.cfg` used automatically when you run `ansible` from that
   directory — prove Ansible is reading *yours*, not `/etc/ansible/ansible.cfg`.
2. An inventory defining groups `web` (rhel01), `db` (rhel02), `prod` (rhel01),
   `dev` (rhel02), and a parent group `managed` containing web and db.
3. Passwordless SSH and passwordless privilege escalation to both nodes.
4. Prove connectivity with an ad-hoc ping.
5. Show which host belongs to which groups without reading the file.

**Acceptance criteria**

- [ ] `ansible --version` reports your config file path
- [ ] `ansible managed --list-hosts` returns both nodes
- [ ] `ansible all -m ping` returns SUCCESS for both
- [ ] `ansible all -m command -a id --become` returns uid=0
- [ ] `ansible-inventory --graph` shows the group tree

> **The config-file trap.** Ansible ignores an `ansible.cfg` in a
> **world-writable** directory, silently. If your config seems to be ignored,
> check the directory permissions before anything else.

---

## Lab 5.2 — A full day of admin without a playbook (60 min)

**Requirement.** Using **only** ad-hoc commands, on all managed nodes:

1. Install `httpd` and `firewalld`.
2. Start and enable both.
3. Create user `webadmin` with a specific UID.
4. Copy a file to `/etc/motd` with defined content.
5. Open the http service in the firewall permanently.
6. Gather and display only the `ansible_distribution*` facts.
7. Reboot one node and wait for it to return.

**Acceptance criteria**

- [ ] Every task done ad-hoc, no playbook file
- [ ] The second run of each command reports `ok`, not `changed`
- [ ] You found each module with `ansible-doc`, not from memory

> **Idempotence is the whole idea.** Run every command twice. The second run
> must be green `ok`, not orange `changed`. A task that reports `changed` on
> every run is a broken task — `command` and `shell` are the usual culprits,
> which is exactly why you avoid them whenever a real module exists.

---

## Lab 5.3 — Construct, don't copy (75 min)

**Requirement.** Write `~/ansible/web.yml` that configures the `web` group as a
working web server. Do **not** copy this from anywhere — build it task by task,
finding each module with `ansible-doc`.

1. Install httpd and firewalld.
2. Deploy `/var/www/html/index.html` containing the host's own hostname and IP,
   sourced from facts.
3. Start and enable httpd.
4. Permit http through the firewall, permanently.
5. Be fully idempotent.

**Acceptance criteria**

- [ ] `ansible-playbook --syntax-check web.yml` passes
- [ ] `ansible-playbook --check web.yml` runs clean against a configured host
- [ ] `curl rhel01` returns the correct hostname
- [ ] Second run: **zero** changed tasks
- [ ] No `command` or `shell` module used anywhere

> [!tip]- YAML failures that will cost you marks
> Tabs are illegal — spaces only. `become: true` at play level versus task level.
> A colon inside an unquoted value breaks the parse. `state: present` and
> `state: latest` are not the same answer.

---

## Lab 5.4 — Same playbook, different results per host (60 min)

**Requirement**

1. `group_vars/web.yml` sets the served port to 80; `group_vars/db.yml` sets
   database-related variables.
2. `host_vars/rhel01.yml` overrides one group variable — prove which wins.
3. A playbook that uses `ansible_facts` to install the correct package name
   depending on the distribution major version.
4. Register the output of a command and use it in a later task.
5. Create a custom fact under `/etc/ansible/facts.d/` on one node and consume it.
6. Prompt for a variable at runtime, with a sensible default.

**Acceptance criteria**

- [ ] Host var demonstrably beats group var
- [ ] The custom fact appears under `ansible_local`
- [ ] The registered variable is used, and you can print its `.stdout`
- [ ] You can state the precedence order from memory

> [!tip]- Precedence, roughly lowest to highest
> role defaults → `group_vars/all` → `group_vars/<group>` → `host_vars` → play vars
> → task vars → **`-e` extra vars always win.**
>
> Knowing that `-e` wins is a frequent exam question, usually shaped as "why is my
> variable being ignored".

---

## Lab 5.5 — Stop repeating yourself (60 min)

**Requirement**

1. Create five users from a list of dictionaries, each with their own UID, group
   and comment — in a **single** task.
2. Install a list of packages in one task.
3. Start a service only if the host is in the `web` group.
4. Deploy a config file only when a given file does not already exist.
5. Apply a task only when a registered command succeeded.
6. Loop over a dictionary and print key/value pairs.
7. Skip a task entirely on RHEL 8, run it on RHEL 9 and above.

**Acceptance criteria**

- [ ] No copy-pasted near-identical tasks anywhere
- [ ] Conditionals use facts and group membership, not hardcoded hostnames
- [ ] Skipped tasks report `skipping`, not failure
- [ ] The playbook is idempotent

> [!tip]- Hint
> `loop:` with a list of dicts and `{{ item.name }}`. `when:` takes a bare
> expression — no `{{ }}` around the whole condition. For the version test:
> `when: ansible_facts['distribution_major_version'] | int >= 9`.

The checker counts your `user:` tasks. If there is more than one, you solved it
by copy-paste and the lab is not done.

---

## Lab 5.6 — Behave correctly when things change or fail (60 min)

**Requirement**

1. Deploy an httpd config file; restart httpd **only when the file changes**, via
   a handler.
2. Validate the config before it is put in place — a broken config must never
   reach the server.
3. A task that is allowed to fail without stopping the play.
4. A task whose failure condition you define yourself, based on its output.
5. A block that runs cleanup even when an earlier task fails.
6. Force handlers to run even if a later task fails.

**Acceptance criteria**

- [ ] Unchanged config → the handler does **not** fire
- [ ] Changed config → the handler fires exactly once
- [ ] A deliberately broken config is rejected before deployment
- [ ] The play continues past the permitted failure
- [ ] Rescue and always blocks demonstrably execute

> [!tip]- Hint
> `notify:` plus `handlers:`; `validate: 'httpd -t -f %s'` on the template or copy
> module; `ignore_errors: true`; `failed_when:`; `changed_when:`;
> `block`/`rescue`/`always`; `--force-handlers`.

The checker proves handler behaviour properly: it disturbs the deployed file on
a target, re-runs your playbook, and asserts the handler fired exactly once. It
does not put the file back — your playbook is supposed to.

---

## Lab 5.7 — Timed build (90 min, closed-book except `ansible-doc`)

Revert both managed nodes to `clean`. One playbook, run once, that takes both
nodes from fresh to:

1. A `sysadmins` group and three users in it, with SSH keys deployed.
2. Passwordless sudo for that group, with the sudoers file **validated before
   deployment**.
3. httpd installed, configured, running and enabled — on `web` only.
4. A templated index page naming the host.
5. firewalld permitting http on web, and nothing extra anywhere.
6. A daily systemd timer running a maintenance script.
7. Handlers restarting services only on real change.
8. Idempotent: a second run reports zero changes.

- [ ] Completed inside 90 minutes
- [ ] `ansible-doc` was the only reference used
- [ ] Second run: `changed=0` on every host

> **The sudoers validate trap.** `validate: 'visudo -cf %s'` on the `copy` or
> `template` module. Deploying a broken sudoers file with no validation locks you
> out of root entirely — a genuinely unrecoverable mistake on a machine without
> console access.

---

## The bridge

Do not treat Ansible as a separate subject. Every RHCSA task has a module, and
the mapping is the most valuable reference in this curriculum:
[[Manual to Ansible - A Module Map]].

Next week you re-do every Month 1 lab through Ansible, with one rule: you may not
log into a managed node to fix anything.

→ Next: [[Automating the RHCSA Set with Ansible]]
