---
section: Reference
title: cPanel and WHM Log File Locations
created: 2026-08-13
tags:
  - whm-cpanel
  - cpanel
  - whm
  - linux
  - sysadmin
publish: true
garden: true
description: Quick reference for important cPanel and WHM log file locations.
source: https://docs.cpanel.net/knowledge-base/cpanel-product/the-cpanel-log-files/
---

# cPanel and WHM Log File Locations

Use this reference when troubleshooting cPanel accounts, WHM administration, service failures, logins, backups, and web hosting issues. `USER` represents the cPanel account username.

## cPanel and WHM access

| Location | Purpose |
| --- | --- |
| `/usr/local/cpanel/logs/access_log` | cPanel and WHM access requests. |
| `/usr/local/cpanel/logs/login_log` | cPanel and WHM login attempts. |
| `/usr/local/cpanel/logs/session_log` | Activity during authenticated cPanel and WHM sessions. |
| `/usr/local/cpanel/logs/error_log` | General cPanel and WHM errors. |
| `/usr/local/cpanel/logs/panic_log` | Severe cPanel errors. This should normally be empty. |
| `/usr/local/cpanel/logs/api_log` | API 1, successful API 2, and successful UAPI calls; requires API logging to be enabled. |
| `/usr/local/cpanel/logs/api_tokens_log` | WHM API token activity. |
| `/usr/local/cpanel/logs/incoming_http_requests.log` | Incoming requests to the cPanel server. |

## Account and service logs

| Location | Purpose |
| --- | --- |
| `/home/USER/.cpanel/logs` | Errors in the cPanel account task queue. |
| `/usr/local/cpanel/logs/cpdavd_error_log` | Web Disk errors. |
| `/usr/local/cpanel/logs/cpdavd_session_log` | Web Disk activity. |
| `/usr/local/cpanel/logs/cphulkd.log` | cPHulk brute-force protection activity. |
| `/usr/local/cpanel/logs/cphulkd_errors.log` | cPHulk errors. |
| `/usr/local/cpanel/logs/cpgreylistd.log` | Greylisting daemon activity. |
| `/var/log/chkservd.log` | cPanel service-monitoring results. |
| `/usr/local/cpanel/logs/tailwatchd_log` | TailWatch service logs. |
| `/usr/local/cpanel/logs/safeapacherestart_log` | Apache restart history. |

## PHP and PHP-FPM

| Location | Purpose |
| --- | --- |
| `/usr/local/cpanel/logs/php-fpm/error.log` | PHP-FPM errors for cPanel services, including `cpsrvd` and `cpdavd`. |
| `/var/cpanel/php-fpm/USER/logs/error.log` | PHP-FPM errors for a cPanel user. |
| `/var/cpanel/php-fpm/USER/logs/slow.log` | Slow PHP scripts for a cPanel user. |
| `/home/USER/logs/.php.error.log` | Internal cPanel PHP-FPM errors, such as Roundcube errors; not customer-site errors. |

## Backups, updates, and account changes

| Location | Purpose |
| --- | --- |
| `/usr/local/cpanel/logs/cpbackup/` | cPanel backup logs. |
| `/usr/local/cpanel/logs/cpbackup_transporter/` | Backup Transporter logs. |
| `/var/cpanel/updatelogs/` | System update logs. |
| `/var/cpanel/logs/` | Account-transfer and other miscellaneous logs. |
| `/var/cpanel/transfer_sessions/` | Transfer and restore session logs. |
| `/var/cpanel/accounting.log` | Account lifecycle and ownership actions, including create, suspend, delete, and reseller changes. |
| `/usr/local/cpanel/logs/license_log` | cPanel license update activity and errors. |
| `/var/log/cpanel-install.log` | cPanel and WHM installation log. |

## System and web logs

| Location | Purpose |
| --- | --- |
| `/var/log/messages` | General service messages on Red Hat-based systems, including FTP, DNS, and SSH activity. |
| `/var/log/syslog` | Ubuntu equivalent of `/var/log/messages`. |
| `/var/log/secure` | SSH login attempts on Red Hat-based systems. |
| `/var/cpanel/bandwidth/USER/` | Per-account bandwidth usage logs. |
| `/usr/local/cpanel/logs/stats_log` | Bandwidth-statistics processing for cPanel accounts. |

## Useful commands

```bash
# Follow cPanel/WHM errors in real time
tail -f /usr/local/cpanel/logs/error_log

# Review failed cPanel and WHM login attempts
grep 'FAILED LOGIN' /usr/local/cpanel/logs/login_log

# Follow a specific account's PHP-FPM errors
tail -f /var/cpanel/php-fpm/USER/logs/error.log
```

## Source

- [The cPanel & WHM Log Files | cPanel & WHM Documentation](https://docs.cpanel.net/knowledge-base/cpanel-product/the-cpanel-log-files/)

Log paths can differ when server configuration has been customized. Confirm the active configuration before relying on a path during incident response.
