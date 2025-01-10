# Code Documentation
Generated on: 2025-01-10T12:12:13.247Z
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
- Size: 608.00 B
- Extension: .json
- Lines of code: 27

```json
{
"scripts": {
"start": "node dist/index.js",
"build": "node build.js",
"dev": "ts-node src/index.ts"
},
"main": "dist/index.js",
"dependencies": {
"@types/papaparse": "^5.3.15",
"esbuild": "^0.24.2",
"esbuild-plugin-typescript": "^2.0.0",
"eslint": "^9.17.0",
"eslint-plugin-import": "^2.31.0",
"fs": "0.0.1-security",
"globals": "^15.14.0",
"langdetect": "^0.2.1",
"papaparse": "^5.5.0",
"prettier": "^3.4.2",
"ts-node": "^10.9.2",
"typescript": "^5.7.3",
"typescript-eslint": "^8.19.1",
"zod": "^3.24.1"
},
"devDependencies": {
"@types/langdetect": "^0.2.2"
}
}
```

---------------------------------------------------------------------------

## File: tsconfig.json
- Path: `/root/git/script_data/tsconfig.json`
- Size: 423.00 B
- Extension: .json
- Lines of code: 15

```json
{
"compilerOptions": {
"target": "ES2020",
"module": "CommonJS",
"lib": ["ES2020", "ES2021", "ES2022", "ES2023", "ESNext", "dom", "ES2015", "ES2016", "ES2017", "ES2018", "ES2019"],
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