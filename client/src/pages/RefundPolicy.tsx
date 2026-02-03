import { Footer } from "@/components/Footer";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
        
        <div className="prose prose-slate max-w-none">
          <p className="text-sm text-muted-foreground mb-8">Last Updated: February 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Overview</h2>
            <p>
              Find My Professor offers credits that users can purchase to access premium features and services. This Refund Policy outlines the terms and conditions for refunds related to credit purchases.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Credit System</h2>
            <p className="font-semibold">Credit Usage:</p>
            <ul className="list-disc pl-6 space-y-1 mb-4">
              <li>Credits are used to access premium features such as advanced matching algorithms and detailed project information</li>
              <li>Credits are non-transferable and cannot be exchanged for cash</li>
              <li>Unused credits expire 12 months after purchase</li>
            </ul>

            <p className="font-semibold">Credit Packages:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Starter: 100 credits</li>
              <li>Professional: 500 credits</li>
              <li>Enterprise: 2,000 credits</li>
              <li>Custom packages available upon request</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Refund Eligibility</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">3.1 Eligible for Refund</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Duplicate Charges:</strong> If you were charged multiple times for a single purchase</li>
              <li><strong>Technical Errors:</strong> If a transaction failed but credits were not received</li>
              <li><strong>Unauthorized Transactions:</strong> If your account was compromised and unauthorized purchases were made</li>
              <li><strong>Service Unavailability:</strong> If the Service was unavailable for more than 24 hours during your purchase period</li>
              <li><strong>Within 14 Days (Unused Credits Only):</strong> Refund requests submitted within 14 days of purchase, provided that no credits have been consumed and no premium features have been accessed. Once credits are used or features are accessed, the purchase becomes non-refundable</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3.2 Not Eligible for Refund</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Used Credits:</strong> Credits that have been used to access premium features</li>
              <li><strong>Expired Credits:</strong> Credits that have expired after 12 months</li>
              <li><strong>Promotional Credits:</strong> Credits obtained through promotional offers or discounts</li>
              <li><strong>After 14 Days:</strong> Requests submitted more than 14 days after purchase (except for technical errors or unauthorized transactions)</li>
              <li><strong>Account Violations:</strong> Refunds for accounts suspended or terminated due to violation of Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Refund Request Process</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Step 1: Submit Request</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Email: wd041216@uw.edu</li>
                  <li>Include: Order number, purchase date, and reason for refund request</li>
                  <li>Response time: 5-7 business days</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold">Step 2: Verification</p>
                <p>We will verify the transaction and eligibility for refund. We may request additional documentation or information.</p>
              </div>

              <div>
                <p className="font-semibold">Step 3: Approval or Denial</p>
                <p>You will be notified of the decision via email. Approved refunds will be processed within 7-10 business days.</p>
              </div>

              <div>
                <p className="font-semibold">Step 4: Refund Processing</p>
                <p>Refunds will be credited to the original payment method. Processing time varies by financial institution (typically 5-10 business days).</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Refund Methods</h2>
            <p className="mb-2">Refunds will be issued through the original payment method:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Credit/Debit Card:</strong> Refund appears as a credit to your card</li>
              <li><strong>Alipay:</strong> Refund returned to Alipay account</li>
              <li><strong>WeChat Pay:</strong> Refund returned to WeChat Pay account</li>
              <li><strong>Paddle:</strong> Refund processed according to Paddle's policies</li>
              <li><strong>Other Methods:</strong> Refund processed according to payment processor policies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Partial Refunds</h2>
            <p className="mb-2">Partial refunds may be issued for:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li>Partial credit usage with documented technical errors</li>
              <li>Service interruptions lasting more than 24 hours</li>
              <li>Duplicate charges (refunding only the duplicate amount)</li>
            </ul>
            <p className="font-semibold">Calculation Method:</p>
            <p>Refund amount = (Unused credits / Total credits purchased) × Amount paid (rounded to the nearest cent)</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Merchant of Record Notice</h2>
            <p>
              Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. For refund requests, you may contact either Find My Professor or Paddle.com directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
            <p className="mb-2">For refund-related inquiries:</p>
            <ul className="list-none space-y-1">
              <li><strong>Email:</strong> wd041216@uw.edu</li>
              <li><strong>Support Portal:</strong> www.findmyprofessor.com/support</li>
              <li><strong>Response Time:</strong> 5-7 business days</li>
              <li><strong>Company Name:</strong> 东莞市达誉致远教育咨询有限责任公司</li>
              <li><strong>Address:</strong> 广东省东莞市厚街镇湖景大道8号厚街华瑞世界鞋业总部基地商业楼2单元601室</li>
            </ul>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
