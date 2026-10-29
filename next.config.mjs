/** @type {import('next').NextConfig} */
const nextConfig = {
    // The settings menu of the timetable (reactstrap's dropdown) is not positioned
    // in development when strict mode is on, it stays in the top left corner
    reactStrictMode: false,

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
