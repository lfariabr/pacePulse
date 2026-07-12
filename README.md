# PacePulse

A local-first personal performance dashboard built from a standard Strava `activities.csv` export. PacePulse turns years of running, riding, swimming, and strength work into an explainable performance archive—without inventing a proprietary fitness score.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-ff6b35)

## Run locally

```bash
git clone https://github.com/lfariabr/pacePulse.git
cd pacePulse
npm install
npm run dev
```

Download your Strava archive, copy its `activities.csv` into the project root, then open [http://localhost:3000](http://localhost:3000). Restart the app after replacing the export.

`activities.csv` is intentionally ignored by Git. Your activity history, filenames, notes, and media references should never be committed to a public repository.

## What it shows

- All-time and period-filtered totals
- Monthly sport-aware volume
- Sport mix and 52-week consistency
- Year-over-year training history and personal records
- Searchable, sortable, paginated activity explorer
- Recorded heart rate, effort, power, calories, cadence, steps, temperature, and gear when available

The raw CSV is read only by server code. Private notes, descriptions, filenames, and media fields are not included in the browser-facing activity model.

## Quality checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Contributing

Issues and pull requests are welcome. Keep sample data anonymous and never commit a personal Strava export.

## License

[MIT](LICENSE) © Luis Faria
