# Website forms backend: setup (about 10 minutes)

Every form on pekdigitals.com goes through `forms.js`:

- Free Consultation
- Contact
- Support Ticket
- Newsletter Subscribe
- Affiliate applications

`forms.js` sends each submission to a small Google Apps Script running in **your** Google account. That script does four things:

| What | Where |
|---|---|
| Notification email for every submission (press Reply to answer the client) | **support@bigkeysenterprises.com** |
| Automatic confirmation email to the client | the client's email address |
| Permanent record, one row per submission | Google Sheet: an **All Submissions** tab plus one tab per form |
| Nightly backup copy of the Sheet (the newest 30 are kept) | Google Drive folder: **Pekdigitals Form Backups** |
| Support ticket attachments | Google Drive folder: **Pekdigitals Support Attachments** |

The browser keeps its own backup too. Each submission is saved on the visitor's device until the server confirms it. If sending fails, it is retried automatically the next time they open the site.

**Until you finish the setup below**, the forms still work, but differently: they open the visitor's email app with the message addressed to support@bigkeysenterprises.com. There's no auto-reply and nothing is saved to a Sheet.

## Steps

1. Sign in to the Google account that should own the data, then go to <https://sheets.new>. This creates a blank Sheet.
   - Name it **Pekdigitals Website Submissions**.
2. In the Sheet, open **Extensions → Apps Script**.
3. Delete the sample code in the editor.
   - Paste in the whole of [`google-apps-script.gs`](google-apps-script.gs).
   - Click **Save** 💾.
4. Run the one-time setup:
   1. In the function list at the top, choose **`setup`**, then click **Run**.
   2. Google asks for permission. Click **Review permissions**, pick your account, then **Advanced → Go to project (unsafe) → Allow**.
      - The script needs Sheets, Drive and Gmail sending. "Unsafe" only means Google hasn't reviewed the script, because you wrote it yourself.
   3. When it finishes, support@bigkeysenterprises.com receives an email titled "Pekdigitals website forms are connected".
5. Deploy it as a web app:
   1. Click **Deploy → New deployment**, click the ⚙️ gear icon, and choose **Web app**.
   2. Set **Execute as** to **Me**.
   3. Set **Who has access** to **Anyone**. This is required so website visitors can submit. They can only send data; they can't read the Sheet.
   4. Click **Deploy**, then copy the **Web app URL**. It ends in `/exec`.
6. Connect the website: open `forms.js`, paste the URL between the quotes on this line, then commit:
   ```js
   var ENDPOINT = '';
   ```
   Or just send the URL to Claude to do it for you.

## Good to know

- **Sender address:** auto-replies are sent from the Google account you used in step 1. Their Reply-To is support@bigkeysenterprises.com, so client replies go to the right inbox.
- **Daily email limit:**
  - A free Gmail account can send about **100 emails a day**.
  - Each submission uses 2: the notification and the auto-reply. That's roughly 50 submissions a day.
  - Google Workspace accounts allow 1,500 a day.
- **Changing the script later:** after editing it, use **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. This keeps the same URL.
- **Spam protection:** each form has a hidden field that bots fill in. Those submissions are thrown away. The script also rejects malformed submissions.
- **Duplicates:** duplicate newsletter signups are ignored. Retries from a visitor's device are never saved twice.
