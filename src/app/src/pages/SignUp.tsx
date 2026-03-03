import { SignUp } from "@clerk/clerk-react";
import { motion } from "motion/react";
import FloatingLines from "../components/background";

const SignUpPage = () => {
  return (
    <div className="min-h-screen w-full bg-[#030014] flex items-center justify-center relative overflow-hidden">
     
      <div className="absolute inset-0 z-0">
        <FloatingLines
          enabledWaves={["top", "middle", "bottom"]}
          lineCount={3}
          lineDistance={10}
          bendRadius={5}
          bendStrength={-0.3}
          interactive={false}
          parallax={true}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 relative"
      >
        <div className="glass-card p-1 premium-shadow relative overflow-hidden rounded-4xl">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-cyan-500/10 pointer-events-none" />
          <SignUp 
            routing="path" 
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-none p-8",
                headerTitle: "text-white text-3xl font-black tracking-tight",
                headerSubtitle: "text-slate-400 text-lg",
                socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white font-medium",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-white/10",
                dividerText: "text-slate-500",
                formFieldLabel: "text-slate-300 font-semibold mb-2",
                formFieldInput: "bg-white/5 border-white/10 text-white focus:ring-purple-500 focus:border-purple-500 rounded-xl py-3 px-4",
                formButtonPrimary: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-all outline-none border-none",
                footerActionText: "text-slate-400",
                footerActionLink: "text-purple-400 hover:text-purple-300 font-bold",
                identityPreviewText: "text-white",
                identityPreviewEditButtonIcon: "text-purple-400",
                formResendCodeLink: "text-purple-400",
                clerkLogoBox: "hidden",
                developmentBadge: "hidden",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                showOptionalFields: false,
              }
            }}
          />
        </div>
      </motion.div>

      <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default SignUpPage;
