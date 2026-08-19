# TuxRacer.js notice

This browser runtime is built from the upstream [TuxRacer.js](https://github.com/ebbejan/tux-racer-js) project by Jan Ebbe. RetroPlay packages the unmodified static build output for non-commercial browser play; it does not claim authorship of the game.

TuxRacer.js is licensed under the **GNU General Public License, version 2 only**. The complete corresponding source, upstream README, build configuration, course data, original credits and full licence are retained in `third_party/tuxracer-js/` in this repository. The upstream build command is:

```sh
pnpm install --ignore-scripts
pnpm build
```

The static files in this folder are generated from that source. The upstream project credits the Extreme Tux Racer team, the original Tux Racer authors, and the music and graphics contributors in its README. See `third_party/tuxracer-js/README.md` for the full credit list.

| Item | Source |
|---|---|
| Upstream project | https://github.com/ebbejan/tux-racer-js |
| Licence | GPL-2.0-only (`LICENSE`) |
| Browser play source | TuxRacer.js static Vite build |
| RetroPlay adaptation | Hosting wrapper, PSP-style outer controls, catalogue integration and fullscreen shell |
