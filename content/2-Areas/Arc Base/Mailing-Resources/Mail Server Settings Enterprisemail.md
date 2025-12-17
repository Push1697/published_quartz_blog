---
created: 2025-02-05 15:00
tags:
  - zet
  - mails
---
#### Wednesday, February 05, 2025
---
### **Incoming & Outgoing Mail Server Settings**

#### **IMAP (Recommended)**

- **Incoming Mail Server (IMAP)**:
    - Server: enterprisemail.in
    - Port: `993`
    - Encryption: `SSL/TLS`
- **Outgoing Mail Server (SMTP)**:`
	- Server: enterprisemail.in
	- Port: `465`
	- Encryption: `SSL      `
           
- ### **Configure Advanced Settings**
    
    - Click **More Settings** (bottom right corner).
    - Go to the **Outgoing Server** tab:
        - Check **My outgoing server (SMTP), which requires authentication**.
        - Select **Use the same settings as my incoming mail server**.
    - Go to the **Advanced** tab:
        - For **IMAP**:
            - Incoming server: **993** (SSL/TLS)
            - Outgoing server (SMTP): **587** (STARTTLS)