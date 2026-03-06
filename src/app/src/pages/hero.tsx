import { useNavigate } from "react-router-dom";
import FloatingLines from "../components/background";
import TargetCursor from "../components/heroText";
import StaggeredMenu from "../components/navbar";
import RotatingText from "../components/textAnimation";
import { motion } from "motion/react";

function Hero() {
  const navigate = useNavigate();
  const menuItems = [
    { label: "Home", ariaLabel: "Go to home page", link: "/" },
    { label: "Dashboard", ariaLabel: "View your energy dashboard", link: "/dashboard" },
    { label: "Services", ariaLabel: "Our services", link: "/services" },
  ];

  const socialItems = [
    { label: "Twitter", link: "https://twitter.com" },
    { label: "GitHub", link: "https://github.com" },
    { label: "LinkedIn", link: "https://linkedin.com" },
  ];

  return (
    <div className="bg-[#030014] min-h-screen overflow-hidden relative">
      <div className="w-full h-screen relative">
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
  );
}

export default Hero;
