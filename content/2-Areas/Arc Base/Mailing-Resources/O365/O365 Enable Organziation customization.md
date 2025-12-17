2025-01-19

### Connect to Exchange Online via PowerShell, use admin credentials: 
[[https://learn.microsoft.com/en-us/powershell/exchange/exchange-online-powershell-v2?view=exchange-ps]]

#### Steps to connect to Exchange online using the PowerShell

1. The first steps is to download the Exchange online module and install it. You can use the below URL to do the same. 
	- https://learn.microsoft.com/en-us/powershell/exchange/exchange-online-powershell-v2?view=exchange-ps#install-and-maintain-the-exchange-online-powershell-module
##### Install cmdlet in PowerShell to install the Exchange online Module
```
Install-Module -Name ExchangeOnlineManagement
```

2. Connect to Exchange Online PowerShell with an interactive login prompt
The following examples work in Windows PowerShell 5.1 and PowerShell 7 for accounts with or without MFA:

This example connects to Exchange Online PowerShell in a Microsoft 365 or Microsoft 365 GCC organization:

```
Connect-ExchangeOnline -UserPrincipalName abc@contoso.onmicrosoft.com
```
Once connected using the above command , run the following:

```
Enable-OrganizationCustomization
```