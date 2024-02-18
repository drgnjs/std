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

    // deno-lint-ignore no-unused-vars
    const { main, module, ...packageJson } = JSON.parse(Deno.readTextFileSync('./npm/package.json'))

    packageJson.exports = {
      './encoding': {
        'import': {
          'default': './esm/encoding.js',
          'types': './esm/encoding.d.ts'
        },
        'require': {
          'default': './script/encoding.js',
          'types': './script/encoding.d.ts'
        }
      },
      './jsonc': {
        'import': {
          'default': './esm/jsonc.js',
          'types': './esm/jsonc.d.ts'
        },
        'require': {
          'default': './script/jsonc.js',
          'types': './script/jsonc.d.ts'
        }
      },
      './msgpack': {
        'import': {
          'default': './esm/msgpack.js',
          'types': './esm/msgpack.d.ts'
        },
        'require': {
          'default': './script/msgpack.js',
          'types': './script/msgpack.d.ts'
        }
      },
      './toml': {
        'import': {
          'default': './esm/toml.js',
          'types': './esm/toml.d.ts'
        },
        'require': {
          'default': './script/toml.js',
          'types': './script/toml.d.ts'
        }
      },
      './ulid': {
        'import': {
          'default': './esm/ulid.js',
          'types': './esm/ulid.d.ts'
        },
        'require': {
          'default': './script/ulid.js',
          'types': './script/ulid.d.ts'
        }
      },
      './uuid': {
        'import': {
          'default': './esm/uuid.js',
          'types': './esm/uuid.d.ts'
        },
        'require': {
          'default': './script/uuid.js',
          'types': './script/uuid.d.ts'
        }
      },
      './yaml': {
        'import': {
          'default': './esm/yaml.js',
          'types': './esm/yaml.d.ts'
        },
        'require': {
          'default': './script/yaml.js',
          'types': './script/yaml.d.ts'
        }
      }
    }

    Deno.writeTextFileSync('./npm/package.json', JSON.stringify(packageJson, null, 2))
  }
})
