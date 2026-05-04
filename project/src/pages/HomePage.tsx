import { useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import TrustSection from '../components/home/TrustSection';
import InteractiveSection from '../components/home/InteractiveSection';
import TopicsSection from '../components/home/TopicsSection';
import PlansSection from '../components/home/PlansSection';
import SyllabusSection from '../components/home/SyllabusSection';
import FooterSection from '../components/home/FooterSection';
import FreeTrialPopup, { FreeTrialTrigger } from '../components/home/FreeTrialPopup';

const HomePage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupTrigger, setPopupTrigger] = useState<FreeTrialTrigger>('questions');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white font-body text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      <HeroSection />
      <TrustSection />
      <InteractiveSection onFreeQuestionsUsed={() => { setPopupTrigger('questions'); setShowPopup(true); }} />
      <TopicsSection />
      <PlansSection />
      <SyllabusSection />
      <FooterSection />

      <FreeTrialPopup isOpen={showPopup} onClose={() => setShowPopup(false)} trigger={popupTrigger} />
    </div>
  );
};

export default HomePage;
