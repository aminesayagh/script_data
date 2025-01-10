# Code Documentation
Generated on: 2025-01-09T22:57:52.864Z
Total files: 3

## Project Structure

```
└── script_data
    ├── build.js
    ├── package.json
    └── tsconfig.json
```

## File: build.js
- Path: `/root/git/script_data/build.js`
- Size: 505.00 B
- Extension: .js
- Lines of code: 14

```js
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const esbuild = require('esbuild');
const { typescriptPlugin } = require('esbuild-plugin-typescript');
esbuild.build({
entryPoints: ['src/index.ts'],
bundle: true,
outfile: 'dist/index.js',
platform: 'node',
target: 'node14',
format: 'cjs',
plugins: [typescriptPlugin()],
external: ['unified', 'remark-parse', 'remark-stringify', 'unist-util-visit'],
}).catch(() => process.exit(1));
```

---------------------------------------------------------------------------

## File: package.json
- Path: `/root/git/script_data/package.json`
- Size: 440.00 B
- Extension: .json
- Lines of code: 20

```json
{
"scripts": {
"start": "node dist/index.js",
"build": "node build.js",
"dev": "ts-node src/index.ts"
},
"main": "dist/index.js",
"dependencies": {
"esbuild": "^0.24.2",
"esbuild-plugin-typescript": "^2.0.0",
"eslint": "^9.17.0",
"eslint-plugin-import": "^2.31.0",
"globals": "^15.14.0",
"prettier": "^3.4.2",
"ts-node": "^10.9.2",
"typescript": "^5.7.3",
"typescript-eslint": "^8.19.1",
"zod": "^3.24.1"
}
}
```

---------------------------------------------------------------------------

## File: tsconfig.json
- Path: `/root/git/script_data/tsconfig.json`
- Size: 373.00 B
- Extension: .json
- Lines of code: 15

```json
{
"compilerOptions": {
"target": "ES2020",
"module": "CommonJS",
"lib": ["ES2020", "ES2021", "ES2022", "ES2023", "ESNext", "dom"],
"strict": true,
"esModuleInterop": true,
"skipLibCheck": true,
"forceConsistentCasingInFileNames": true,
"outDir": "dist",
"rootDir": "src"
},
"include": ["src/**/*"],
"exclude": ["node_modules"]
}
```

---------------------------------------------------------------------------