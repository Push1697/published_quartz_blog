---
section: Guides
title: RHCSA Container and Kernel Labs
created: 2026-09-09
tags:
  - rhcsa
  - rhel
  - podman
  - containers
  - kernel
  - labs
publish: true
garden: true
description: The two RHCSA objective areas older study plans skip - rootless podman containers with persistent storage and systemd auto-start, and tuned, grubby and boot target management.
---

# RHCSA Container and Kernel Labs

Two areas that current RHCSA objectives include and that plans written a few
years ago routinely omit entirely. If you prepared from older material, this is
your gap.

Week 4 of [[RHCSA to RHCE - A 60-Day Lab Curriculum]]. Checkers:
`./verify 4.1` (as your ordinary user) and `sudo ./verify 4.2`
([the harness](https://github.com/Push1697/published_quartz_blog/tree/v4/rhce-labs)).

---

## Lab 4.1 — Containers with podman (90 min)

Managing containers is a current RHCSA objective: finding and retrieving images,
running them, attaching persistent storage, and starting them automatically via
systemd. This is the most commonly missed section on the exam.

**Requirement.** As a **non-root** user:

1. Find and pull a web server image from a registry.
2. Inspect the image and report which ports it exposes.
3. Run it rootless, published on host port 8080.
4. Attach persistent storage: host directory `/opt/webdata` mounted into the
   container's document root, with SELinux labelling handled correctly.
5. Serve a file placed in `/opt/webdata` from the host, verified with curl.
6. Generate a systemd unit so the container starts automatically **at boot as
   that non-root user**, without anyone logging in.
7. Set an environment variable inside the container at run time.

**Acceptance criteria**

- [ ] Container runs rootless — `podman ps` as the user, not root
- [ ] `curl localhost:8080` returns the file from `/opt/webdata`
- [ ] The container restarts automatically after a **full reboot**, with nobody
      logged in
- [ ] Storage persists across `podman rm` and recreation

**Verify**

```bash
podman images; podman ps
podman inspect <image> | grep -i exposedports
curl localhost:8080
systemctl --user is-enabled <unit>
loginctl show-user "$USER" | grep Linger      # must be yes
sudo reboot
# after the reboot, WITHOUT logging in as that user, from another session:
curl localhost:8080
```

> **The two traps in this lab.**
>
> **Lingering.** A `--user` unit does not start at boot unless
> `loginctl enable-linger <user>` is set. Without it your container only starts
> when the user logs in — which a grader will not do.
>
> **SELinux on the volume.** Mount with `:Z` (or set the container file context),
> or the container gets permission denied on a directory that looks perfectly
> readable from the host.

> [!tip]- Hint
> `podman search`, `podman pull`,
> `podman run -d -p 8080:8080 -v /opt/webdata:/var/www/html:Z`, then
> `podman generate systemd --new --files --name`, or a Quadlet `.container` file in
> `~/.config/containers/systemd/` on newer RHEL. Then
> `systemctl --user daemon-reload && systemctl --user enable --now`.

The checker for this one insists on the parts people fake: it confirms the
container is genuinely rootless, that `/opt/webdata` carries `container_file_t`,
that lingering is on, and that the running container was started **on the current
boot** rather than by your last manual `podman start`.

---

## Lab 4.2 — tuned, kernel and boot targets (60 min)

**Requirement**

1. Report the currently active tuned profile and switch to one appropriate for a
   virtual guest, persistently.
2. Let tuned recommend a profile, and explain why it chose that one.
3. List installed kernels and boot into a **specific, non-default** kernel once,
   without making it permanent.
4. Set a different kernel as the permanent default.
5. Add a kernel command-line parameter persistently.
6. Boot into `rescue.target` deliberately, and return to multi-user.

**Acceptance criteria**

- [ ] `tuned-adm active` shows the chosen profile after a reboot
- [ ] You booted a non-default kernel exactly once, and it reverted
- [ ] The kernel parameter appears in `/proc/cmdline` after a reboot
- [ ] Default target restored and verified

**Verify**

```bash
tuned-adm active; tuned-adm recommend
grubby --info=ALL | grep -E '^(kernel|index)'
grubby --default-kernel
cat /proc/cmdline
systemctl get-default
```

> [!tip]- Hint
> `tuned-adm profile virtual-guest`, `grubby --set-default`,
> `grubby --update-kernel=ALL --args="..."`, and `grub2-reboot <index>` for a
> one-time boot.

Requirement 5 has no fixed value, so tell the checker which parameter you added:
`sudo ./verify 4.2 --karg=quiet_loglevel=3`. Without it, the script prints the
running command line and the persisted boot-loader arguments and asks you to
confirm your parameter appears in both — which is the actual test, since one
without the other is the classic half-answer.

---

## The objective self-audit

Go through the **current published RHCSA objectives** on Red Hat's site and score
yourself honestly on each line: *confident / shaky / cannot do*. Do it against
the live objectives page, not against any study plan — objectives shift between
RHEL versions.

| Objective area | Confident | Shaky | Can't | Lab to redo |
| --- | --- | --- | --- | --- |
| Essential tools (shell, redirection, grep, archives, ssh) |  |  |  | Labs 1.1, 1.5 |
| Shell scripts (conditionals, loops, exit codes) |  |  |  | Lab 1.6 |
| Operate running systems (boot, targets, processes, logs, services) |  |  |  | Labs 2.1, 2.2, 4.2 |
| Local storage (partitions, LVM, swap) |  |  |  | Labs 2.5, 2.6 |
| File systems (xfs/ext4, NFS, autofs, ACLs, SGID) |  |  |  | Labs 1.3, 2.7 |
| Deploy/configure/maintain (dnf, cron/timers, network, kernel) |  |  |  | Labs 2.3, 2.4, 4.2 |
| Users and groups |  |  |  | Lab 1.2 |
| Security (firewall, key SSH, SELinux, ACLs) |  |  |  | Labs 1.4, 3.1–3.3 |
| **Containers (podman, rootless, systemd, storage)** |  |  |  | **Lab 4.1** |

Anything marked *shaky* or *can't* gets redone before you sit a mock. No
exceptions — a mock exam taken over known gaps measures nothing.

Labs 1.x and 2.x: [[RHCSA Foundation Labs - Users Permissions and Storage]].
Labs 3.x: [[RHCSA Security Labs - SELinux firewalld and Boot Recovery]].

## The gate

Everything below must be true before Ansible begins.

- [ ] Blank RHEL VM + written requirement → I build it without searching
- [ ] Containers: rootless, persistent storage, systemd auto-start — from memory
- [ ] Every fault in `break.sh list` fixed in under 10 minutes
- [ ] `findmnt --verify` before every reboot is automatic

→ Next: [[Two RHCSA Mock Exam Papers]], then
[[Ansible Fundamentals Labs]]
