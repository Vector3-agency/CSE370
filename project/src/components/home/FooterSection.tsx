const footerLinks = {
  Legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-use' },
    { label: 'Refund Policy', href: '/refund-policy' },
  ],
};

import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

/* Inline style tag for keyframe animations */
const typewriterStyles = `
@keyframes typing-once {
  0% { max-width: 0 }
  50% { max-width: 300px }
  100% { max-width: 300px }
}
@keyframes blink-caret {
  from, to { border-color: transparent }
  50% { border-color: #818cf8 }
}
`;

function TypewriterCredit() {
  const [hasPlayed, setHasPlayed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || hasPlayed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasPlayed) {
          setHasPlayed(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasPlayed]);

  return (
    <>
      <style>{typewriterStyles}</style>
      <div
        ref={ref}
        style={{
          overflow: 'hidden',
          borderRight: '.12em solid #818cf8',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          maxWidth: hasPlayed ? '300px' : '0',
          animation: hasPlayed ? 'typing-once 4s steps(22, end) forwards, blink-caret .75s step-end infinite' : 'none',
        }}
      >
        <a
          href="https://www.vector3.agency"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span className="text-sm shrink-0 text-white">
            Made by Vector3
          </span>
        </a>
      </div>
    </>
  );
}

export default function FooterSection() {
  return (
    <footer className="bg-slate-950 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          {/* Brand column */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <img src="/logowhite.png" alt="MedKotha Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-extrabold tracking-tight font-heading">MedKotha</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              The smartest way to prepare for MBBS professional exams in Bangladesh.
            </p>
          </div>

          {/* Legal column */}
          <div className="shrink-0">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-4 font-heading">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.Legal.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('/') ? (
                    <Link
                      to={link.href}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white text-sm">
            © 2026 MedKotha. All rights reserved.
          </p>
          <TypewriterCredit />
        </div>
      </div>
    </footer>
  );
}
