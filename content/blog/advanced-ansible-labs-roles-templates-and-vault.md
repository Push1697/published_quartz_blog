---
section: Guides
title: Advanced Ansible Labs - Roles Templates and Vault
created: 2026-09-09
tags:
  - ansible
  - rhce
  - ex294
  - jinja2
  - ansible-vault
  - labs
publish: true
garden: true
description: Jinja2 templates driven by facts, decomposing a monolithic playbook into roles, Ansible Vault used unattended with two vault IDs, collections, and failure handling at scale.
---

# Advanced Ansible Labs - Roles Templates and Vault

Week 7 of [[RHCSA to RHCE - A 60-Day Lab Curriculum]], and the hardest learning
week. By the end of it you must not own a single 500-line playbook. You must own
**reusable structure**.

```text
ansible-rhce/
│
├── ansible.cfg
├── inventory
├── group_vars/
│   ├── all.yml
│   ├── web.yml
│   └── database.yml
│
├── host_vars/
│   ├── rhel01.yml
│   └── rhel02.yml
│
├── roles/
│   ├── common/
│   ├── apache/
│   ├── users/
│   └── security/
│
├── templates/
└── site.yml
```

Checkers: `./verify 7.1` … `7.5`
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).

---

## Lab 7.1 — One template, many hosts (60 min)

**Requirement.** Build `templates/vhost.conf.j2` producing a valid Apache virtual
host that:

1. Uses the host's own FQDN and primary IP from facts.
2. Loops over a list of aliases from a group variable.
3. Includes a conditional block present only on hosts in `prod`.
4. Sets the document root from a variable, with a sensible default if undefined.
5. Carries a header comment warning that the file is Ansible-managed, including
   the template's source path.
6. Is validated with `httpd -t` before deployment.

**Acceptance criteria**

- [ ] Two hosts produce genuinely different, valid output
- [ ] An undefined variable does not crash the run
- [ ] Invalid config is refused before deployment
- [ ] `--check --diff` shows exactly what would change

> [!tip]- The Jinja2 you actually need
> `{% for %}`/`{% endfor %}`, `{% if %}`, `{{ var | default("x") }}`,
> `{{ ansible_facts['fqdn'] }}`, `{{ groups['web'] }}`,
> `{{ hostvars[h]['ansible_default_ipv4']['address'] }}`, and the `| int`,
> `| bool`, `| join(',')` filters. Whitespace control (`{%-`) makes the output
> readable and is worth knowing.

The checker compares the rendered file on two hosts and fails if they are
byte-identical — a template that produces the same output everywhere is not
templating anything. It also greps the template for hardcoded IP addresses.

---

## Lab 7.2 — Decompose into roles (2 × 75 min)

**Requirement.** Convert last week's `site.yml` into four roles, losing no
functionality:

1. `common` — base packages, users, sudo, SSH hardening, time sync.
2. `apache` — install, template, service, firewall, SELinux.
3. `users` — accounts driven entirely by a variable structure.
4. `security` — SELinux, firewalld, audit settings.

Each role must have `defaults/main.yml`, `vars/main.yml`, `tasks/main.yml`,
`handlers/main.yml`, `templates/`, and a `meta/main.yml` declaring any dependency.

**Acceptance criteria**

- [ ] `site.yml` is short — plays and role lists, almost no inline tasks
- [ ] Roles work standalone, on any host, in any order dependencies permit
- [ ] Overriding a default from `group_vars` visibly changes behaviour
- [ ] `ansible-galaxy role init` was used to scaffold, not hand-made directories
- [ ] Still idempotent

```bash
ansible-galaxy role init roles/apache
ansible-playbook site.yml --list-tasks
ansible-playbook site.yml --tags apache
```

> **Roles versus defaults — the precedence point that gets tested.**
> `defaults/main.yml` is the **lowest** precedence in all of Ansible; anything
> overrides it. `vars/main.yml` is very **high** and is hard to override. Put
> anything a user should tune in `defaults`, never in `vars`.

The checker counts inline tasks left in `site.yml`, greps role tasks for
hardcoded hostnames and paths, and proves a default is genuinely overridable by
setting it on the command line and watching the result change.

---

