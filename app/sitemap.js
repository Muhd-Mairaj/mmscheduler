import { SITE_URL } from "./seo";

export default function sitemap() {
  return [{ url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
