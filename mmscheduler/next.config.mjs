/** @type {import('next').NextConfig} */
const nextConfig = {
    // prevent source maps in build
    productionBrowserSourceMaps: false,

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
