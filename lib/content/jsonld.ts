// lib/content/jsonld.ts
// Generates JSON-LD structured data for FAQPage and FinancialProduct schema

export function generateFAQPageJsonLD(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

export function generateFinancialProductJsonLD({
  name,
  description,
  salary,
  netSalary,
  city,
  state,
}: {
  name: string;
  description: string;
  salary: number;
  netSalary: number;
  city: string;
  state: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": name,
    "description": description,
    "offers": {
      "@type": "Offer",
      "price": salary,
      "priceCurrency": "USD",
    },
    "areaServed": `${city}, ${state}`,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Net Salary",
        "value": netSalary,
        "unitCode": "USD",
      },
    ],
  };
}
