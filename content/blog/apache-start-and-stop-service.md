---
section: Runbooks
title: How to Start and Stop Apache
created: 2026-08-11
tags:
  - linux
  - apache
  - cpanel
  - sysadmin
publish: true
garden: true
description: Quick reference for starting, stopping, and restarting Apache (httpd) on standard Linux and cPanel servers.
---

## Standard init scripts

On most Linux servers, the start/stop scripts live in `/etc/init.d` (or `/etc/rc.d/init.d` on older systems):

```bash
# Stop Apache
/etc/init.d/httpd stop

# Start Apache
/etc/init.d/httpd start
```

## On cPanel/WHM servers

cPanel wraps service restarts through its own script, which handles cPanel-specific hooks that a plain `service` command would skip:

```bash
/scripts/restartsrv httpd
```

If an `/admin` folder exists on the box, Apache can also be restarted via:

```bash
/admin/res httpd
```

## Modern systemd equivalent

Most current distros (AlmaLinux, RHEL 8+, Ubuntu 16.04+) use `systemctl` instead of the old init scripts:

```bash
systemctl stop httpd
systemctl start httpd
systemctl restart httpd
systemctl status httpd
```

Use `/scripts/restartsrv httpd` on cPanel boxes specifically — it re-checks config sanity and updates cPanel's service-tracking state, which a raw `systemctl restart` does not do.
