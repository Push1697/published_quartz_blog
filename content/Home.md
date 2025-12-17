---
cssclasses: dashboard
tags: [dashboard]
---
# 🧠 Home Branch

## 📥 Inbox (<% tp.user.inbox_count() %>)

```dataview
TABLE file.ctime as Created
FROM "0-inbox" OR "00-Inbox"
SORT file.ctime DESC
LIMIT 5
```

## 🚀 Active Projects

```dataview
LIST FROM "1-projects"
WHERE file.name != "1-Projects"
SORT file.mtime DESC
LIMIT 5
```

## 🌳 Areas of Focus

- [[2-areas/personal-branding|Personal Branding]]
- [[2-areas/2025-goals|2025 Goals]]

## ⚡ Quick Actions

- [[Templates/New Zettel|New Zettel]]
- [[Templates/Daily|Daily Note]]

---
> *Simplicity is the ultimate sophistication.*
