import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.representative }],
  creator: siteConfig.name,
  publisher: siteConfig.name,


verification: {
  google: "gGwghIT-xUJ9KAUdLQdiAzqZSlTDKbgxFQ5LqykElbw",
},

alternates: {
  canonical: "/",
},

  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} 대표 이미지`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "real estate",
};

const realEstateAgentJsonLd = {
  "@context": "https://schema.org",
  "@type": ["RealEstateAgent", "LocalBusiness"],
  name: siteConfig.name,
  legalName: siteConfig.name,
  description: siteConfig.description,
  url: siteConfig.url,
  image: `${siteConfig.url}${siteConfig.ogImage}`,
  telephone: siteConfig.phone || undefined,
  address: siteConfig.address
    ? {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address,
        addressRegion: "대구광역시",
        addressCountry: "KR",
      }
    : undefined,
  areaServed: siteConfig.serviceAreas.map((name) => ({
    "@type": "AdministrativeArea",
    name,
  })),
  founder: {
    "@type": "Person",
    name: siteConfig.representative,
  },
  knowsAbout: [
    "상가 매매 및 임대",
    "원룸·투룸·다가구",
    "아파트 매매 및 전세",
    "오피스텔 매매 및 임대",
    "창고·공장",
    "토지 투자 상담",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(realEstateAgentJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
