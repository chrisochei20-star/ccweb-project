import { useState } from "react";
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@ccweb.io",
    description: "We'll respond within 24 hours",
  },
  {
    icon: MessageCircle,
    label: "Discord",
    value: "discord.gg/ccweb",
    description: "Join our community server",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Global & Remote",
    description: "We're a distributed team",
  },
  {
    icon: Clock,
    label: "Support Hours",
    value: "24/7 Community",
    description: "Mon-Fri for direct support",
  },
];

const faqItems = [
  {
    question: "Are courses free to start?",
    answer:
      "Yes! We offer free introductory courses in Web3, Crypto, and AI. Premium courses with certificates require a subscription.",
  },
  {
    question: "Do I need coding experience?",
    answer:
      "Not for our beginner courses. We have tracks for all skill levels, from complete beginners to experienced developers.",
  },
  {
    question: "How do on-chain certificates work?",
    answer:
      "Upon completing a course, you receive a verifiable NFT certificate on the blockchain that proves your achievement to employers.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Yes, we offer a 30-day money-back guarantee on all premium subscriptions. No questions asked.",
  },
  {
    question: "Do you offer enterprise training?",
    answer:
      "Absolutely! We work with companies to create custom training programs. Contact us for details.",
  },
];

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="py-12 md:py-20">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Mail className="w-3 h-3 mr-1" />
            Get in Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Contact <span className="gradient-text">Us</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have a question, suggestion, or want to partner with us? We'd love
            to hear from you. Reach out and we'll get back to you soon.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {contactInfo.map((info) => (
            <Card
              key={info.label}
              className="bg-card/50 hover:border-primary/30 transition-all"
            >
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-3">
                  <info.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{info.label}</h3>
                <p className="text-sm font-medium text-primary mb-1">
                  {info.value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {info.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Send Us a <span className="gradient-text">Message</span>
            </h2>

            {submitted ? (
              <Card className="bg-card/50 border-emerald-500/30">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-4">
                    Thank you for reaching out. We'll get back to you within 24
                    hours.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Name
                    </label>
                    <Input
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Subject
                  </label>
                  <Input
                    placeholder="What's this about?"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Message
                  </label>
                  <Textarea
                    placeholder="Tell us more..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    required
                  />
                </div>
                <Button variant="gradient" size="lg" type="submit" className="w-full">
                  Send Message
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold mb-6">
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq) => (
                <Card
                  key={faq.question}
                  className="bg-card/50 hover:border-primary/30 transition-all"
                >
                  <CardContent className="pt-5 pb-5">
                    <h3 className="font-semibold text-sm mb-2 flex items-start gap-2">
                      <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {faq.question}
                    </h3>
                    <p className="text-sm text-muted-foreground pl-6">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
