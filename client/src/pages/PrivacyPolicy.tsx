import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  const { language, t } = useLanguage();
  const isEnglish = language === "en";

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isEnglish ? "Privacy Policy" : "隐私政策"}
        </h1>
        <Link href="/privacy-policy-zh" className="text-blue-600 hover:underline">
          中文
        </Link>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          <strong>{isEnglish ? "Version" : "版本"}:</strong> 1.0<br />
          <strong>{isEnglish ? "Effective Date" : "生效日期"}:</strong> {isEnglish ? "February 26, 2026" : "2026年2月26日"}<br />
          <strong>{isEnglish ? "Last Updated" : "最后更新"}:</strong> {isEnglish ? "February 26, 2026" : "2026年2月26日"}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to ProfMatch! We value your privacy and are committed to protecting your personal information. 
            This Privacy Policy explains in detail how we collect, use, store, and protect your data.
          </p>
          <p className="font-semibold mt-4">
            Important: By using ProfMatch, you agree to all terms of this Privacy Policy. If you do not agree, please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 Student User Information</h3>
          
          <h4 className="text-lg font-semibold mb-2">Required Information (for account creation and service provision):</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Identity Information:</strong> Name, email address, phone number</li>
            <li><strong>Authentication Information:</strong> Apple ID, Google account (if using third-party login)</li>
            <li><strong>Academic Background:</strong>
              <ul className="list-circle pl-6 mt-2">
                <li>Current education level (undergraduate, master's, PhD, etc.)</li>
                <li>Current or graduated institution</li>
                <li>Major/research direction</li>
                <li>GPA (optional)</li>
                <li>Research interests and goals</li>
              </ul>
            </li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">Usage Data (automatically collected):</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Matching Behavior:</strong> Records of liked/disliked professors</li>
            <li><strong>Match History:</strong> List of matched professors</li>
            <li><strong>Generated Content:</strong> AI-generated cover letter drafts</li>
            <li><strong>Device Information:</strong> Device model, operating system version, app version</li>
            <li><strong>Usage Statistics:</strong> Login times, usage frequency, feature usage</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">Information We Do NOT Collect:</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>❌ Precise geolocation (no GPS tracking)</li>
            <li>❌ Contact lists</li>
            <li>❌ Photos and media files (unless actively uploaded by user)</li>
            <li>❌ Payment information (if future paid features are added, third-party payment processing will be used)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Professor Information (Public Data Only)</h3>
          
          <h4 className="text-lg font-semibold mb-2">Sources of Professor Information:</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>University official websites (faculty directories, department pages)</li>
            <li>Public academic databases (Google Scholar, ResearchGate, etc.)</li>
            <li>Academic publications and conference papers</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">Professor Information Content:</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>✅ Name</li>
            <li>✅ University and department</li>
            <li>✅ Research direction/field</li>
            <li>✅ Academic title (Professor, Associate Professor, etc.)</li>
            <li>❌ <strong>NOT Collected:</strong> Professor photos, personal contact information (email, phone), home address, private social media accounts</li>
          </ul>

          <p className="font-semibold mt-4">
            Important Note: We only use publicly available academic information and do not infringe on professors' privacy rights. 
            Professors can request removal of their information at any time (see "Professor Opt-Out Mechanism").
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          
          <h3 className="text-xl font-semibold mb-3">3.1 Service Provision</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Professor Matching:</strong> Recommend relevant professors based on your research interests and academic background</li>
            <li><strong>Personalized Recommendations:</strong> Optimize matching algorithm to improve recommendation accuracy</li>
            <li><strong>AI Content Generation:</strong> Use your profile to generate customized cover letter drafts</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 Service Improvement</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Data Analysis:</strong> Analyze user behavior to improve app features and user experience</li>
            <li><strong>Bug Fixes:</strong> Diagnose and resolve technical issues</li>
            <li><strong>Feature Development:</strong> Develop new features based on user feedback</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.3 Communication</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Service Notifications:</strong> Account-related notifications, system updates, security alerts</li>
            <li><strong>Marketing Information:</strong> New feature introductions, usage tips (optional, users can unsubscribe anytime)</li>
            <li><strong>Customer Support:</strong> Respond to user inquiries and complaints</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.4 Legal Compliance</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Legal Requirements:</strong> Comply with applicable laws and regulations (such as GDPR, CCPA)</li>
            <li><strong>Security Protection:</strong> Prevent fraud, abuse, and illegal activities</li>
            <li><strong>Rights Protection:</strong> Protect the legitimate rights and interests of ProfMatch and users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 We Do Not Sell Your Data</h3>
          <p className="font-semibold">
            Clear Commitment: ProfMatch will never sell, rent, or trade your personal information to third parties.
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Limited Data Sharing</h3>
          <p>We only share data in the following situations:</p>
          
          <h4 className="text-lg font-semibold mb-2 mt-4">Service Providers (when necessary):</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Cloud Service Providers:</strong> For data storage and server hosting (such as AWS, Google Cloud)</li>
            <li><strong>AI Service Providers:</strong> For generating cover letter content (data is anonymized)</li>
            <li><strong>Analytics Tools:</strong> For app performance monitoring and crash reporting (such as Sentry, Google Analytics)</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">Legal Requirements:</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>Respond to court orders, subpoenas, or other legal processes</li>
            <li>Comply with legitimate requests from government agencies</li>
            <li>Protect the legitimate rights and interests of ProfMatch and users</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">Business Transfers:</h4>
          <p className="mb-4">
            If ProfMatch is acquired, merged, or sells assets, your data may be transferred as part of the transaction (we will notify you in advance)
          </p>

          <h3 className="text-xl font-semibold mb-3">4.3 Anonymized Data</h3>
          <p>
            We may share <strong>anonymized and aggregated data</strong> for research and analysis purposes. This data cannot identify individuals.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Your Rights (GDPR and CCPA Compliance)</h2>
          
          <h3 className="text-xl font-semibold mb-3">5.1 Right to Access</h3>
          <p>You have the right to view your personal information stored by us at any time.</p>
          <p className="font-semibold">How to exercise: In the app, go to "Profile" → "Legal & Support" → "Request My Data"</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.2 Right to Rectification</h3>
          <p>You have the right to correct inaccurate or incomplete personal information.</p>
          <p className="font-semibold">How to exercise: Edit your profile in the app</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.3 Right to Erasure ("Right to be Forgotten")</h3>
          <p>You have the right to request deletion of your personal data.</p>
          <p className="font-semibold">How to exercise: In the app, go to "Profile" → "Delete Account", or email s20316.wei@stu.scie.com.cn</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.4 Right to Data Portability</h3>
          <p>You have the right to receive your personal data in a structured, commonly used, and machine-readable format.</p>
          <p className="font-semibold">How to exercise: Email s20316.wei@stu.scie.com.cn to request data export</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.5 Right to Object</h3>
          <p>You have the right to object to our processing of your personal data for marketing purposes.</p>
          <p className="font-semibold">How to exercise: Turn off push notifications in the app, or click "unsubscribe" in marketing emails</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 Technical Measures</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Encrypted Transmission:</strong> Use TLS/SSL encryption for all data transmission</li>
            <li><strong>Encrypted Storage:</strong> Sensitive data (such as passwords) stored using industry-standard encryption algorithms</li>
            <li><strong>Access Control:</strong> Strictly limit employee access to user data</li>
            <li><strong>Security Audits:</strong> Regular security audits and vulnerability scanning</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.2 Organizational Measures</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Employee Training:</strong> All employees receive data protection and privacy training</li>
            <li><strong>Confidentiality Agreements:</strong> Employees sign confidentiality agreements prohibiting unauthorized access or disclosure of user data</li>
            <li><strong>Incident Response:</strong> Establish data breach emergency response plan</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.3 User Responsibility</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>Password Security:</strong> Please use strong passwords and change them regularly</li>
            <li><strong>Device Security:</strong> Protect your device from unauthorized access</li>
            <li><strong>Suspicious Activity:</strong> If you notice abnormal account activity, please contact us immediately</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
          <p className="font-semibold">Age Restriction: ProfMatch is only for users <strong>18 years and older</strong>.</p>
          <p className="mt-4">
            We do not knowingly collect personal information from children under 18. If we discover we have inadvertently collected children's data, we will delete it immediately.
          </p>
          <p className="font-semibold mt-4">
            Parent Notice: If you believe your child has provided us with personal information, please contact s20316.wei@stu.scie.com.cn.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
          <p>If you have any privacy questions or concerns, please contact us:</p>
          <ul className="list-disc pl-6 mt-4">
            <li><strong>Email:</strong> s20316.wei@stu.scie.com.cn</li>
            <li><strong>In-App:</strong> Profile → Legal & Support → Contact Us</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. For significant changes, we will notify you through:
          </p>
          <ul className="list-disc pl-6 mt-4 mb-4">
            <li>In-app notifications</li>
            <li>Email notifications</li>
            <li>Update prompts on the login page</li>
          </ul>
          <p className="font-semibold">
            Effective Date: The updated Privacy Policy will take effect <strong>30 days</strong> after publication.
          </p>
          <p className="font-semibold mt-4">
            Your Choice: If you do not agree with the updated Privacy Policy, you can delete your account before it takes effect.
          </p>
        </section>
      </div>
    </div>
  );
}