## Lab 7.3 — Secrets that never appear in plaintext (60 min)

**Requirement**

1. Encrypt `group_vars/database.yml` containing a database password.
2. Run a playbook consuming it, supplying the vault password from a **file**, not
   an interactive prompt.
3. Encrypt a single string inline inside an otherwise plaintext file.
4. Rekey the vault to a new password.
5. View and edit the encrypted content without decrypting it on disk.
6. Ensure the secret never appears in playbook output.

**Acceptance criteria**

- [ ] `cat group_vars/database.yml` shows ciphertext
- [ ] The playbook runs unattended with `--vault-password-file`
- [ ] Rekey succeeds and the old password no longer works
- [ ] Output shows `censored`, not the secret

```bash
ansible-vault encrypt group_vars/database.yml
ansible-vault encrypt_string 'S3cret' --name db_password
ansible-vault rekey group_vars/database.yml
ansible-playbook db.yml --vault-password-file ~/.vault_pass
grep -r 'S3cret' . || echo "no plaintext secrets — good"
```

> **`no_log: true`.** Any task handling a secret needs it, or the value is
> printed in the output and in `-v` logs. Vault protects the file at rest;
> `no_log` protects it at runtime. **You need both.**

Pass the plaintext to the checker (`./verify 7.3 --secret=S3cret`) and it will
grep the whole project for it, run the playbook at `-vv` looking for a leak, and
check the vault password file is mode 600.

---

## Lab 7.4 — Know what you have and where it came from (45 min)

**Requirement**

1. List installed collections and locate them on disk.
2. Install a collection from Galaxy into a project-local path.
3. Use a module by FQCN, then via a shorter name, and explain the difference.
4. Write a `requirements.yml` and install from it.
5. Find a module's documentation entirely offline.

**Acceptance criteria**

- [ ] `collections_path` in `ansible.cfg` points at the project directory
- [ ] `ansible-galaxy collection install -r requirements.yml` works
- [ ] You can name the collection any module belongs to
- [ ] Documentation found without a browser

```bash
ansible-galaxy collection list
ansible-doc -l ansible.posix
ansible-config dump | grep -i collections
```

This matters more than it looks. Several modules RHCSA-style work depends on —
**firewalld, selinux, mount, acl, parted, lvg, lvol** — are not in
`ansible.builtin`. If `ansible-doc firewalld` returns nothing during an exam, you
needed a collection and did not check. Full mapping:
[[Manual to Ansible - A Module Map]].

---

## Lab 7.5 — Automation that behaves when things go wrong (2 × 60 min)

**Requirement**

1. A play that runs against three hosts, where one fails and the other two still
   complete. Then the opposite: any failure aborts everything.
2. `block`/`rescue`/`always` performing genuine cleanup after a failure.
3. `max_fail_percentage` and `serial` for a rolling update across the web group,
   two hosts at a time.
4. `pre_tasks` and `post_tasks` around the roles.
5. `delegate_to` running a task on the control node on behalf of a managed host.
6. `run_once` for a task that must happen exactly once regardless of host count.
7. Tags allowing any single stage to run in isolation.

**Acceptance criteria**

- [ ] The rolling update visibly proceeds in batches
- [ ] The rescue block runs on failure, and cleanup is verifiable
- [ ] `--tags` and `--skip-tags` both behave as intended
- [ ] The `run_once` task executes exactly once

```bash
ansible-playbook rolling.yml            # watch the batching
ansible-playbook site.yml --list-tags
ansible-playbook site.yml --tags security --check
ansible-playbook site.yml --skip-tags storage
```

The checker counts `PLAY` headers to prove `serial` actually batched, and counts
hosts on the `run_once` task to prove it really ran once. Tag the failure-
injecting play `rescue-test` and the `run_once` task `once`, and it can grade
those automatically too.

---

## The gate

- [ ] No monolithic playbooks remain — everything is roles
- [ ] I can scaffold a role from scratch in under five minutes
- [ ] Vault works unattended with a password file
- [ ] I know which collection any module I use comes from
- [ ] I can explain defaults versus vars precedence without looking it up
- [ ] Templates use facts and conditionals, not hardcoded values

→ Next: [[Ansible Scenario Labs and the EX294 Mock]]
