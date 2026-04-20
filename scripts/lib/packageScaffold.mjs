import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as esbuild from 'esbuild';
import { zipSync } from 'fflate';

function normalizeRelativePath(value) {
  return value.replaceAll('\\', '/');
}

function collectRelativeFiles(rootPath, currentPath = rootPath) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(currentPath, entry.name);
    if (entry.isDirectory()) {
      return collectRelativeFiles(rootPath, entryPath);
    }
    return [normalizeRelativePath(path.relative(rootPath, entryPath))];
  }).sort();
}

async function bundleAdapterModule({ rootDir, packageDir, modulePath }) {
  const sourcePath = path.join(rootDir, 'addon', modulePath);
  const outputPath = path.join(packageDir, modulePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await esbuild.build({
    entryPoints: [sourcePath],
    outfile: outputPath,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    logLevel: 'silent',
    legalComments: 'none',
  });
  return normalizeRelativePath(modulePath);
}

export async function createStage1PackageScaffold({
  rootDir,
  manifest,
  outputRoot,
}) {
  const packageDir = path.join(outputRoot, 'package');
  fs.rmSync(packageDir, { recursive: true, force: true });
  fs.mkdirSync(packageDir, { recursive: true });

  const manifestPath = path.join(packageDir, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  for (const adapter of manifest.addon.adapters ?? []) {
    const modulePath = adapter?.implementation?.module_path;
    if (modulePath) {
      await bundleAdapterModule({
        rootDir,
        packageDir,
        modulePath,
      });
    }
  }

  return {
    manifest,
    packageDir,
    manifestPath,
    relativeFiles: collectRelativeFiles(packageDir),
  };
}

export async function validateStage1PackageScaffold({
  manifest,
  packageDir,
}) {
  const relativeFiles = collectRelativeFiles(packageDir);
  const importability = [];

  for (const adapter of manifest.addon.adapters ?? []) {
    const modulePath = adapter?.implementation?.module_path;
    if (!modulePath) {
      continue;
    }
    const imported = await import(`${pathToFileURL(path.join(packageDir, modulePath)).href}?cacheBust=${Date.now()}`);
    const exportName = adapter.implementation.export_name;
    if (typeof imported?.[exportName] !== 'function') {
      throw new Error(`Packaged adapter export "${exportName}" is missing from ${modulePath}.`);
    }
    importability.push({
      kind: 'adapter',
      id: adapter.adapter_id,
      modulePath,
    });
  }

  return {
    relativeFiles,
    importability,
  };
}

export function assembleFinalStage1Package({
  addonId,
  outputRoot,
  packageDir,
}) {
  const relativeFiles = collectRelativeFiles(packageDir);
  const zipEntries = Object.fromEntries(
    relativeFiles.map((relativePath) => [
      relativePath,
      fs.readFileSync(path.join(packageDir, relativePath)),
    ]),
  );
  const zipBytes = zipSync(zipEntries, { level: 0 });
  const zipPath = path.join(outputRoot, `${addonId}-local_js.zip`);
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  fs.writeFileSync(zipPath, zipBytes);

  return {
    zipPath,
    zipBytes,
    relativeFiles,
  };
}
