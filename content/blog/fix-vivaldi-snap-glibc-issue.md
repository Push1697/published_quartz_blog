---
section: Troubleshooting

title: "Fix: Vivaldi Snap Startup Issue (GLIBC Mismatch)"
created: 2026-01-27
tags:
  - linux
  - troubleshooting
  - vivaldi
  - snap
  - guide
publish: true
garden: true

description: Vivaldi installed via Snap fails to launch with a GLIBC_2.38 error - why the chromium-ffmpeg snap caused it, and how to revert to a working revision.
---

# Fix: Vivaldi Snap Startup Issue (GLIBC Mismatch)

## Problem
Vivaldi Browser (installed via Snap) failed to launch.
**Error Output:**
```
/snap/vivaldi/323/opt/vivaldi/vivaldi: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.38' not found (required by /snap/vivaldi/323/chromium-ffmpeg/libffmpeg.so)
```

## Cause
The `chromium-ffmpeg` snap, which Vivaldi uses for media codecs, automatically updated to a revision (rev 97) that was built against a newer version of GLIBC (2.38) than what is available on the host system (Ubuntu 24.04 currently has GLIBC 2.39, but the snap environment/linkage was mismatching or the specific snap core base was incompatible). Specifically, the new codec library was incompatible with the Vivaldi snap's expected runtime environment.

## Solution
Reverting the `chromium-ffmpeg` snap to the previous working revision resolved the issue.

### Steps Taken
1.  **Diagnose:** Identified the error by running Vivaldi from the terminal:
    ```bash
    /snap/bin/vivaldi.vivaldi-stable --version
    ```
2.  **Check Versions:** Checked installed revisions of the ffmpeg snap:
    ```bash
    snap list chromium-ffmpeg --all
    ```
3.  **Fix:** Reverted to the previous revision (rev 91):
    ```bash
    snap revert chromium-ffmpeg
    ```
4.  **Verify:** Confirmed Vivaldi launches correctly:
    ```bash
    vivaldi --version
    ```

## Prevention
The `snap revert` command usually holds the snap at the reverted revision, preventing it from automatically updating again immediately. To manually unhold it in the future (once a fix is released):
```bash
snap refresh chromium-ffmpeg
```
