import sys

filepath = r'e:/work/Vector3/Opority Collab/flashcardV2/src/components/home/HeroSection.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """            <p ref={subRef} className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
              Join thousands of med students using AI-powered questions, instant clinical tutoring, and predictive analytics to crush USMLE, COMLEX & shelf exams.
            </p>"""

replacement = """            <p ref={subRef} className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
              Join thousands of med students using AI-powered questions, instant clinical tutoring, and predictive analytics to crush USMLE, COMLEX & shelf exams.
            </p>

            <div ref={ctaRef} className="pt-8 pb-0 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/auth?mode=signup')}
                className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {user ? 'Go to Dashboard' : 'Get Started for Free'}
              </button>
            </div>"""

if target.replace('\n', '\r\n') in content:
    new_content = content.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Replaced successfully (CRLF).')
elif target in content:
    new_content = content.replace(target, replacement)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Replaced successfully (LF).')
else:
    print('Target not found.')
