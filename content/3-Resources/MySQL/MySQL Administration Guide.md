---
title: MySQL Administration Guide
created: 2026-08-13
tags:
  - mysql
  - database
  - linux
  - sysadmin
publish: true
garden: true
description: A practical reference for installing, administering, and troubleshooting MySQL - covering setup, everyday commands, users and permissions, backups, and common gotchas.
source: https://www.fredshack.com/docs/mysql.html
---

# MySQL Administration Guide

A working reference for day-to-day MySQL administration: getting a server running, the commands you reach for constantly, managing users and permissions, and backing up (and restoring) data without losing sleep. `USER`, `DB`, and `PASSWORD` are placeholders throughout.

## Installing MySQL

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install mysql-server mysql-client

# Enable and start the service
sudo systemctl enable mysql
sudo systemctl start mysql

# Run the interactive security script (removes test DBs,
# disables remote root login, sets root password policy)
sudo mysql_secure_installation
```

### RHEL/CentOS/Rocky

```bash
sudo dnf install mysql-server
sudo systemctl enable --now mysqld

# Grab the temporary root password generated on first start
sudo grep 'temporary password' /var/log/mysqld.log
```

### From source (when you need a specific version or build flags)

```bash
# Create a dedicated system user - never run mysqld as root
sudo useradd -r -s /bin/false mysql

# Initialize the data directory
sudo mysqld --initialize --user=mysql --datadir=/var/lib/mysql

# Point the server at a config file and start it
mysqld --defaults-file=/etc/my.cnf &
```

## Connecting and basic navigation

```bash
mysql -u USER -p
mysql -u USER -p -h HOST -P PORT DB
```

```sql
SHOW DATABASES;
USE DB;
SHOW TABLES;
DESCRIBE TABLE_NAME;
SHOW CREATE TABLE TABLE_NAME;
```

`mysqlshow` is the command-line equivalent for a quick look without dropping into an interactive session:

```bash
mysqlshow -u USER -p
mysqlshow -u USER -p DB
mysqlshow -u USER -p DB TABLE_NAME
```

## Databases and tables

```sql
CREATE DATABASE DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP DATABASE DB;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;
ALTER TABLE users MODIFY COLUMN email VARCHAR(320) NOT NULL;
ALTER TABLE users ADD INDEX idx_created_at (created_at);
ALTER TABLE users DROP COLUMN last_login;
```

## Data manipulation

```sql
INSERT INTO users (email) VALUES ('a@example.com'), ('b@example.com');

UPDATE users SET email = 'new@example.com' WHERE id = 1;

DELETE FROM users WHERE id = 1;

-- Bulk-load from a CSV/TSV file
LOAD DATA LOCAL INFILE '/path/to/data.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;
```

`LOAD DATA LOCAL INFILE` requires `local_infile=1` on both the server and client side (`mysql --local-infile=1 ...`), and it's disabled by default on managed hosting for good reason - it lets a client push arbitrary files into a table. Only enable it where you control both ends of the connection.

## Users and permissions

```sql
CREATE USER 'USER'@'localhost' IDENTIFIED BY 'PASSWORD';
CREATE USER 'USER'@'%' IDENTIFIED BY 'PASSWORD'; -- allow remote connections

GRANT ALL PRIVILEGES ON DB.* TO 'USER'@'localhost';
GRANT SELECT, INSERT, UPDATE ON DB.* TO 'USER'@'%';
FLUSH PRIVILEGES;

SHOW GRANTS FOR 'USER'@'localhost';
REVOKE INSERT ON DB.* FROM 'USER'@'localhost';

ALTER USER 'USER'@'localhost' IDENTIFIED BY 'NEW_PASSWORD';
DROP USER 'USER'@'localhost';
```

Prefer scoping grants to a specific database and host rather than `'USER'@'%'` with `ALL PRIVILEGES` - the wildcard host plus blanket privileges is the single most common MySQL misconfiguration that turns into an incident.

## Backup and restore

```bash
# Single database
mysqldump -u USER -p DB > db_backup.sql

# All databases, including routines/triggers/events
mysqldump -u USER -p --all-databases --routines --triggers --events > full_backup.sql

# Structure only, no data - useful for schema diffs
mysqldump -u USER -p --no-data DB > schema_only.sql

# Restore
mysql -u USER -p DB < db_backup.sql
```

For large tables, `mysqldump` locks tables by default (or uses `--single-transaction` for InnoDB to get a consistent snapshot without locking). Always pass `--single-transaction` when backing up a live InnoDB database:

```bash
mysqldump -u USER -p --single-transaction DB > db_backup.sql
```

## Repair and maintenance

```bash
# Check and repair a table (MyISAM primarily; InnoDB self-heals differently)
CHECK TABLE TABLE_NAME;
REPAIR TABLE TABLE_NAME;
OPTIMIZE TABLE TABLE_NAME;

# From the shell, when the server won't start due to a corrupt table
mysqlcheck -u USER -p --auto-repair --all-databases
```

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `ERROR 2002 (HY000): Can't connect through socket` | MySQL isn't running, or the socket path in `my.cnf` doesn't match where the client is looking. |
| `ERROR 1045: Access denied for user` | Wrong password, or the user/host combination doesn't exist - remember `'USER'@'localhost'` and `'USER'@'127.0.0.1'` are different grants. |
| `ERROR 1698: Access denied... using auth_socket` | Fresh Ubuntu installs default root to `auth_socket` (OS-level auth, no password). Use `sudo mysql` instead of `mysql -u root -p`, or switch the auth plugin. |
| Server won't start after a crash | Check `/var/log/mysql/error.log` first; InnoDB usually recovers automatically on restart from its redo logs. |
| Import from CSV silently drops rows | Check `FIELDS`/`LINES` delimiters match the file exactly, and that `local_infile` is enabled if using `LOAD DATA LOCAL`. |

## Useful tools

- **HeidiSQL** / **MySQL Workbench** - GUI clients for browsing schemas and running queries without the CLI.
- **phpMyAdmin** - web-based administration, common on shared hosting.
- **Percona Toolkit** - production-grade tools for online schema changes, replication checks, and slow query analysis.

## Source

- [MySQL Documentation Notes | fredshack.com](https://www.fredshack.com/docs/mysql.html)
