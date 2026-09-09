---
section: Reference
title: Manual to Ansible - A Module Map
created: 2026-09-09
tags:
  - ansible
  - rhcsa
  - rhce
  - ex294
  - reference
publish: true
garden: true
series: RHCSA → RHCE
series_order: 11
series_group: Companions
description: Every RHCSA task mapped to its manual command, its Ansible module and the collection that module lives in - plus the collections trap that catches people out in the exam.
---

# Manual to Ansible - A Module Map

The single most useful reference for anyone going from RHCSA to RHCE. It is what
turns two unrelated certifications into one continuous skill.

**The method change.** The usual advice is *watch → understand → do it yourself →
break it → troubleshoot → rebuild.* Replace it with:

> **Learn it manually → automate it with Ansible → break it → troubleshoot it →
> rebuild it automatically.**

Do this on the *same day* for the *same topic*. On the day you create users by
hand, you also write the `user` module task. The bridge gets built daily rather
than saved up for one panicked week.

Part of [[rhcsa-to-rhce-a-60-day-lab-curriculum|RHCSA to RHCE - A 60-Day Lab Curriculum]].

---

## The collections trap

Only some of these modules ship in `ansible.builtin`. Several of the ones you
need most for RHCSA-style work — **firewalld, SELinux, mount, ACL, LVM** — live
in `ansible.posix` or `community.general`.

```bash
ansible-galaxy collection list                    # what you actually have
ansible-doc -l ansible.posix                      # what is inside one
ansible-galaxy collection install ansible.posix community.general
```

Install both on the control node early, and confirm again before any mock exam.
**If `ansible-doc firewalld` returns nothing during the exam, you needed the
collection and did not check.**

---

## The map

| RHCSA task | Manual command | Ansible module | Collection |
| --- | --- | --- | --- |
| Create user | `useradd` | `user` | builtin |
| Create group | `groupadd` | `group` | builtin |
| Set password | `passwd` | `user` + `password:` (hashed) | builtin |
| Password ageing | `chage` | `user` (`password_expire_*`) | builtin |
| Deploy SSH key | `ssh-copy-id` | `authorized_key` | ansible.posix |
| sudo rules | `visudo` | `copy`/`template` + `validate` | builtin |
| Install package | `dnf install` | `dnf` | builtin |
| Package group | `dnf group install` | `dnf` (`name: "@group"`) | builtin |
| Add repository | edit `.repo` | `yum_repository` | builtin |
| Start/enable service | `systemctl` | `service` / `systemd_service` | builtin |
| Custom unit file | write `.service` | `template` + `systemd_service` (`daemon_reload`) | builtin |
| Firewall port/service | `firewall-cmd` | `firewalld` | **ansible.posix** |
| SELinux mode | `setenforce` | `selinux` | **ansible.posix** |
| SELinux boolean | `setsebool -P` | `seboolean` | **ansible.posix** |
| SELinux context | `semanage fcontext` | `sefcontext` + `command: restorecon` | community.general |
| SELinux port | `semanage port` | `seport` | community.general |
| Copy file | `cp` | `copy` | builtin |
| Templated config | edit by hand | `template` (Jinja2) | builtin |
| Line in a file | `sed -i` | `lineinfile` / `blockinfile` | builtin |
| Permissions/ownership | `chmod`, `chown` | `file` | builtin |
| ACLs | `setfacl` | `acl` | **ansible.posix** |
| Create directory | `mkdir -p` | `file` (`state: directory`) | builtin |
| Archive | `tar` | `archive` / `unarchive` | builtin |
| Cron job | `crontab -e` | `cron` | builtin |
| systemd timer | write `.timer` | `template` + `systemd_service` | builtin |
| Mount + fstab | `mount`, edit fstab | `mount` | **ansible.posix** |
| Partition | `parted`, `fdisk` | `parted` | community.general |
| Filesystem | `mkfs.xfs` | `filesystem` | community.general |
| LVM volume group | `vgcreate` | `lvg` | community.general |
| LVM logical volume | `lvcreate`, `lvextend` | `lvol` | community.general |
| Swap | `mkswap`, `swapon` | `filesystem` + `mount` | mixed |
| Hostname | `hostnamectl` | `hostname` | builtin |
| Network config | `nmcli` | `nmcli` | community.general |
| Kernel parameter | `sysctl` | `sysctl` | ansible.posix |
| Reboot and wait | `reboot` | `reboot` | builtin |
| Gather system info | `uname`, `df` | `setup` (facts) | builtin |
| No module exists | — | `command` (never `shell` unless you need a shell) | builtin |

---

## The pattern to repeat for every topic

**Manual, in the morning:**

```bash
groupadd -g 5000 developers
useradd -g developers -c "Amit" amit
usermod -aG wheel amit
chage -M 30 -W 7 sara
```

**Automated, the same evening — same outcome:**

```yaml
- name: Developer accounts exist
  hosts: managed
  become: true

  vars:
    developers:
      - { name: amit, uid: 3001, comment: "Amit" }
      - { name: sara, uid: 3002, comment: "Sara" }

  tasks:
    - name: Developers group exists
      ansible.builtin.group:
        name: developers
        gid: 5000
        state: present

    - name: Developer accounts exist
      ansible.builtin.user:
        name: "{{ item.name }}"
        uid: "{{ item.uid }}"
        group: developers
        comment: "{{ item.comment }}"
        state: present
      loop: "{{ developers }}"
```

Then **break it** — delete a user, change a UID by hand, remove the group — and
**rebuild it by re-running the playbook**. That final step is what the exam
actually measures.

---

## When there is no module

Use `command`, and make it honest about change:

```yaml
- name: Relabel the web content
  ansible.builtin.command: restorecon -Rv /web
  register: relabel
  changed_when: relabel.stdout | length > 0
```

Without `changed_when`, that task reports `changed` on every single run and your
playbook is no longer idempotent. `shell` is only for when you genuinely need
pipes, redirection or globbing — otherwise `command` is safer, because it does
not invoke a shell at all.

---

## Finding the module in the exam

You will not remember every module. You do not need to. You need this reflex:

```bash
ansible-doc -l | grep -i <thing>          # find it
ansible-doc <module>                      # read the options
ansible-doc -s <module>                   # copy the skeleton
```

Practise it until it is faster than recalling from memory. It is allowed, it is
reliable, and it is the difference between a pass and a blank screen.

## The three module choices that most often cost marks

**`state: present` versus `state: latest`** on `dnf`. They are not the same
answer, and a requirement that says "install" is not a requirement that says
"upgrade".

**`state: mounted` versus `state: present`** on `mount`. `mounted` writes fstab
**and** mounts now; `present` writes fstab only. A requirement asking for a
persistent mount that is also active right now needs the first.

**`permanent: true` without `immediate: true`** on `firewalld`. You have then
configured exactly one of the two states the exam checks. Set both.

→ [[ansible-fundamentals-labs|Ansible Fundamentals Labs]] · [[automating-the-rhcsa-set-with-ansible|Automating the RHCSA Set with Ansible]] ·
[[red-hat-exam-day-protocol|Red Hat Exam Day Protocol]]
