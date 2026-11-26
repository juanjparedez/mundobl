import nextConfig from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

const eslintConfig = [
  {
    ignores: ['src/generated/**', 'src/i18n/locales/**'],
  },
  ...nextConfig,
  ...nextTypescript,
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // D1 no tiene transacciones: Prisma corre `$transaction` como consultas
      // sueltas sin avisar. Ver inSequence (prisma-client.ts), atomicWrite
      // (d1.ts) y withLease (lease.ts).
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[property.name='$transaction']",
          message:
            'D1 no tiene transacciones. Usa inSequence, atomicWrite o withLease.',
        },
        {
          selector: 'TemplateElement[value.raw=/FOR UPDATE|pg_advisory/]',
          message: 'D1 no tiene bloqueos de filas. Usa withLease.',
        },
      ],
    },
  },
  {
    // El core de tracking se va a publicar como libreria: funciones puras,
    // sin dependencias ni nada de MundoBL. Solo importa dentro de su carpeta.
    files: ['src/lib/tracking-core/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(?!\\./)',
              message:
                'tracking-core solo importa archivos de su propia carpeta (./).',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'fetch',
        'process',
      ],
    },
  },
];

export default eslintConfig;
