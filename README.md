# FranPOS Auxiliary Digital Asset Management (DAM)

This repository is the **Digital Asset Management (DAM)** store for auxiliary media leveraged by the FranPOS POS, Kiosk, and other merchant and consumer-facing devices.

---

## Getting Access

### Browsing the DAM

All assets are browsable at the GitHub Pages site. Navigate by asset type using the links in the [What Goes Where](#what-goes-where) section below.

> Index pages are auto-generated — do not edit `index.html` or `index.json` files by hand. Changes will be overwritten on the next push.

### Setting Up a GitHub Personal Access Token (PAT)

A PAT is required to upload, delete, or trigger index regeneration from the browser UI. You'll need to create one once:

1. Go to **GitHub → Settings → Developer Settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name (e.g. `DAM Management`) and set an expiration
4. Under **Scopes**, tick:
   - **`repo`** — full repository read/write access
   - **`workflow`** — allows triggering GitHub Actions workflows
5. Click **Generate token** and copy it — it won't be shown again

To use it: open any DAM index page, paste the token into the **Connect** bar at the top of the page, and click **Connect**. Your session stays connected until you close the browser tab or click Disconnect. The token is stored only in your browser's session memory and is never sent anywhere except the GitHub API.

---

## Browsing & Managing Assets

Each media folder contains an `index.html` that lists every asset with a preview thumbnail and its direct URL, served via **GitHub Pages**. Navigate by following breadcrumb links from any index page back to the root.

### In-Page Management UI

Every index page includes a built-in management bar — no git client required. Connect with your PAT first (see [Getting Access](#getting-access)).

**Supported actions:**

- **Upload Files** — select files via the button or drag and drop them onto the drop zone. Files are **staged** first (nothing is uploaded yet); the drop zone confirms what's queued and the button label updates to **Upload N files**. Fill in any subfolder before clicking to confirm.
  - On **asset pages** (e.g. `kiosk-carousel/live/global/`), files are added directly to the current folder.
  - On **directory pages** (e.g. `kiosk-carousel/live/`), an optional **Subfolder** field lets you type a CID (e.g. `206100`) to upload files directly into a new or existing CID folder — no need to create the folder separately first.
  - Click **✕ clear** in the drop zone to de-stage files without uploading.
- **Delete File** — removes an individual asset; a confirmation prompt is shown before anything is deleted.
- **Delete Folder** — removes an entire CID folder and all its contents in one step; available on directory pages next to each deletable folder row.
- **Regenerate Indexes** — manually triggers an index rebuild without changing any files; useful if indexes ever appear stale.

After any upload or delete, indexes are automatically regenerated and the page reloads once the pipeline completes (typically under 60 seconds).

**Protected folders** — the following folders are structural and cannot be deleted through the UI:

| Folder | Why protected |
|--------|--------------|
| `kiosk-carousel/live/` | Required for production kiosk resolution |
| `kiosk-carousel/staging/` | Required for dev/staging kiosk resolution |
| `kiosk-carousel/live/global/` | Default fallback for all live kiosks |
| `kiosk-carousel/staging/global/` | Default fallback for all staging kiosks |

CID-specific folders (e.g. `kiosk-carousel/live/206100/`) can be freely created and deleted.

---

## What Goes Where

### Folder Reference

| Folder | Browse | What belongs here | Accepted formats |
|--------|--------|-------------------|-----------------|
| `kiosk-carousel/` | [View](https://gerry-wood-sumup.github.io/franpos_auxiliary_dam/kiosk-carousel/) | Promotional images for the kiosk carousel/attract loop | `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` |
| `images/` | [View](https://gerry-wood-sumup.github.io/franpos_auxiliary_dam/images/) | Static modifier/menu images for POS and Kiosk surfaces | `.png` `.jpg` `.webp` |
| `documents/` | [View](https://gerry-wood-sumup.github.io/franpos_auxiliary_dam/documents/) | Menus, nutrition guides, training materials, compliance forms | `.pdf` `.docx` |
| `sounds/` | [View](https://gerry-wood-sumup.github.io/franpos_auxiliary_dam/sounds/) | Alerts, confirmations, ambient audio for Kiosk and POS | `.mp3` `.wav` `.ogg` |
| `videos/` | [View](https://gerry-wood-sumup.github.io/franpos_auxiliary_dam/videos/) | Screensavers, attract loops, promotional display | `.mp4` `.mov` `.webm` |
| `miscellaneous/` | [View](https://gerry-wood-sumup.github.io/franpos_auxiliary_dam/miscellaneous/) | Assets that don't fit another category | — |

### Kiosk Carousel Structure

Carousel images are split into two environments within `kiosk-carousel/`:

- **`live/`** — served to production kiosks
- **`staging/`** — served to dev/staging kiosk builds

Within each environment, images are organised by Company ID (CID) folder for merchant-specific content, with a `global/` folder as the fallback for kiosks that have no CID-specific folder.

**Adding a new CID:** create a folder named with the 6-digit CID under the appropriate environment (e.g. `kiosk-carousel/live/206100/`), add images, and push — indexes are generated automatically.

### Naming Conventions

- Use **Title Case** with spaces for human-readable asset names (e.g., `Strawberry Milk Foam.png`).
- For ordered carousel images, prefix filenames with a zero-padded number (e.g. `01_Promo.png`, `02_Offer.png`) — the order in `index.json` follows filename sort order.
- Names should match the **exact display name** used in FranPOS so assets can be mapped programmatically.
- Avoid special characters other than spaces, hyphens (`-`), and parentheses.

---

## Managing Assets via Git

For users who prefer the command line or need to make bulk changes.

### Prerequisites

Clone the repository once:

```bash
git clone https://github.com/gerry-wood-sumup/franpos_auxiliary_dam.git
cd franpos_auxiliary_dam
```

You'll also need [Git](https://git-scm.com/downloads) installed. To check, run `git --version` in your terminal.

### Adding kiosk carousel images

**For staging** (dev/staging kiosk builds):

1. Copy your image file(s) into `kiosk-carousel/staging/global/` (or a CID folder, e.g. `kiosk-carousel/staging/206100/`).
2. Open a terminal in the repo folder and run:

```bash
git pull
git add kiosk-carousel/
git commit -m "Add carousel images to staging/global"
git push
```

**For live** (production kiosk builds):

1. Copy your image file(s) into `kiosk-carousel/live/global/` (or a CID folder, e.g. `kiosk-carousel/live/206100/`).
2. Run:

```bash
git pull
git add kiosk-carousel/
git commit -m "Add carousel images to live/global"
git push
```

After pushing, GitHub Actions will automatically regenerate all index files and deploy the updated site.

### Adding modifier images

1. Copy your image file(s) into `images/modifiers/toppings/` (or create a new subfolder for a different modifier group, e.g. `images/modifiers/syrups/`).
2. Name the file to match the exact display name used in FranPOS (e.g. `Strawberry Milk Foam.png`).
3. Run:

```bash
git pull
git add images/
git commit -m "Add modifier image: Strawberry Milk Foam"
git push
```

### Adding other assets

For documents, sounds, videos, or miscellaneous files:

```bash
git pull
git add <folder-name>/
git commit -m "Add <brief description of what you added>"
git push
```

Replace `<folder-name>` with `documents`, `sounds`, `videos`, or `miscellaneous` as appropriate.

### Tips

- Always run `git pull` before adding files to make sure your local copy is up to date.
- If you're unsure whether your push worked, check the [Actions tab](https://github.com/gerry-wood-sumup/franpos_auxiliary_dam/actions) — a green checkmark means the site has been updated successfully.
- Index pages update automatically — you never need to edit `index.html` or `index.json` files by hand.

---

## Scheduling a Timed Deployment

If you want changes to go live at a specific date and time — for example, to coincide with a product launch — use a Pull Request with a `/schedule` command instead of pushing directly to `main`.

**Step 1 — Create a branch and commit your changes:**

```bash
git pull
git checkout -b add-levitea-promo
# copy your files into the appropriate folder, then:
git add kiosk-carousel/
git commit -m "Add Levitea promo images to live/global"
git push -u origin add-levitea-promo
```

**Step 2 — Open a Pull Request on GitHub:**

Go to the repository on GitHub. You'll see a prompt to open a PR for your new branch — click **Compare & pull request**.

**Step 3 — Add the `/schedule` command to the PR description:**

Anywhere in the PR description, add a line in this format:

```
/schedule 2026-05-01 9:00 AM EST
```

Supported timezones: `EST`, `EDT`, `CST`, `CDT`, `MST`, `MDT`, `PST`, `PDT`, `UTC`, `GMT`.

**Step 4 — Submit the PR.**

The [Scheduled PR Merge workflow](.github/workflows/merge-schedule.yml) checks all open PRs every 15 minutes. When your scheduled time arrives, it will automatically merge the PR into `main`, triggering the usual index regeneration and deploy pipeline. A comment will be posted on the PR confirming the merge.

> **Note:** Scheduled merges are only honoured for PRs opened by repository collaborators. PRs from forks or external contributors with a `/schedule` command will be silently skipped.

**To cancel:** Simply close the PR, or edit the description to remove the `/schedule` line before the time is reached.

---

## Technical Reference

### Repository Structure

```
franpos_modifier_cms/
├── images/
│   └── modifiers/
│       └── toppings/
├── kiosk-carousel/
│   ├── live/
│   │   ├── global/
│   │   └── <CID>/      (6-digit numeric Company ID, e.g. 206100)
│   └── staging/
│       ├── global/
│       └── <CID>/
├── documents/
├── sounds/
├── videos/
└── miscellaneous/
```

### Kiosk CID Resolution Logic

The kiosk requests a CID-specific index first, falling back to `global/` if none exists:

- **Production:** requests `kiosk-carousel/live/<CID>/index.json`; falls back to `kiosk-carousel/live/global/index.json`
- **Dev/Staging:** requests `kiosk-carousel/staging/<CID>/index.json`; falls back to `kiosk-carousel/staging/global/index.json`

**`index.json` format** (auto-generated in each leaf folder):
```json
{
  "folder": "206100",
  "count": 1,
  "images": [
    { "name": "Levitea Promo.jpg", "url": "Levitea%20Promo.jpg" }
  ]
}
```

Images are listed in filename sort order (`sort -V`), so numeric prefixes (`01_`, `02_`, …) control carousel sequence.

### Index Page Generation & Deployment

On every push to `main`, the **GitHub Actions workflow** ([`.github/workflows/generate-indexes.yml`](.github/workflows/generate-indexes.yml)) handles the full pipeline:

1. Runs [`scripts/generate-indexes.sh`](scripts/generate-indexes.sh) to regenerate all `index.html` and `index.json` files
2. Commits any updated index files back to `main`
3. Deploys the site to GitHub Pages

**The script discovers media directories automatically.** Any new top-level directory added to the repo will be scanned and indexed as long as it contains supported media files. No configuration changes are required.

Directories excluded from scanning: `.git`, `.github`, `scripts`, `node_modules`. To exclude additional directories, edit the `EXCLUDED_DIRS` array at the top of `scripts/generate-indexes.sh`.

To regenerate indexes locally before pushing:

```bash
bash scripts/generate-indexes.sh
```

### Scheduled PR Merge Workflow

The workflow [`.github/workflows/merge-schedule.yml`](.github/workflows/merge-schedule.yml) runs every 15 minutes and auto-merges any open PR whose description contains a `/schedule` command once the specified date and time is reached. Only PRs from repository collaborators are eligible.

The workflow can also be triggered manually via **Actions → Scheduled PR Merge → Run workflow**.

### Search Engine Blocking

A [`robots.txt`](robots.txt) at the repo root instructs all crawlers not to index any content on the GitHub Pages site.
