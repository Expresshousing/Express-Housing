import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import FAQSections from "@/components/ui/faq-sections";
import { useTheme } from "@/context/ThemeContext";
import { pageStyle } from "@/lib/designSystem";

const FAQ_CATEGORIES = [
  {
    label: "Booking",
    items: [
      {
        question: "What homes can I book with Express Housing?",
        answer: "Our current Philadelphia collection includes furnished one- and two-bedroom homes at Broad + Noble, The Hannah, Edgewater II, and 1500 Locust. New cities and partner buildings can be added as the portfolio grows.",
      },
      {
        question: "How do I check availability?",
        answer: "Choose a building, enter your check-in and check-out dates, and select the number of guests. The apartment page will show the stay details and the next booking step for those dates.",
      },
      {
        question: "Is an exact unit assigned as soon as I choose a building?",
        answer: "No. You first choose the building and apartment type. Express Housing confirms the exact unit after reviewing availability, payment status, and readiness. The assigned unit number then appears in your private arrival page.",
      },
      {
        question: "Who are Express Housing stays designed for?",
        answer: "The homes support business travel, medical visits, family and relocation stays, and extended living. The same guided booking and arrival experience applies to every stay path.",
      },
    ],
  },
  {
    label: "Pricing",
    items: [
      {
        question: "What will I see before I pay?",
        answer: "You can review the selected building and home type, dates, guest count, rate, cleaning fee, taxes, parking if requested, cancellation terms, and the total amount due before payment.",
      },
      {
        question: "What are the current monthly rates?",
        answer: "The current portfolio starts at $3,000 per month for a one-bedroom and $3,500 per month for a two-bedroom. Your date-specific quote is the final source of truth because taxes, cleaning, parking, and stay length can change the total.",
      },
      {
        question: "How much does parking cost?",
        answer: "Monthly parking is $300 when available. Shorter-stay parking, garage access, and vehicle instructions are confirmed separately for the selected building and dates.",
      },
      {
        question: "What is the cancellation policy?",
        answer: "The applicable cancellation terms are shown with the final quote before payment. Review those terms carefully, because they may depend on the stay length, rate, and booking source.",
      },
    ],
  },
  {
    label: "Arrival & access",
    items: [
      {
        question: "When will I receive my unit number and entry instructions?",
        answer: "Private arrival details are released after the reservation is confirmed, payment requirements are met, an exact unit is assigned, and the home passes its readiness check. You will see them in your account and arrival communications.",
      },
      {
        question: "How does Door access work?",
        answer: "If your building uses Door, your arrival page provides the correct sign-in or invitation link and the scheduled access window. Access is limited to the approved reservation dates and times.",
      },
      {
        question: "What if the building uses a concierge or physical key?",
        answer: "Your private arrival page will explain the exact handoff, including where to go, what identification may be required, and whether you need to collect anything from the concierge.",
      },
      {
        question: "Where can I find Wi-Fi, parking, and checkout instructions?",
        answer: "Those details are kept together in the private arrival page for the confirmed stay. They are not displayed publicly or before the reservation is ready.",
      },
    ],
  },
  {
    label: "Homes & support",
    items: [
      {
        question: "Are the listing photos of the exact apartment?",
        answer: "The site uses authorized official building, amenity, and model-home imagery. The exact layout, view, finishes, and unit number are confirmed for the assigned home before arrival.",
      },
      {
        question: "Which amenities are included?",
        answer: "Amenities vary by building. Each apartment page lists verified building amenities and links to the official source so you can review what is available before booking.",
      },
      {
        question: "Do I need an account?",
        answer: "Yes. Your account keeps stay requests, payment status, saved homes, and private arrival details in one protected place. You can sign in or create an account from the header without leaving the page you are viewing.",
      },
      {
        question: "How do I get help with a stay?",
        answer: "Use the Contact page to send your dates, building, stay length, and question. The Express Housing team can help with booking, access, parking, or a home that is not currently shown.",
      },
    ],
  },
];

export default function FaqPage() {
  const { colors: c } = useTheme();

  return (
    <div style={pageStyle(c)}>
      <div className="eh-container">
        <FAQSections
          categories={FAQ_CATEGORIES}
          imageSrc="/images/buildings/broad-and-noble/model-living.webp"
          imageAlt="Furnished apartment kitchen and living room at Broad and Noble"
          description="From choosing a home to opening the door, here is what to expect before, during, and after your Express Housing reservation."
        />

        <section className="mb-20 overflow-hidden rounded-[22px] text-white md:mb-28" style={{ background: "#171717" }} aria-labelledby="faq-support-heading">
          <div className="grid md:grid-cols-[1fr_auto] md:items-end"><div className="p-8 md:p-12"><div className="flex items-center gap-3"><MessageCircleQuestion size={20} color="#6597FF" /><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">Personal support</p></div><h2 id="faq-support-heading" className="mt-6 text-[38px] font-extrabold leading-[0.96] tracking-[-0.04em] md:text-[54px]">Still need a clear answer?</h2><p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-white/55">Share the building, dates, guest count, and what you need. The Express Housing team will help identify the clearest next step.</p></div><div className="p-8 pt-0 md:p-12"><Link to="/contact" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-6 text-[13px] font-bold text-white" style={{ background: c.BLUE }}>Contact the team <ArrowRight size={17} /></Link></div></div>
        </section>
      </div>
    </div>
  );
}
