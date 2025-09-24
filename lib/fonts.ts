import { Inter, Roboto_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const roboto_mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const fontSans = inter
export const fontMono = roboto_mono

