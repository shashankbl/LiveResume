# LiveResume

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deployed%20on-GitHub%20Pages-black)](https://shashankbl.github.io/resume)

**Author: Shashank Bangalore Lakshman**
[Demo](https://shashankbl.github.io/LiveResume/)

A lightweight, zero-dependency web app that renders a Markdown resume as a print-ready PDF in the browser — hosted for free on GitHub Pages.

> Write your resume once in Markdown. Share a link. Download a perfect PDF anytime.

## Features

- Auto-detects and loads the latest resume from `resume_md/` by filename date
- Serif / Sans-serif font toggle
- One-click PDF export via browser print
- LaTeX-inspired typography with Computer Modern font
- No build step, no frameworks — just HTML, CSS, and vanilla JS

## How it works

- Write your resume in Markdown and place it in the `resume_md/` folder
- The app automatically picks up the **newest file** based on the date in the filename (e.g. `Resume_7th.April.2026.md`)
- Click **Save as PDF** to export

## File naming convention

```text
YourName_Resume_7th.April.2026.md
YourName_Resume_Apr2026.md
```

The app parses the date from the filename and always loads the most recent one.

## Use this template

1. Fork or use this repo as a template
2. Add your resume as a Markdown file in `resume_md/`
3. Enable GitHub Pages on `main` in your repo settings
4. Share your link — done

## Formatting guide

The app maps standard Markdown headings and elements to resume sections:

| Markdown | Renders as |
| --- | --- |
| Plain paragraphs at the top (before any heading) | Centered resume header (name, contact info) |
| `## Section` | Section title with horizontal rule (e.g. Experience, Skills) |
| `### Company Name` | Company / institution name |
| `#### Job Title` | Role title in italics |
| `* bullet` | Bullet point (10pt) |
| `**bold**` | Bold text |
| `*italic*` | Italic text |
| `[text](url)` | Hyperlink (opens in new tab) |
| `$small text$` | 9pt indented text (for dates, subtitles) |

**Tips:**

- Extra blank lines between sections add visual breathing room
- Links are auto-detected — bare `email@example.com` is converted to a `mailto:` link
- The PDF export respects page breaks; headings are kept with their content

## Running locally

Serve with any static file server — opening `index.html` directly won't work because the app fetches Markdown over HTTP.

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080` in your browser.

> **Address already in use?** Another process is holding port 8080. Free it and retry:
>
> ```bash
> lsof -ti :8080 | xargs kill
> ```

## License

[MIT](LICENSE)
