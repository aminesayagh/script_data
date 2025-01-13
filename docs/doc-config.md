# Code Documentation
Generated on: 2025-01-11T16:33:22.545Z
Total files: 2

## Project Structure

```
└── script_data
    ├── package.json
    └── tsconfig.json
```

## File: package.json
- Path: `/root/git/script_data/package.json`
- Size: 607.00 B
- Extension: .json
- Lines of code: 28

```json
{
"scripts": {
"start": "node dist/index.js",
"build": "tsc",
"main": "ts-node src/index.ts"
},
"main": "dist/index.js",
"dependencies": {
"@types/node": "^22.10.5",
"@types/papaparse": "^5.3.15",
"eslint": "^9.17.0",
"eslint-plugin-import": "^2.31.0",
"events": "^3.3.0",
"fs": "0.0.1-security",
"globals": "^15.14.0",
"langdetect": "^0.2.1",
"papaparse": "^5.5.0",
"prettier": "^3.4.2",
"stream": "^0.0.3",
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