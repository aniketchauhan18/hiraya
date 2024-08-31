import {
  Inter,
  Poppins,
  Cedarville_Cursive,
  Montserrat,
  Playfair_Display,
} from "next/font/google";
export const inter = Inter({ subsets: ["latin"] });
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800", "200", "100"],
});
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800", "200", "100"],
});
export const cedarvilleCursive = Cedarville_Cursive({
  subsets: ["latin"],
  weight: ["400"],
});
export const playflairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
});
