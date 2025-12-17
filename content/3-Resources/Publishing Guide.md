# 🚀 Publishing Guide

This vault is connected to a **Quartz** site generator. This guide explains how to prepare and publish your notes.

## 1. Preparation

Before publishing, ensure the note is ready for the public.

- [ ] **Frontmatter**: Add `publish: true`.
- [ ] **Title**: Ensure the filename is clean and descriptive.
- [ ] **Content**:
  - Remove sensitive info (passwords, server IPs, personal names).
  - Remove rough notes or unstructured transcripts.
  - Ensure images are in the `attachments` folder (or standard location).
- [ ] **Links**: Verify that linked notes are also published (or they will be dead links).

### Standard Header

```markdown
---
title: Your Title Here
created: 2025-12-17
tags: [topic]
publish: true
---
```

## 2. Publishing Process

### Option A: Via Terminal (Fastest)

1. Open your terminal in the Quartz directory (sibling to this vault).
2. Run the deploy script:

   ```powershell
   .\deploy.ps1 "Added new post about AI"
   ```

### Option B: Via VS Code / Git

1. Open the Quartz folder in VS Code.
2. Stage changes (`git add .`).
3. Commit (`git commit -m "update"`).
4. Push (`git push`).

## 3. Recommended First Post

I analyzed your vault and found **"Lead Generation Automation with n8n"** as a strong candidate.

- **Source**: `1-projects/AI-Automation/lead generation prompt.md`
- **Action**: I have created a clean draft for you in `0-inbox/Draft - Lead Gen Automation.md` (passwords and transcripts removed).

## 4. Troubleshooting

- **Images not showing?**: Ensure they are in a folder Quartz can see (usually linked properly).
- **Changes not live?**: GitHub Pages takes 1-2 minutes to build.
