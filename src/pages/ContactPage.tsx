import React, { useState, useEffect, useRef } from 'react';
import { Clock, Mail, MapPin, Phone, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, useInView, useMotionValue, animate } from 'motion/react';
import { createLead } from '../services/storageService';
import { Inquiry } from '../types';

const address = 'Ground Floor, Site No-29 & 30, Maheshwaramma Temple Road, 1st Main Rd, Maheswari Nagar, Mahadevapura, Bengaluru, Karnataka 560048';
const mapsUrl = import.meta.env.VITE_GOOGLE_MAPS_URL || 'https://maps.app.goo.gl/V5dSTjfNRgDUWTmEA';
const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
const email = import.meta.env.VITE_CONTACT_EMAIL || 'novanestpropertymanagement@gmail.com';

/* Animated counter */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, to, { duration: 1.8, ease: 'easeOut' });
    const unsub = count.on('change', (v) => {
      if (ref.current) ref.current.textContent = Math.round(v) + suffix;
    });
    return () => { controls.stop(); unsub(); };
  }, [inView]);

  return <span ref={ref}>0{suffix}</span>;
}

const stats = [
  { value: 500, suffix: '+', label: 'Happy Families' },
  { value: 12, suffix: '+', label: 'Years Experience' },
  { value: 1200, suffix: '+', label: 'Properties Listed' },
  { value: 98, suffix: '%', label: 'Client Satisfaction' },
];

