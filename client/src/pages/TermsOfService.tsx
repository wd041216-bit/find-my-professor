import { Link } from "wouter";
export default function TermsOfService() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <Link href="/terms-of-service-zh" className="text-blue-600 hover:underline">
          中文
        </Link>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          <strong>Version:</strong> 1.0<br />
          <strong>Effective Date:</strong> February 26, 2026<br />
          <strong>Last Updated:</strong> February 26, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using ProfMatch ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
            If you do not agree to these Terms, please do not use the Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Service Description</h2>
          <p>
            ProfMatch is an academic matching platform that helps students discover and connect with professors whose research interests align with their academic goals. 
            The Service includes:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Professor discovery and matching</li>
            <li>AI-powered cover letter generation</li>
            <li>Profile management</li>
            <li>Match history tracking</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Eligibility</h2>
          <p className="font-semibold">
            Age Requirement: You must be at least 18 years old to use ProfMatch.
          </p>
          <p className="mt-4">
            By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 Account Creation</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>You must provide accurate and complete information when creating an account</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You are responsible for all activities that occur under your account</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.2 Account Security</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Use strong passwords and keep them secure</li>
            <li>Do not share your account with others</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account if you violate these Terms or engage in any conduct that we deem inappropriate or harmful to the Service or other users.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
          
          <h3 className="text-xl font-semibold mb-3">5.1 Permitted Uses</h3>
          <p>You may use ProfMatch for:</p>
          <ul className="list-disc pl-6 mt-4 mb-4">
            <li>Discovering professors for academic research opportunities</li>
            <li>Generating draft cover letters for academic applications</li>
            <li>Managing your academic profile and interests</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.2 Prohibited Uses</h3>
          <p>You agree NOT to:</p>
          <ul className="list-disc pl-6 mt-4">
            <li>❌ Use the Service for any illegal or unauthorized purpose</li>
            <li>❌ Harass, spam, or send unsolicited communications to professors</li>
            <li>❌ Scrape, crawl, or collect professor data for commercial purposes</li>
            <li>❌ Impersonate others or provide false information</li>
            <li>❌ Attempt to gain unauthorized access to the Service or other users' accounts</li>
            <li>❌ Interfere with or disrupt the Service or servers</li>
            <li>❌ Upload malicious code, viruses, or harmful content</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 Our Content</h3>
          <p>
            All content, features, and functionality of ProfMatch (including but not limited to text, graphics, logos, icons, images, audio clips, and software) are the exclusive property of ProfMatch and are protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.2 Your Content</h3>
          <p>
            You retain ownership of any content you submit to ProfMatch (such as your profile information, cover letters, etc.). 
            By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content solely for the purpose of providing and improving the Service.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.3 AI-Generated Content</h3>
          <p>
            Cover letters generated by our AI are provided as drafts for your reference. You are responsible for reviewing, editing, and ensuring the accuracy of any AI-generated content before using it.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
          
          <h3 className="text-xl font-semibold mb-3">7.1 No Guarantee of Results</h3>
          <p className="font-semibold">
            ProfMatch does not guarantee that you will be accepted into any academic program, receive a research position, or establish contact with any professor.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">7.2 Professor Information Accuracy</h3>
          <p>
            We strive to provide accurate and up-to-date professor information, but we cannot guarantee the accuracy, completeness, or timeliness of all data. Professor information is collected from public sources and may change without notice.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">7.3 Third-Party Links</h3>
          <p>
            The Service may contain links to third-party websites (such as university websites, professor personal pages). We are not responsible for the content, privacy practices, or terms of service of these third-party sites.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">7.4 Service Availability</h3>
          <p>
            We do not guarantee that the Service will be available at all times without interruption. We may suspend or discontinue the Service for maintenance, updates, or other reasons.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p className="font-semibold">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROFMATCH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>
          <p className="mt-4">
            In no event shall our total liability to you for all claims exceed the amount you paid to us (if any) in the past 12 months.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless ProfMatch and its officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of significant changes through:
          </p>
          <ul className="list-disc pl-6 mt-4 mb-4">
            <li>In-app notifications</li>
            <li>Email notifications</li>
            <li>Update prompts on the login page</li>
          </ul>
          <p>
            Your continued use of the Service after the effective date of the updated Terms constitutes your acceptance of the changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Washington, United States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">12. Dispute Resolution</h2>
          <p>
            Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except that either party may seek injunctive relief in court.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us:</p>
          <ul className="list-disc pl-6 mt-4">
            <li><strong>Email:</strong> support@profmatch.com</li>
            <li><strong>In-App:</strong> Profile → Legal & Support → Contact Us</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
