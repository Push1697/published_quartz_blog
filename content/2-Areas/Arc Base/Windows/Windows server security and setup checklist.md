2025-01-22
## Server Security

### Checklist

- [ ] Create additional administrator privileged user with name sysadmin and server_admin

- [ ] Drive Permission (For all Drives)

- [ ] Change RDP mode to Network Level Authentication

- [ ] AntiVirus Install - If user purchased the License

- [ ] All Windows Updates including optional updates

- [ ] Registry backup in C: drive with name registry.bak

- [ ] Windows Firewall configuration (Rule for all open Ports and Ping)

- [ ] Poodle Vulnerability fix in registry

- [ ] RDP port change to 4489 in registry

- [ ] RDP port 4489 rule in Windows Firewall

- [ ] WIPL IP and other Servers IP restriction for RDP

- [ ] DNS vulnerability fix

- [ ] Start MSSQL Successful Logins

- [ ] Resolve MSSQL Counter jump issue (Identity increment) - (http://stackoverflow.com/questions/14146148/identity-increment-is-jumping-in-sql-server-database)

- [ ] PHP Folder permission - Do not add under handler mapping, Only configure in control panel.

---

[Removing MSSQL Server completely](https://dev.to/pexlkeys/complete-guide-fully-uninstalling-microsoft-sql-server-2019-from-your-system-m4j)
[Removing MySQL Server completely](https://www.hivelocity.net/kb/how-to-uninstall-mysql/#:~:text=First%2C%20you'll%20need%20to,directories%20are%20removed%20as%20well.)
[SSL Poodle Vulnerability windows-server](https://www.valencynetworks.com/articles/how-to-fix-ssl-poodle-vulnerability.html)