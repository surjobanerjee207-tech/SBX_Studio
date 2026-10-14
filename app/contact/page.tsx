import { ContactForm } from "@/components/ContactForm";

export const metadata = { title: "Contact | SBX_Studio" };

export default function ContactPage() {
  return (
    <section className="pt-32 pb-20">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl">
          Have a Story Worth Telling?
        </h1>
        <p className="text-mute my-6 text-base md:text-lg max-w-xl">
          Let&apos;s turn your ideas and footage into something worth watching.
        </p>
        <ContactForm />
      </div>
    </section>
  );
}
