# Portfolio screenshot plan

Add real application captures here after the final build. Use only synthetic data and keep the browser, operating system, and account details out of frame.

## Recommended images

| Filename | View | What the image should prove |
| --- | --- | --- |
| `01-portal-selection.png` | Desktop, about 1440 × 900 | CivicFlow identity, clear value proposition, and two role paths |
| `02-resident-submission.png` | Desktop or tablet | Focused form, privacy guidance, service categories, and priority |
| `03-submission-confirmation.png` | Desktop or tablet | Successful request reference without exposing resident details |
| `04-admin-dashboard.png` | Desktop, about 1440 × 900 | Metrics, search, filters, category demand, queue, and recent activity |
| `05-request-workflow.png` | Desktop | Detail dialog with ownership, internal note, and the next valid lifecycle action |
| `06-mobile-queue.png` | Mobile, about 390 × 844 | Responsive administrator queue cards |

## Capture checklist

- Reset the portfolio database or use clearly fictional service requests.
- Use a mix of New, Claimed, In Progress, and Resolved records.
- Keep `admin` / `admin` out of screenshots; explain credentials in the README text.
- Do not show `.env` files, cookies, database state, browser developer tools, local paths, or personal bookmarks.
- Capture at 100% browser zoom with the entire main card or dashboard visible.
- Use PNG for crisp interface text.
- Crop consistently and avoid decorative device frames.
- Add concise alt text when embedding each image.

## README snippet

After adding the images, place a compact gallery near the top of the root README:

```markdown
## Screenshots

![CivicFlow role selection](docs/screenshots/01-portal-selection.png)

![CivicFlow administrator dashboard](docs/screenshots/04-admin-dashboard.png)

![CivicFlow request workflow](docs/screenshots/05-request-workflow.png)
```

Three strong images are usually more effective in the README than displaying every state. Keep the remaining captures available in this folder for reviewers who want more detail.
