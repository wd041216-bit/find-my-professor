import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { language, t } = useLanguage();
  const isZh = language === "zh";
  
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo and Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600">
              {language === "en" ? "© 2026 ProfMatch. All rights reserved." : "© 2026 ProfMatch. 保留所有权利。"}
            </p>
          </div>

          {/* Policy Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href={isZh ? "/privacy-policy-zh" : "/privacy-policy"} className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
              {t.policy.privacyPolicy}
            </Link>
            <Link href={isZh ? "/terms-of-service-zh" : "/terms-of-service"} className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
              {t.policy.termsOfService}
            </Link>
            <Link href={isZh ? "/professor-policy-zh" : "/professor-policy"} className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
              {t.policy.professorPolicy}
            </Link>
          </div>

          {/* Contact */}
          <div className="text-center md:text-right">
            <a 
              href="mailto:support@profmatch.com" 
              className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
            >
              support@profmatch.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
