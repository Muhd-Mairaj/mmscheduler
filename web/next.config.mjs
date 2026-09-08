/** @type {import('next').NextConfig} */
const nextConfig = {
    // prevent source maps in build
    productionBrowserSourceMaps: false,

    // Compile the vendored workspace package (real files, see scripts/vendor-db.mjs).
    transpilePackages: ['@mmscheduler/db'],

    // Pin the monorepo root explicitly: db/ lives outside web/, and Turbopack
    // only resolves outside files within the project boundary (inferred from
    // the outermost lockfile). This also silences Next's workspace-root
    // inference warning.
    outputFileTracingRoot: new URL('..', import.meta.url).pathname,

    // enforce https
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
