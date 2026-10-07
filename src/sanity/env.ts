export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION!;
// Production'da mutlak; Preview/yerelde göreli, böylece "Studio'da aç" bağlantısı aynı ortamdaki Studio'ya gider.
export const studioUrl = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/studio` : '/studio';
