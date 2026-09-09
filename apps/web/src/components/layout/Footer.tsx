import Link from "next/link";


export function Footer() {
  return (
    <footer className="w-full py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-200/20 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Copyright */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} WF Platform. All rights reserved.
        </div>

        {/* Center: Links */}
        <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-300">
          <Link href="/terms" className="hover:text-blue-500 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-blue-500 transition-colors">Privacy</Link>
          <Link href="/docs" className="hover:text-blue-500 transition-colors">Documentation</Link>
        </div>


      </div>
    </footer>
  );
}
