import { useNavigate } from "react-router-dom";
import FloatingLines from "../components/background";
import TargetCursor from "../components/heroText";
import StaggeredMenu from "../components/navbar";
import RotatingText from "../components/textAnimation";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Key, Lock, Zap, Server, ChevronDown, CheckCircle, EyeOff, Code, Database, Fingerprint } from "lucide-react";
import { useState } from "react";

function Hero() {
  const navigate = useNavigate();
  const menuItems = [
    { label: "Home", ariaLabel: "Go to home page", link: "/" },
    { label: "Dashboard", ariaLabel: "View your energy dashboard", link: "/dashboard" },


  ];

  const socialItems = [
    { label: "Twitter", link: "https://twitter.com" },
    { label: "GitHub", link: "https://github.com" },
    { label: "LinkedIn", link: "https://linkedin.com" },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    { icon: <Shield className="w-8 h-8" />, title: "End-to-End Encryption", desc: "Your data is encrypted locally before it ever touches the network. We literally cannot read it." },
    { icon: <Key className="w-8 h-8" />, title: "Asymmetrical Handshake", desc: "Public/Private key pairs ensure that only authorized clients can establish a secure session." },
    { icon: <Lock className="w-8 h-8" />, title: "Symmetrical Streaming", desc: "Once authenticated, live meter data is streamed using ultra-fast AES-256 symmetrical keys." },
    { icon: <EyeOff className="w-8 h-8" />, title: "Zero-Knowledge Architecture", desc: "If our databases are ever breached, the attackers get nothing but randomized cipher-text." }
  ];

  const team = [
    { name: "Alice Crypt", role: "Lead Architect", bg: "bg-[#fbbf24]" },
    { name: "Bob Cipher", role: "Security Engineer", bg: "bg-[#f472b6]" },
    { name: "Eve Listener", role: "Penetration Tester", bg: "bg-[#4ade80]" }
  ];

  const faqs = [
    { q: "What does End-to-End Encryption actually mean here?", a: "It means the smart meter encrypts the energy payload using a key that only your dashboard possesses. Our servers act strictly as a dumb pipe routing the encrypted packets." },
    { q: "Why use both Asymmetrical and Symmetrical keys?", a: "Asymmetrical keys (like RSA/ECC) are extremely secure but computationally expensive. We use them for the initial secure handshake to safely exchange a temporary Symmetrical key (like AES) which is much faster for encrypting real-time WebSocket data." },
    { q: "Who owns my energy data?", a: "You do. Because of our Zero-Knowledge architecture, Zecure cannot monetize, analyze, or even read your historical consumption data. It belongs strictly to you." },
    { q: "Is the Symmetrical encryption fast enough for real-time?", a: "Yes. AES-256 encryption adds less than 1ms of overhead, ensuring your live dashboard graphs remain buttery smooth and instantly synchronized." }
  ];

  return (
    <div className="bg-[#030014] min-h-screen overflow-x-hidden relative font-sans selection:bg-[#c084fc] selection:text-slate-900">
      {/* HERO SECTION */}
      <div className="w-full min-h-screen relative flex flex-col">
        <div className="absolute inset-0">
        <FloatingLines
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={5}
          lineDistance={5}
          bendRadius={5}
          bendStrength={-0.5}
          interactive={true}
          parallax={true}
        />
      </div>

      <div className="absolute top-0 left-0 w-full h-full z-100 pointer-events-none">
        <StaggeredMenu
          position="right"
          items={menuItems}
          socialItems={socialItems}
          displaySocials
          displayItemNumbering={true}
          menuButtonColor="#ffffff"
          openMenuButtonColor="#fff"
          changeMenuColorOnOpen={true}
          colors={["#B19EEF", "#5227FF"]}
          logoUrl="../../public/vite.svg"
          accentColor="#5227FF"
        />
      </div>

      <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />

      <div className="absolute inset-0 z-60 flex flex-col items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pointer-events-auto"
        >
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">ZECURE</h1>
            <RotatingText
              texts={["SMART", "SECURE", "SAVVY"]}
              mainClassName="px-4 py-2 bg-purple-600 text-white overflow-hidden justify-center rounded-xl text-2xl font-bold"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2500}
            />
          </div>

          <p className=" text-xl md:text-2xl max-w-2xl text-center mb-10 font-medium text-white">
            The next generation of energy management. <span className="cursor-target">Monitor</span>, <span className="cursor-target">Analyze</span> & <span className="cursor-target">Optimize</span> your consumption with ease
          </p>

          <div className="flex gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="cursor-target px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-2 hover:bg-slate-200 transition-all hover:scale-105 premium-shadow cursor-pointer"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/sign-in')}
              className="cursor-target px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-2xl hover:bg-white/5 transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </div>
    </div>

    {/* TRANSITION TO LIGHT MODE NEO-BRUTALISM */}
    <div className="w-full bg-white relative z-50 border-t-8 border-slate-900 mt-20 md:mt-0">

        {/* 1. FEATURE SECTION */}
        <section className="max-w-7xl mx-auto py-24 px-6">
          <div className="mb-16">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900 mb-6 drop-shadow-[4px_4px_0px_#c084fc]">
              Military-Grade Cryptography
            </h2>
            <p className="text-xl text-slate-900 font-bold max-w-3xl border-l-8 border-[#f472b6] pl-6 py-2">
              We built Zecure around the philosophy that your energy footprint is highly sensitive personal data. We don't just secure it; we make it mathematically impossible for anyone else to read it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <div key={i} className="neo-box neo-shadow p-8 bg-white hover:-translate-y-2 transition-transform duration-300">
                <div className="w-16 h-16 bg-[#c084fc] border-4 border-slate-900 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-wider mb-4 text-slate-900">{f.title}</h3>
                <p className="text-slate-700 font-bold text-lg leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. ABOUT / ZERO KNOWLEDGE SECTION */}
        <section className="bg-[#fbbf24] border-y-8 border-slate-900 py-24">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-slate-900 mb-8 bg-white inline-block px-4 py-2 border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                Zero-Knowledge Architecture
              </h2>
              <p className="text-xl text-slate-900 font-bold mb-6">
                Most smart meter platforms collect your data in plain text, parse it on their servers, and sell it to third parties. We don't.
              </p>
              <ul className="space-y-4 mb-8">
                {["No middleman decryption", "No data monetization", "Absolute user sovereignty"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg font-black uppercase text-slate-900">
                    <CheckCircle className="text-[#f472b6] w-6 h-6 stroke-[3px]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="neo-box neo-shadow p-8 bg-slate-900 text-white relative z-10">
                <Code className="w-12 h-12 text-[#4ade80] mb-6" />
                <pre className="font-mono text-sm md:text-base text-[#c084fc] overflow-x-auto whitespace-pre-wrap font-bold">
                  {`// Zecure Server Logs
[INFO] Receiving payload...
[WARN] Payload encrypted
[SECURE] Encrypted payload:
"U2FsdGVkX19zL...8aV="
[INFO] Routing to client...
[SUCCESS] Server knows NOTHING.`}
                </pre>
              </div>
              <div className="absolute top-4 -right-4 w-full h-full bg-[#f472b6] border-4 border-slate-900 -z-0"></div>
            </div>
          </div>
        </section>

        {/* 3. EXPERIENCE / DATA PIPELINE SECTION */}
        <section className="max-w-7xl mx-auto py-24 px-6">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900 mb-16 text-center">
            The Data Pipeline
          </h2>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-2 bg-slate-900 -translate-y-1/2 z-0"></div>

            {[
              { title: "Smart Meter", icon: <Zap />, bg: "bg-[#4ade80]" },
              { title: "Client Encryption", icon: <Lock />, bg: "bg-[#c084fc]" },
              { title: "Secure WebSocket", icon: <Server />, bg: "bg-[#fbbf24]" },
              { title: "Local Decryption", icon: <Fingerprint />, bg: "bg-[#f472b6]" }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center mb-12 md:mb-0 bg-white p-4">
                <div className={`w-20 h-20 rounded-full border-4 border-slate-900 flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] ${step.bg}`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-black uppercase text-slate-900 text-center px-4 py-1 bg-slate-100 border-2 border-slate-900">
                  {i + 1}. {step.title}
                </h3>
              </div>
            ))}
          </div>
        </section>

        <div className="h-16 border-y-8 border-slate-900"></div>

        {/* 4. TEAM SECTION */}
        {/* <section className="bg-slate-900 border-y-8 border-slate-900 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white mb-16 text-center">
              The Architects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, i) => (
                <div key={i} className={`p-8 border-4 border-white ${member.bg} shadow-[8px_8px_0px_0px_#ffffff] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_#ffffff] transition-all`}>
                  <div className="w-24 h-24 bg-white border-4 border-slate-900 rounded-full mb-6 mx-auto overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-3xl font-black uppercase text-slate-900 text-center mb-2">{member.name}</h3>
                  <p className="text-center font-bold text-slate-900 uppercase tracking-widest text-sm">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* 5. FAQ SECTION */}
        <section className="max-w-4xl mx-auto py-24 px-6">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900 mb-16 text-center drop-shadow-[4px_4px_0px_#4ade80]">
            Common Queries
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="neo-box neo-shadow bg-white overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full p-6 text-left flex justify-between items-center cursor-pointer hover:bg-slate-50"
                >
                  <span className="text-xl md:text-2xl font-black uppercase text-slate-900 pr-8">{faq.q}</span>
                  <ChevronDown className={`w-8 h-8 text-[#c084fc] transition-transform duration-300 shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t-4 border-slate-900 bg-slate-50"
                    >
                      <p className="p-6 text-lg font-bold text-slate-700 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 6. FOOTER SECTION */}
        <footer className="bg-slate-900 border-t-8 border-white pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-[15vw] leading-none font-black text-white tracking-tighter text-center mb-16 opacity-90">
              ZECURE
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-white border-t-4 border-white/20 pt-12">
              <div className="col-span-1 md:col-span-2">
                <p className="text-xl font-bold max-w-sm">
                  Uncompromised energy intelligence. Your data, cryptographically secured.
                </p>
              </div>
              <div>
                <h4 className="text-xl font-black uppercase mb-4 text-[#fbbf24]">Product</h4>
                <ul className="space-y-2 font-bold opacity-80">
                  <li><a href="#" className="hover:text-white transition-colors">Dashboard</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-black uppercase mb-4 text-[#4ade80]">Legal</h4>
                <ul className="space-y-2 font-bold opacity-80">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-16 text-center font-bold text-white/50 uppercase tracking-widest text-sm">
              &copy; {new Date().getFullYear()} Zecure Security Systems. All rights encrypted.
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default Hero;
