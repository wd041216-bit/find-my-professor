import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo and Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600">
              © 2026 ProfMatch. All rights reserved.
            </p>
          </div>

          {/* Policy Links */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link href="/privacy-policy">
              <a className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Privacy Policy
              </a>
            </Link>
            <Link href="/terms-of-service">
              <a className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Terms of Service
              </a>
            </Link>
            <Link href="/professor-policy">
              <a className="text-sm text-gray-600 hover:text-purple-600 transition-colors">
                Professor Policy
              </a>
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
