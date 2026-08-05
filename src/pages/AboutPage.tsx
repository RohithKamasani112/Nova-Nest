import React from "react";
import {
  ShieldCheck,
  Handshake,
  MapPinned,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { Seo } from "../components/Seo";
import { breadcrumbJsonLd } from "../utils/seo";
import { ServicesTeaserSection } from "../app/components/ServicesTeaserSection";

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

const stats = [
  { value: "500+", label: "Properties Listed" },
  { value: "1200+", label: "Happy Clients" },
  { value: "15+", label: "Cities Served" },
  { value: "10+", label: "Years Experience" },
];

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Listings",
    text: "Every property is reviewed for accuracy and transparency.",
  },
  {
    icon: Handshake,
    title: "Trusted Advisors",
    text: "Experienced professionals guiding every decision.",
  },
  {
    icon: MapPinned,
    title: "Location Intelligence",
    text: "Data-backed recommendations in high-growth corridors.",
  },
  {
    icon: Users,
    title: "End-to-End Support",
    text: "From discovery to documentation and handover.",
  },
];

const timeline = [
  "2015 - Founded",
  "2018 - 200+ Properties",
  "2021 - Multi-City Expansion",
  "2024 - 1000+ Clients",
  "2026 - Nationwide Presence",
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <main className="bg-cream text-charcoal overflow-hidden">
      <Seo
        title="About Nova Nest | Trusted Property Advisors in Bengaluru"
        description="Nova Nest Property Management offers premium rental and sales advisory in Whitefield and across Bengaluru — verified listings, trusted advisors and end-to-end support."
        path="/about"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <section className="relative min-h-[680px] flex items-center justify-center md:min-h-screen">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=2000&q=90"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Modern residential apartment building representing Nova Nest property listings in Bengaluru"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/65" />

        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
          className="absolute w-96 h-96 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative max-w-6xl mx-auto px-6 text-center text-white">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="uppercase tracking-[0.22em] text-accent mb-6 text-xs sm:text-sm sm:tracking-[0.35em]"
          >
            Nova Nest Property Management
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold"
          >
            Your Trusted Path
            <span className="block text-accent">To Home</span>
          </motion.h1>

          <p className="max-w-3xl mx-auto mt-6 text-base text-white/80 sm:mt-8 sm:text-lg">
            Premium rental and sales advisory in Whitefield, Bengaluru, with
            verified properties, trusted advisors, and responsive support.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <button
              onClick={() => onNavigate("properties")}
              className="gold-gradient px-8 py-4 rounded-xl text-charcoal font-semibold"
            >
              Browse Properties
            </button>

            <button className="border border-white/20 px-8 py-4 rounded-xl backdrop-blur">
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-5 border-y">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-sm font-medium">
          <span>Verified Properties</span>
          <span>Legal Verification</span>
          <span>Transparent Pricing</span>
          <span>Dedicated Advisors</span>
          <span>Whitefield, Bengaluru</span>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.img
            whileHover={{ scale: 1.02 }}
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=90"
            className="rounded-2xl shadow-subtle sm:rounded-3xl"
          />

          <div>
            <p className="text-gold uppercase tracking-[0.25em] mb-4">
              Our Story
            </p>

            <h2 className="font-serif text-3xl font-bold mb-6 sm:text-5xl sm:mb-8">
              We Simplify Property Decisions
            </h2>

            <div className="space-y-5">
              {[
                "Verified Opportunities",
                "Market Expertise",
                "Investment Intelligence",
                "End-to-End Support",
              ].map((item) => (
                <motion.div
                  key={item}
                  whileHover={{ x: 8 }}
                  className="premium-card p-5"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-charcoal text-white py-14 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -8 }}
              className="premium-card p-6 text-center sm:p-10"
            >
              <div className="text-5xl font-serif font-bold text-gold">
                {stat.value}
              </div>
              <div className="mt-3 text-white/70">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-24">
        <div className="text-center mb-10 sm:mb-16">
          <p className="text-gold uppercase tracking-[0.25em] mb-3">
            Why Choose Us
          </p>
          <h2 className="font-serif text-3xl font-bold sm:text-5xl">
            Trust Designed Into Every Step
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                whileHover={{ y: -10 }}
                className="premium-card p-8"
              >
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mb-5">
                  <Icon className="text-gold" />
                </div>

                <h3 className="font-serif text-xl font-bold mb-3">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground">{feature.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <ServicesTeaserSection onNavigate={onNavigate} />

      <section className="bg-white py-14 sm:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-serif text-3xl text-center font-bold mb-10 sm:text-5xl sm:mb-16">
            Our Journey
          </h2>

          <div className="space-y-8">
            {timeline.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 sm:gap-5"
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gold text-charcoal font-bold flex items-center justify-center sm:h-12 sm:w-12">
                  {index + 1}
                </div>
                <div className="premium-card p-5 flex-1">{item}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14 sm:px-6 sm:py-24">
        <div className="text-center mb-14">
          <h2 className="font-serif text-3xl font-bold sm:text-5xl">
            Client Testimonials
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="premium-card p-8">
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} className="text-gold fill-current" />
                ))}
              </div>

              <p className="text-muted-foreground mb-6">
                Professional guidance, transparent process and exceptional
                support throughout the property journey.
              </p>

              <div className="font-semibold">Client {item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-emerald text-cream py-14 relative overflow-hidden sm:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <Award className="mx-auto mb-6 text-gold" size={48} />

          <h2 className="font-serif text-3xl font-bold mb-6 sm:text-5xl">
            Ready To Find Your Next Property?
          </h2>

          <p className="text-xl text-cream/80 mb-10">
            Explore verified opportunities with confidence.
          </p>

          <button
            onClick={() => onNavigate("properties")}
            className="gold-gradient text-charcoal px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2"
          >
            Browse Listings
            <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </main>
  );
};

export default AboutPage;
