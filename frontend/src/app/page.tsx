import Delivery from '@/components/Delivery';
import Footer from '@/components/Footer';
import Freshness from '@/components/Freshness';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Products from '@/components/Products';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Freshness />
        <Products />
        <Delivery />
      </main>
      <Footer />
    </>
  );
}
