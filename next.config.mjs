/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // YouTube channel avatars (snippet.thumbnails, fetched during ingestion)
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
      // Video/short thumbnails (videos.list snippet.thumbnails)
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
