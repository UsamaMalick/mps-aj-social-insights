# AJ Social Insights (`mps-aj-social-insights`)

Proof of concept: compare Al Jazeera's social media posts with competitors', find which
content engages audiences most, and suggest *how* to tell stories (format, style, hook,
timing, language).

Runs on **seeded sample data** for now. Full setup instructions are completed in the
final build phase. Quick start:

```bash
cp .env.example .env
make up        # postgres, backend (:8000), frontend (:3000)
```

See `CLAUDE.md` for architecture, rules and every `make` command.
