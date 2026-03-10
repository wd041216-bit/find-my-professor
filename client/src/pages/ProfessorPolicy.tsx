import { Link } from "wouter";
export default function ProfessorPolicy() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Professor Policy</h1>
        <Link href="/professor-policy-zh" className="text-blue-600 hover:underline">
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
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            ProfMatch respects the rights and privacy of professors. This Professor Policy explains how we collect, use, and manage professor information, 
            as well as the rights professors have regarding their data on our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Sources of Professor Information</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 Public Sources Only</h3>
          <p>All professor information on ProfMatch is collected from publicly available sources, including:</p>
          <ul className="list-disc pl-6 mt-4">
            <li><strong>University Official Websites:</strong> Faculty directories, department pages, research group pages</li>
            <li><strong>Academic Databases:</strong> Google Scholar, ResearchGate, ORCID, university research portals</li>
            <li><strong>Academic Publications:</strong> Published papers, conference proceedings, research articles</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Information We Collect</h3>
          <p>We collect the following types of information about professors:</p>
          <ul className="list-disc pl-6 mt-4">
            <li>✅ <strong>Name</strong></li>
            <li>✅ <strong>University and Department</strong></li>
            <li>✅ <strong>Academic Title</strong> (Professor, Associate Professor, Assistant Professor, etc.)</li>
            <li>✅ <strong>Research Fields and Interests</strong></li>
            <li>✅ <strong>Selected Publications</strong> (titles and links to public sources)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Information We Do NOT Collect</h3>
          <p>We do not collect or display:</p>
          <ul className="list-disc pl-6 mt-4">
            <li>❌ Personal contact information (email addresses, phone numbers)</li>
            <li>❌ Home addresses or personal addresses</li>
            <li>❌ Photos or images (unless publicly available and with proper attribution)</li>
            <li>❌ Private social media accounts</li>
            <li>❌ Any information not publicly available</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How Professor Information is Used</h2>
          
          <h3 className="text-xl font-semibold mb-3">3.1 Academic Matching</h3>
          <p>
            Professor information is used to help students discover research opportunities by matching students' academic interests with professors' research fields.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">3.2 No Direct Contact</h3>
          <p className="font-semibold">
            Important: ProfMatch does not provide direct contact information or facilitate direct communication between students and professors through the platform.
          </p>
          <p className="mt-4">
            Students are expected to find and use official university contact channels to reach out to professors.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">3.3 No Endorsement</h3>
          <p>
            The inclusion of a professor's information on ProfMatch does not constitute an endorsement by the professor or their institution. 
            Professors have not necessarily approved or authorized their inclusion on the platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Professor Rights</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 Right to Opt-Out</h3>
          <p className="font-semibold">
            Professors have the absolute right to request removal of their information from ProfMatch at any time, for any reason.
          </p>
          <p className="mt-4">
            To request removal, please contact us at: <strong>professor-optout@profmatch.com</strong>
          </p>
          <p className="mt-4">
            We will process opt-out requests within <strong>7 business days</strong> and confirm removal via email.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Right to Correction</h3>
          <p>
            If you are a professor and notice inaccurate or outdated information about yourself on ProfMatch, you have the right to request corrections.
          </p>
          <p className="mt-4">
            To request corrections, please contact us at: <strong>professor-corrections@profmatch.com</strong>
          </p>
          <p className="mt-4">
            Please provide:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li>Your name and university affiliation</li>
            <li>The specific information that needs correction</li>
            <li>The correct information (with source, if possible)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Right to Update</h3>
          <p>
            Professors can request updates to their research interests, publications, or other professional information.
          </p>
          <p className="mt-4">
            To request updates, please contact us at: <strong>professor-updates@profmatch.com</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Accuracy and Updates</h2>
          
          <h3 className="text-xl font-semibold mb-3">5.1 Regular Updates</h3>
          <p>
            We strive to keep professor information accurate and up-to-date by:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Periodically reviewing and updating professor profiles</li>
            <li>Removing professors who are no longer active in research</li>
            <li>Updating research interests based on recent publications</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Reporting Inaccuracies</h3>
          <p>
            Students and other users can report inaccurate professor information through the app:
          </p>
          <p className="font-semibold mt-4">
            Profile → Legal & Support → Report Inaccurate Information
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Compliance with Academic Norms</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 Respect for Academic Freedom</h3>
          <p>
            ProfMatch respects academic freedom and does not make judgments about professors' research quality, methodologies, or findings.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.2 No Rankings or Ratings</h3>
          <p className="font-semibold">
            ProfMatch does not rank or rate professors. The platform is designed solely for academic matching based on research interests.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.3 Ethical Use</h3>
          <p>
            We encourage students to use professor information ethically and professionally:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>✅ Use information to identify potential research mentors</li>
            <li>✅ Respect professors' time and expertise</li>
            <li>✅ Follow proper academic etiquette when reaching out</li>
            <li>❌ Do not spam or harass professors</li>
            <li>❌ Do not use information for commercial purposes</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Legal Basis</h2>
          
          <h3 className="text-xl font-semibold mb-3">7.1 Legitimate Interest</h3>
          <p>
            Our processing of publicly available professor information is based on legitimate interest in:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Facilitating academic connections and research opportunities</li>
            <li>Supporting students in their academic and career development</li>
            <li>Promoting transparency in academic research</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-4">7.2 Fair Use</h3>
          <p>
            Our use of professor information constitutes fair use under applicable copyright and data protection laws, as:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Information is publicly available</li>
            <li>Use is non-commercial and educational</li>
            <li>We provide proper attribution to sources</li>
            <li>We respect opt-out requests</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
          <p>For professor-related inquiries, please use the following contacts:</p>
          <ul className="list-disc pl-6 mt-4">
            <li><strong>Opt-Out Requests:</strong> professor-optout@profmatch.com</li>
            <li><strong>Corrections:</strong> professor-corrections@profmatch.com</li>
            <li><strong>Updates:</strong> professor-updates@profmatch.com</li>
            <li><strong>General Inquiries:</strong> s20316.wei@stu.scie.com.cn</li>
          </ul>
          <p className="mt-6 font-semibold">
            Response Time: We aim to respond to all professor inquiries within 3-5 business days.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to Professor Policy</h2>
          <p>
            We may update this Professor Policy from time to time. Significant changes will be communicated through:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li>Email notifications to professors who have contacted us</li>
            <li>Updates on our website</li>
          </ul>
          <p className="mt-4">
            The updated policy will take effect 30 days after publication.
          </p>
        </section>
      </div>
    </div>
  );
}
