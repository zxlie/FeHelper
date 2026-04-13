import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                Blob: 'readonly',
                navigator: 'readonly',
                location: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                Image: 'readonly',
                Node: 'readonly',
                DOMParser: 'readonly',
                Intl: 'readonly',
                // Chrome extension globals
                chrome: 'readonly',
                self: 'readonly',
                globalThis: 'readonly',
                importScripts: 'readonly',
                // Extension-specific globals
                $: 'readonly',
                jQuery: 'readonly',
                Vue: 'readonly',
                CodeMirror: 'readonly',
                BigNumber: 'readonly',
                BigInt: 'readonly',
                evalCore: 'readonly',
                toast: 'readonly',
                DarkModeMgr: 'readonly',
                Formatter: 'readonly',
                JsonABC: 'readonly',
                JsonEnDecode: 'readonly',
                JsonLint: 'readonly',
                Awesome: 'readonly',
                InstallTrigger: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-undef': 'warn',
            'no-empty': 'warn',
            'no-constant-condition': 'warn',
        },
    },
    {
        ignores: [
            'apps/static/vendor/**',
            'node_modules/**',
            'output/**',
            'apps/json-format/json-bigint.js',
            'test/**',
        ],
    },
];
