# vr-play-test

Interactive 3D room explorer demo built with [Three.js](https://threejs.org/).

## Development

The project sources live at the repository root:

- `index.html`
- `styles.css`
- `main.js`

## Building & Deploying

This project bundles its JavaScript with [esbuild](https://esbuild.github.io/) so that the
Three.js dependencies are included statically in the final artifact. The build output
is published to the `gh-pages` branch automatically.

```bash
npm install
npm run build
```

`npm run build` performs two steps:

1. Bundles the application into the `dist/` directory.
2. Pushes the `dist/` contents to the `gh-pages` branch using the `gh-pages` CLI.

The bundled files can also be created without publishing by running:

```bash
npm run bundle
```
