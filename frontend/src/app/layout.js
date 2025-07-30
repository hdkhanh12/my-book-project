import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext"; 
import Navbar from "@/components/Navbar"; 
import { ThemeContextProvider } from "@/context/ThemeContext";

// Cấu hình font Montserrat
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"], 
  variable: "--font-montserrat", 
});

export const metadata = {
  title: "BUKSUGAI",
  description: "Help you find your best suit books",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased min-h-screen flex flex-col`}> 
        <ThemeContextProvider>
          <AuthContextProvider>
            <Navbar /> 
            <main className="flex-grow flex flex-col">
              {children} 
            </main> 
          </AuthContextProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}