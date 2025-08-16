import Script from 'next/script';

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Gradual",
    "description": "AI-powered career tool and career builder platform that provides CV scoring, role suggestions, and personalized career guidance.",
    "url": "https://gradual.com",
    "applicationCategory": "CareerApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "creator": {
      "@type": "Organization",
      "name": "Gradual",
      "url": "https://gradual.com"
    },
    "featureList": [
      "AI-driven CV scoring",
      "Smart role suggestions", 
      "Personalized dashboard",
      "Career guidance",
      "Job matching"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1000+"
    },
    "sameAs": [
      "https://twitter.com/gradual",
      "https://linkedin.com/company/gradual",
      "https://facebook.com/gradual"
    ]
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
    />
  );
}
