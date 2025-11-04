'use client'
import Hero from "../sections/Hero";
import Nav from "../sections/Nav";
import Footer from "../sections/Footer";
import HowItWorks from "../sections/HowItWorks";
import Benefits from "../sections/Benefits";
import CTA from "../sections/CTA";
import FeaturedSection from "../sections/FeaturedSection";





const LandingPage = () => {


    return (
        <div>
            <Nav />
            <Hero />
            <HowItWorks />
            <FeaturedSection />
            <Benefits />
            <CTA />
            <Footer />
        </div>
    )
};

export default LandingPage;
