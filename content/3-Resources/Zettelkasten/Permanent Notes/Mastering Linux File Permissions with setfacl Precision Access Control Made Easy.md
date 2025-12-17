---
created: 2025-02-07 06:57
tags:
  - zet
  - linux
  - linux-acls
---
#### Friday, February 07, 2025
---
## 🔐 Why ACLs Matter
Traditional Linux permissions (user/group/others) are robust but lack granularity. Access Control Lists (ACLs) unlock advanced control by letting you define permissions for specific users or groups on individual files/directories. Whether you’re managing shared projects, restricting sensitive data, or automating workflows, `setfacl` is your Swiss Army knife for permissions.

---
## Core Syntax
```bash
setfacl [options] <action>:<entity>:<permissions> <target>
```

### Key Options:
- `-m` → Modify ACL (add/update permissions).
- `-x` → Remove specific ACL entry.
- `-b` → Wipe all ACL entries.
- `-d` → Set default ACLs (for future files/directories).
- `-R` → Apply recursively (use with caution!).

---

## Everyday Use Cases

### Grant a User Read/Write Access to a File:
```bash
setfacl -m u:john:rw project-plan.txt
```
John can now read and edit the file, but others can’t.

### Allow a Group to Execute Scripts in a Directory:
```bash
setfacl -m g:dev_team:x /opt/scripts/
```
Members of `dev_team` can run scripts here but not modify or delete them.

### Auto-Apply Permissions to New Files:
```bash
setfacl -d -m u:alice:rwx /shared/reports/
```
New files/directories in `reports` inherit `rwx` for Alice.

---

## Advanced Scenario: Restricting Script Access

### Goal:
User `x` can execute (but not read/modify) `.sh` scripts in `/secret-project`.

#### Step 1: Understand the Caveat
For shell scripts, execute (`--x`) alone isn’t enough—the interpreter (e.g., `bash`) must read the file.

#### Workaround:
Use binaries (compiled code) for true execute-only access. For scripts, balance security with practicality.

#### Step 2: Lock Down Permissions
```bash
# Grant execute (requires read for scripts; see note below!)
find /secret-project -type f -name "*.sh" -exec setfacl -m u:x:r-x {} \;
```
`r-x` → Read and execute (mandatory for scripts).

User `x` can run scripts but can’t edit them.

### Verify:
```bash
getfacl /secret-project/deploy.sh
```
**Output snippet:**
```
user:x:r-x
```

#### Step 3: Prevent Modification
Revoke write access for everyone else:
```bash
chmod -R o-w /secret-project   # Traditional permissions still matter!
```

---

## Best Practices

### Audit First:
Use `getfacl <file>` to review existing rules.

### Layer Permissions:
Combine ACLs with traditional `chmod/chown` for simplicity.

### Test Relentlessly:
After setting ACLs, impersonate users (`sudo -u x`) to validate access.

### Default ACLs Wisely:
```bash
setfacl -d -m g:auditors:r-x /audit-logs/  # Future files inherit permissions
```

### Avoid ACL Sprawl:
Too many entries become unmanageable. Use groups where possible!

---

## Pro Tips

### Mask Magic:
The mask defines the maximum allowed permissions. Adjust it to override conflicts:
```bash
setfacl -m m::r-x file.sh  # No one gets write, even if granted!
```

### Backup ACLs:
Export rules for critical files to avoid losing them:
```bash
getfacl -R /critical-data > acl_backup.txt
```

---

## Final Word
`setfacl` bridges the gap between simplicity and precision in Linux permissions. By mastering it, you ensure the right people have the right access—no more, no less. Use it to secure collaborative environments, automate permission inheritance, and tackle edge cases where traditional models fall short.

---

### 🚀 Your Turn:
Try setting up an execute-only ACL for a binary file (not a script!), and see how it behaves differently!