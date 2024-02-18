import { build, emptyDir } from 'https://deno.land/x/dnt@0.40.0/mod.ts'

await emptyDir('third_party')

const tagName = await (async function getTagNameOfLatestRelease() {
  const res = await fetch('https://api.github.com/repos/denoland/deno_std/releases/latest')

  const json = await res.json()

  return json.tag_name as string
})()

async function updateVersion() {
  const { VERSION } = await import('./_.ts')

  await Deno.writeTextFile('./_.ts', (await Deno.readTextFile('./_.ts')).replaceAll(VERSION, tagName))
}

await updateVersion()

const cmd = new Deno.Command('deno', {
  args: [
    'vendor',
    '_.ts',
    '--output',
    'third_party'
  ]
})

await cmd.output()

for await (const entry of Deno.readDir('./third_party/deno.land')) {
  if (entry.isDirectory && entry.name.startsWith('std@'))
  await Deno.rename(`./third_party/deno.land/${entry.name}`, './third_party/deno.land/std')
}

await emptyDir('./npm')

await build({
  entryPoints: [
    './encoding.ts',
    './jsonc.ts',
    './msgpack.ts',
    './toml.ts',
    './ulid.ts',
    './uuid.ts',
    './yaml.ts'
  ],
  outDir: './npm',
  shims: {},
  package: {
    name: '@drgn/std',
    version: tagName,
    license: 'Unlicense',
    engines: {
      node: '>=20'
    }
  },
  compilerOptions: {
    lib: [
      'ES2022',
      'DOM'
    ]
  },
  postBuild() {
    Deno.copyFileSync('license', 'npm/license')
    Deno.copyFileSync('readme.md', 'npm/readme.md')
  }
})
