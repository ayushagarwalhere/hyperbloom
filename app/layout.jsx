import './globals.css';
import localFont from 'next/font/local';

const manropeFont = localFont({
  src: '../public/fonts/manrope-variable.ttf',
  variable: '--font-manrope',
  display: 'swap',
  weight: '200 800',
});

export const metadata = {
  title: 'Harborline — help, closer.',
  description: 'A calm, mobile-first starting point for trusted crisis and mental health resources.',
};

export default function RootLayout({ children }) {
  return <html lang="en" className={manropeFont.variable}><body>{children}</body></html>;
}
