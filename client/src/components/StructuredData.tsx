import { Helmet } from 'react-helmet-async';

/**
 * Structured Data (JSON-LD) for SEO
 * Helps search engines understand the website content
 */
export function StructuredData() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Find My Professor',
    description: 'AI-powered platform connecting students with research opportunities worldwide',
    url: 'https://findmyprofessor.xyz',
    logo: 'https://findmyprofessor.xyz/logo.png',
    sameAs: [
      // Add social media links when available
      // 'https://twitter.com/findmyprofessor',
      // 'https://linkedin.com/company/findmyprofessor'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@findmyprofessor.xyz'
    }
  };

  const webApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Find My Professor',
    applicationCategory: 'EducationalApplication',
    description: 'AI-powered professor matcher for students. Upload your resume, get matched with top professors, and generate application letters instantly.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    featureList: [
      'AI-powered professor matching',
      'Resume upload and analysis',
      'Automatic application letter generation',
      'Research project discovery',
      'Academic profile management'
    ]
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How does Find My Professor work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Find My Professor uses AI to match students with professors based on their academic background, interests, and experience. Simply upload your resume, specify your target university and major, and our AI will find the best matching professors for you.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is Find My Professor free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Find My Professor offers free credits daily to all users. You can use these credits to match with professors and generate application letters.'
        }
      },
      {
        '@type': 'Question',
        name: 'Who can use Find My Professor?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Find My Professor is designed for high school students, undergraduate students, and anyone looking for research opportunities. Whether you\'re seeking summer research internships or long-term academic collaborations, our platform can help.'
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webApplicationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
  );
}
