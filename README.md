# Nourah WA | Data Analyst

My portfolio, built like a desktop. Projects, notes, a CV request and a contact form.

## Where to edit

| What | File |
| --- | --- |
| Name, bio, email, skills | `site/content/settings.js` |
| Project pages | `site/content/projects.js` and the images in `site/projects/` |
| Pinned visitor notes | `pinned.json` (drawings go in `pinned/`) |
| Visitor counter and the FormSubmit code | `config.js` |

New public repositories show up in the Projects folder by themselves:
`.github/workflows/update-repos.yml` runs `automation/update_repos.py` every six hours
and updates `repos.json`.

## The live notes board

Visitors can leave a note or a drawing. It waits until you approve it, then it shows on the board.
Visitors cannot edit, delete or approve anything.

One time setup:

1. Make a free project on supabase.com.
2. Open SQL Editor, paste `supabase/setup.sql` and press Run.
3. In Project Settings > API copy the Project URL and the public key (anon or publishable)
   into `config.js`. Never use the secret or service_role key.

To approve a note: Table Editor > notes > tick `approved`. To remove one, delete the row.

## Pinning a note by hand

You can also add notes to `pinned.json`:

```json
[
  { "name": "Sara", "text": "Lovely work!", "at": 1767225600000 },
  { "name": "Omar", "img": "pinned/omar.png", "at": 1767225600000 }
]
```

`at` is the date in milliseconds. A drawing is saved as a PNG in `pinned/`.
