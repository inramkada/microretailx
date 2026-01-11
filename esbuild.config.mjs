import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const isDev = args.includes("--dev");

const outdir = "dist";
const publicDir = "public";

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(outdir, { recursive: true, force: true });
copyDir(publicDir, outdir);

await esbuild.build({
  entryPoints: ["src/app.js"],
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
  target: ["es2020"],
  format: "esm",
  outfile: `${outdir}/assets/app.js`,
  define: {
    __DEV__: JSON.stringify(isDev)
  }
});

await esbuild.build({
  entryPoints: ["src/styles.css"],
  bundle: false,
  minify: !isDev,
  outfile: `${outdir}/assets/styles.css`
});

if (isDev) {
  const ctx = await esbuild.context({
    entryPoints: ["src/app.js"],
    bundle: true,
    minify: false,
    sourcemap: true,
    target: ["es2020"],
    format: "esm",
    outfile: `${outdir}/assets/app.js`,
    define: { __DEV__: JSON.stringify(true) }
  });
  await ctx.watch();

  const ctxCss = await esbuild.context({
    entryPoints: ["src/styles.css"],
    bundle: false,
    minify: false,
    outfile: `${outdir}/assets/styles.css`
  });
  await ctxCss.watch();

  const serve = await esbuild.serve(
    { servedir: outdir, port: 5173, host: "0.0.0.0" },
    {}
  );

  console.log(`Dev server: http://${serve.host}:${serve.port}`);
}
