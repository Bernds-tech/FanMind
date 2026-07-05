"use client";

import { useState } from "react";
import styles from "./landing-v2.module.css";

type FaqAccordionItem = {
  number: string;
  question: string;
  answer: string;
  open?: boolean;
};

type FaqAccordionProps = {
  items: FaqAccordionItem[];
  label: string;
};

export default function FaqAccordion({ items, label }: FaqAccordionProps) {
  const initialOpenIndex = Math.max(
    0,
    items.findIndex((item) => item.open),
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(initialOpenIndex);

  return (
    <div className={styles.faqList} aria-label={label}>
      {items.map((faq, index) => {
        const isOpen = activeIndex === index;
        const contentId = `landing-faq-answer-${faq.number}`;

        return (
          <article className={styles.faqItem} data-open={isOpen ? "true" : undefined} key={faq.number}>
            <h3>
              <button
                aria-controls={contentId}
                aria-expanded={isOpen}
                onClick={() => setActiveIndex(isOpen ? null : index)}
                type="button"
              >
                <span>{faq.number}</span>
                <strong>{faq.question}</strong>
                <i aria-hidden="true" />
              </button>
            </h3>
            <p hidden={!isOpen} id={contentId}>
              {faq.answer}
            </p>
          </article>
        );
      })}
    </div>
  );
}
