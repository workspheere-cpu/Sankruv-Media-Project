# How it works

A plain guide to the Sankruv Media website and Client Hub: what each part does, how to build and upload it, and how to change things.

## 1. The big picture

```
content/ + react/src/  --(npm run build)-->  react/dist/  --(upload)-->  public_html on Hostinger
react/admin/           --(same build)---->  admin/assets/hubapp.js  (the Client Hub screens)
admin/*.php            --(copied as is)-->  react/dist/admin/        (the Client Hub backend)
```

- The **website** is React, but it is built ahead of time into ordinary HTML files. Visitors and Google get complete pages straight away, then React takes over in the browser for the animations, the films player and the forms. The live server does not run Node.
- The **Client Hub** is a React app that talks to a small PHP backend. The data sits in one SQLite database file on the server. No MySQL setup is needed.

## 2. Build it

You need Node 18 or newer on your computer.

```bash
cd react
npm install
npm run build            # live build, Google may index it
npm run build:preview    # same, but tells Google not to index (for test links)
```

The result is `react/dist/`. That folder is the whole product: website pages, styles, images, sitemap, RSS feed and the `admin/` folder.

## 3. Put it on Hostinger

1. In hPanel open **File Manager** and go to `public_html`.
2. Upload everything that is **inside** `react/dist/` (not the `dist` folder itself).
3. PHP must be version 8.0 or newer (hPanel, PHP Configuration). The SQLite extension (`pdo_sqlite`) is on by default.
4. Turn on the free SSL certificate and force HTTPS.

The domain can stay registered at Wix. In the Wix DNS settings point the `A` record (`@`) to the Hostinger server IP and the `www` CNAME to the domain. Leave the `MX` records alone so email keeps working.

When you upload a newer build later, the database and `admin/config.php` are not part of the build, so they are never overwritten.

## 4. First setup of the Client Hub

1. Copy `admin/config.sample.php` to `admin/config.php` on the server and open it for editing.
2. Set `setup_key` to a long random text (24 characters or more).
3. Open `https://your-domain/admin/setup.php?key=THAT_TEXT` and create the owner account. The link stops working once the owner exists.
4. Sign in at `https://your-domain/admin/`.

Forgot the password: put a long random text in `reset_key`, open `admin/reset.php?key=THAT_TEXT`, choose a new password, then empty `reset_key` again.

### Settings in `admin/config.php`

| Setting | What it does |
| --- | --- |
| `test_mode` | `true` allows short passwords such as `test` and shows a Test mode badge. Set it to `false` before real client data goes in. |
| `data_dir` | Where the database lives. Empty means automatic: a folder beside `public_html` called `sankruv-client-hub-data` (best, it is outside the web folder), otherwise `admin/data`. |
| `mail` | Client emails. Set `enabled` to `true` and fill in the Hostinger mailbox (`smtp.hostinger.com`, port 465, `ssl`). `auto` chooses which emails go out by themselves. |
| `lead_origins` | Other websites allowed to send contact-form enquiries into the hub. |
| `public_url` | The website address used inside emails. |

Never put `config.php` or real passwords in the public GitHub repository.

## 5. Using the Client Hub

Address: `/admin/` (it opens `app.php`).

- **Dashboard**: what needs attention today, this week, collections chart, top clients, lead conversion.
- **Clients**: every client with a profile page (details, projects, payments, reminders, notes, emails).
- **Projects**: a board by stage. **Reminders**: follow-ups with dates. **Payments**: due and received, with CSV export.
- **Emails**: 12 ready templates (thank you, confirmation, payment and more). Preview, then send to a client.
- **Team** (`team.php`): the owner adds logins for staff.
- **Website enquiries** from the contact form arrive as new leads by themselves.
- **Install as an app**: on a phone open `/admin/` in Chrome, menu, Add to Home screen.

How the pieces connect:

| File | Job |
| --- | --- |
| `admin/app.php` | Checks the login and loads the React app |
| `admin/data.php` | Sends data to the screens (read only) |
| `admin/api.php` | Saves changes (add, edit, delete, send email) |
| `admin/lead.php` | Receives the website contact form |
| `admin/_boot.php` | Database, sessions, security rules shared by all of the above |
| `admin/_mail.php`, `admin/emails/` | Email sending and the templates |
| `react/admin/*.jsx` | The screens. After changing them run the build; it refreshes `admin/assets/hubapp.js` |

## 6. Change the website content

All text lives in `content/`. Change a file, run the build, upload `react/dist/` again.

| To change | Edit |
| --- | --- |
| Phone, email, address, social links, home page numbers | `content/site.json` |
| Services and their pages | `content/services.json` |
| Case studies | `content/projects.json` |
| Films | `content/videos.json` |
| Blog | add a `.md` file in `content/blog/` |
| Page layout and wording | `react/src/pages/*.jsx` |
| Colours and styles | `assets/css/site.css`, `react/src/react.css` |

### Films (`content/videos.json`)

Each film is one entry:

```json
{ "title": "Havmor Commercial Ad", "kind": "Commercial ad", "cat": "ads", "src": "drive", "id": "GOOGLE_DRIVE_FILE_ID" }
```

- `src` is `youtube` (use the video id), `drive` (file id), `folder` (Drive folder id, shown as a collection) or `link` (opens another site, used for the Instagram profile because Instagram does not allow its pages inside other websites).
- Add `"vertical": true` for reels and other upright videos.
- Drive files must be shared as **Anyone with the link**, otherwise visitors see a sign-in page.

Every film opens inside the website in the same player: one 16:9 stage sized to fit the screen, with a loading ring until the video is ready. Upright videos sit centred in that same stage, and fill the screen height on a phone.

**Speed tip:** Google Drive is the slow part. It takes a few seconds to prepare a video and there is no way to speed that up from the website. YouTube starts almost at once. For the fastest site, upload the films to YouTube as *Unlisted* and switch each entry to `"src": "youtube"`.

## 7. Security, in short

- Passwords are stored hashed. Repeated wrong tries lock the login for a few minutes.
- Every change needs a signed-in session and a security token (CSRF).
- The database folder is kept outside the web folder when the host allows it, and `.htaccess` blocks direct access to private files.
- The admin is hidden from Google (`noindex`).
- Before going live: `test_mode` off, strong owner password, `setup_key` and `reset_key` emptied.

## 8. Troubleshooting

| Problem | Fix |
| --- | --- |
| Old design still shows after an upload | Hard refresh (Ctrl+Shift+R). On a phone close and reopen the app. |
| A film shows a Google sign-in page | Share that Drive file as Anyone with the link. |
| Emails do not send | Check `mail` in `config.php`; the from address must be a real mailbox on the domain. |
| Admin shows an error | Open `error.log` in the data folder; it records the reason. |
| Regenerate the email templates | `python3 tools/gen_emails.py` |
