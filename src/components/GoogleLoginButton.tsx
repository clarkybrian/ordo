import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/services/auth";
import { FaGoogle } from "react-icons/fa";
import { motion } from "framer-motion";

const GoogleLoginButton = () => {
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button 
        onClick={handleGoogleLogin}
        variant="outline" 
        className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
      >
        <FaGoogle className="h-4 w-4 text-red-500" />
        Se connecter avec Google
      </Button>
    </motion.div>
  );
};

export default GoogleLoginButton;
