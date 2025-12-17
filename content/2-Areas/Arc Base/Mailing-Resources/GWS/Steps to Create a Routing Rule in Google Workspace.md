---
created: 2025-02-05 13:33
tags:
  - zet
  - GWS
---
#### Wednesday, February 05, 2025
---
## Log in to Google Admin Console:
---
- Go to [admin.google.com](https://admin.google.com).
- Sign in using your Administrator account.
## Navigate to Gmail Settings:
---
- In the Admin Console, click on **Apps**.
- Then, select **Google Workspace** and click on **Gmail**.
## Set Up Routing:
---
- In the Gmail settings page, scroll down and click on **Routing** (As attached in Image).
## Create a New Routing Rule:
---
- Scroll down to the **Routing** section and click on **Add Another Rule**.
- Give the rule a descriptive name (e.g., "Project Forward emails from projects@ to 5 recipients").
## Set Conditions for the Rule:
---
In the **Messages to affect** section:
### For Incoming mail:

- Check Mark on **Inbound and Internal – receiving**.
### For Outgoing Email:

- Check Mark on **Outbound and Internal – sending**.
---
Under the **For the types of messages above, do the following** section:

- Go to **Also deliver to** and check mark on **Add more recipients** (As attached Image no. 2).
- In the field that appears, enter the email addresses of the 5 recipients who should receive a copy of the email received on **Project@deevyashakti.com**. For example, enter email addresses like:
  - recipient1@example.com
  - recipient2@example.com
  - recipient3@example.com
  - recipient4@example.com
  - recipient5@example.com
## Configure the user:
---
- Now click on **Show More options**.
- After showing more options, go to section **c [Envelope filter]**.
### For Incoming mails:
  > Check mark on **Only affect specific envelope recipients** and enter the user - **project** or on which you are applying this rule (as shown in the image routing-5).
### For Outgoing mails:
  >Check mark on **Only affect specific envelope senders** and enter the user - **project** or on which you are applying this rule (as shown in the image routing-6).

#### After configuring the routing, click **Save**.

  ## Verify the Rule:
 > After saving the rule, test by sending and receiving an email to **projects@deevyashakti.com** to confirm that all five email addresses receive a copy.
