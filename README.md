# Nourah WA | Data Analyst

My portfolio, built like a desktop. Projects, notes, a CV request and a contact form.

## Where to edit

| What | File |
| --- | --- |
| Role, bio, skills, tools | `profile.js` |
| Name and email | `site/content/settings.js` |
| My Notebook | the `notes` folder (one `.md` file per note) |
| Project pages | `site/content/projects.js` and the images in `site/projects/` |
| Pinned visitor notes | `pinned.json` (drawings go in `pinned/`) |
| Visitor counter and the FormSubmit code | `config.js` |

New public repositories show up on the main page by themselves, after the projects in
`site/content/projects.js`: `.github/workflows/update-repos.yml` runs `automation/update_repos.py`
every six hours and updates `repos.json`.

- The first picture in the README becomes the project picture, and the repository description becomes its text.
- Add a topic to the repository to pick its filter: `design`, `app` or `business-analysis`. Without one it goes under Data analysis.
- To keep a repository off the site, add its name to `SKIP` in `automation/update_repos.py`.
- To give a project the full case study page, add it to `site/content/projects.js` with the same GitHub link.

## Writing in the Notebook

Add a file to the `notes` folder, for example `notes/why_clean_data.md`:

```
---
title: Why I clean data first
date: 2026-11-12
pinned: true
---
The first paragraph shows in the list.

**Bold**, *italic*, lists with `-`, quotes with `>` and links work.
```

`pinned: true` keeps a note at the top. Leave it out for a normal note.

## The live notes board

Visitors can leave a note or a drawing. It waits until you approve it, then it shows on the board.
Visitors cannot edit, delete or approve anything.

One time setup:

1. Make a free project on supabase.com.
2. Open SQL Editor, paste `supabase/setup.sql` and press Run.
3. Run `supabase/inbox.sql` and `supabase/place.sql` the same way.
4. In Project Settings > API copy the Project URL and the public key (anon or publishable)
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