const infoCards = [
  {
    icon: MapPin,
    title: 'Visit Our Office',
    content: address,
    action: { label: 'Get Directions', href: mapsUrl },
    color: '#2E4636',
    delay: 0,
  },
  {
    icon: Phone,
    title: "Let's Talk",
    content: '+91 98454 18570 / +91 96637 95675',
    action: { label: 'Call Now', href: 'tel:+919845418570' },
    color: '#2E4636',
    delay: 0.1,
  },
  {
    icon: Mail,
    title: 'Email Us',
    content: email,
    action: { label: 'Send Email', href: `mailto:${email}` },
    color: '#2E4636',
    delay: 0.2,
  },
  {
    icon: Clock,
    title: 'Working Hours',
    content: 'Mon - Sat\n10:00 AM - 7:00 PM',
    color: '#2E4636',
    delay: 0.3,
  },
];

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [focused, setFocused] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'status'> = {
        propertyId: 'general',
        userId: 'guest',
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        type: 'request-info',
      };

      await createLead(inquiryData);
      setSubmitted(true);
      toast.success('Thanks for reaching out. Our team will contact you shortly.');
      setTimeout(() => {
        setSubmitted(false);
        setForm({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    } catch (error) {
      toast.error('Failed to submit enquiry. Please try again.');
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Rahul Sharma' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'rahul@example.com' },
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
  ];

  return (
    <main className="bg-surface text-text-primary" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Hero */}
      <section className="relative min-h-[380px] flex items-center justify-center overflow-hidden sm:min-h-[420px]">
        <img
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920&q=85"
          alt="Office"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-charcoal/70 to-charcoal/90" />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 left-[10%] w-64 h-64 rounded-full bg-gold/20 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 18, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-8 right-[8%] w-80 h-80 rounded-full bg-gold/10 blur-3xl pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center px-4"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-accent text-xs font-bold uppercase tracking-[0.22em] mb-4"
          >
            We'd love to hear from you
          </motion.p>
          <h1 className="text-white text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-none mb-5">
            Contact <span className="text-accent">Us</span>
          </h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-16 h-0.5 bg-accent mx-auto mb-6"
          />
          <p className="text-white/60 text-[15px] max-w-md mx-auto">
            Our team of property experts is ready to guide you every step of the way.
          </p>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section className="bg-[#15211A] py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
          {stats.map(({ value, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-center"
            >
              <p className="text-accent text-2xl font-extrabold tracking-tight sm:text-3xl">
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-white/50 text-[12px] font-medium mt-1 uppercase tracking-wider">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {infoCards.map(({ icon: Icon, title, content, action, color, delay }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(0,0,0,0.12)' }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay }}
              className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] cursor-default sm:p-6"
            >
              {/* Icon circle with color */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: color + '18', color }}
              >
                <Icon size={22} />
              </div>
              <h3 className="text-[14px] font-bold text-[#1a1a1a] mb-2">{title}</h3>
              <p className="text-[13px] text-[#888] leading-relaxed whitespace-pre-line mb-4">{content}</p>
              {action && (
                <a
                  href={action.href}
                  target={action.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-all group/link"
                  style={{ color }}
                >
                  {action.label}
                  <ArrowRight size={13} className="transition-transform group-hover/link:translate-x-1" />
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-5 shadow-[0_4px_32px_rgba(0,0,0,0.08)] sm:p-8"
          >
            <p className="text-gold text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Get in Touch</p>
            <h2 className="text-[28px] font-bold text-[#1a1a1a] tracking-tight mb-1">Send a Message</h2>
            <p className="text-[13px] text-[#aaa] mb-8">Fill the form and we'll get back within 24 hours.</p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <CheckCircle2 size={56} className="text-gold mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Message Sent!</h3>
                <p className="text-[13px] text-[#aaa]">Our team will reach out to you shortly.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                {fields.map(({ key, label, type, placeholder }) => (
                  <div key={key} className="relative">
                    <label className="block text-[12px] font-semibold text-[#555] mb-1.5 uppercase tracking-wide">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type={type}
                        required={key !== 'email'}
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onFocus={() => setFocused(key)}
                        onBlur={() => setFocused(null)}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="w-full rounded-xl border-2 bg-[#fafafa] px-4 py-3 text-[14px] text-[#1a1a1a] placeholder-[#ccc] outline-none transition-all duration-200"
                        style={{
                          borderColor: focused === key ? '#2E4636' : '#ebebeb',
                          boxShadow: focused === key ? '0 0 0 4px rgba(201,146,42,0.12)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-[12px] font-semibold text-[#555] mb-1.5 uppercase tracking-wide">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you're looking for..."
                    value={form.message}
                    onFocus={() => setFocused('message')}
                    onBlur={() => setFocused(null)}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl border-2 bg-[#fafafa] px-4 py-3 text-[14px] text-[#1a1a1a] placeholder-[#ccc] outline-none resize-none transition-all duration-200"
                    style={{
                      borderColor: focused === 'message' ? '#2E4636' : '#ebebeb',
                      boxShadow: focused === 'message' ? '0 0 0 4px rgba(201,146,42,0.12)' : 'none',
                    }}
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-xl bg-[#15211A] text-accent text-[14px] font-bold tracking-wide flex items-center justify-center gap-2.5 hover:bg-[#233A2C] transition-colors"
                >
                  <Send size={16} />
                  Submit Enquiry
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.08)] min-h-[340px] relative sm:min-h-[480px]"
          >
            <iframe
              title="Nova Nest Property Management office map"
              src={mapEmbedUrl}
              className="w-full h-full min-h-[340px] border-0 sm:min-h-[480px]"
              loading="lazy"
              allowFullScreen
            />
            {/* Map */}
            <div className="absolute top-4 left-4 bg-white rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2">
              <MapPin size={15} className="text-gold" />
              <span className="text-[12px] font-bold text-[#1a1a1a]">Nova Nest Office</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA strip */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-[#15211A] py-16 text-center relative overflow-hidden"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full border border-gold/10 pointer-events-none"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full border border-gold/8 pointer-events-none"
        />
        <div className="relative">
          <p className="text-accent text-[11px] font-bold uppercase tracking-[0.22em] mb-3">Ready to find your dream home?</p>
          <h2 className="text-white text-2xl md:text-4xl font-bold mb-6 tracking-tight">
            Let's Start the Journey Together
          </h2>
          <motion.a
            href="tel:+919845418570"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 bg-accent text-[#15211A] px-8 py-3.5 rounded-xl text-[14px] font-bold hover:brightness-105 transition-all"
          >
            <Phone size={16} />
            Call Us Now
          </motion.a>
        </div>
      </motion.section>
    </main>
  );
};
