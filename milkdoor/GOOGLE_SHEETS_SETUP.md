# MILKDOOR Google Sheets Automation Setup

This folder contains the Apps Script backend for the MILKDOOR website.

## One-time setup (Google account needed)
1. Open https://script.google.com and choose **New project**.
2. Replace the starter code with the contents of `Code.gs` from this folder.
3. Save the project as **MILKDOOR Automation**.
4. Select `setup` and click **Run**. Approve the Google permissions. This creates a spreadsheet named **MILKDOOR Business Records** with Orders, Customers, Deliveries and Payments tabs.
5. In **Project Settings → Script Properties**, add:
   - Property: `ADMIN_KEY`
   - Value: create a long private password (do not share it in public or commit it to GitHub).
6. Click **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy and copy the Web app URL.

## Important security notes
- The public website is allowed to submit new order requests only.
- Reading customer/order data and admin writes require your private ADMIN_KEY.
- Never paste ADMIN_KEY into website source code or a public GitHub file.
- Anyone with the public web-app URL may submit an order request; review the Orders tab for spam.
- The current public website and local admin page are not connected until the Web app URL is configured and the admin dashboard integration is completed.

## Next step
Send the Web app URL here (not your ADMIN_KEY). I can then wire the public order form and cloud admin dashboard to the endpoint. Keep the ADMIN_KEY private; enter it only in the admin dashboard when prompted.
