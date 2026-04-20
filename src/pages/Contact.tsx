import { useState, type FormEvent } from "react";
import { Check, Mail, MessageSquare, Send } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [values, setValues] = useState({
    name: "",
    email: "",
    topic: "general",
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 700));
    setStatus("sent");
  };

  return (
    <div className="container-page py-16">
      <SectionHeading
        eyebrow="Contact"
        title="Talk to a human"
        description="Questions about courses, scholarships, or team plans? We respond within one business day."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="card-surface">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              hello@chaincraft.dev
            </p>
          </div>
          <div className="card-surface">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Community</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Join our Discord for real-time discussion with learners and
              instructors.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-surface space-y-4 lg:col-span-2"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name"
              id="name"
              value={values.name}
              onChange={(v) => setValues((s) => ({ ...s, name: v }))}
              required
            />
            <Field
              label="Email"
              id="email"
              type="email"
              value={values.email}
              onChange={(v) => setValues((s) => ({ ...s, email: v }))}
              required
            />
          </div>

          <div>
            <label htmlFor="topic" className="text-sm font-medium">
              Topic
            </label>
            <select
              id="topic"
              value={values.topic}
              onChange={(e) =>
                setValues((s) => ({ ...s, topic: e.target.value }))
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="general">General question</option>
              <option value="courses">Courses & cohorts</option>
              <option value="scholarship">Scholarship</option>
              <option value="teams">Team plans</option>
              <option value="partnership">Partnerships</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <textarea
              id="message"
              value={values.message}
              onChange={(e) =>
                setValues((s) => ({ ...s, message: e.target.value }))
              }
              rows={6}
              required
              className="mt-2 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn-primary"
          >
            {status === "sent" ? (
              <>
                <Check className="h-4 w-4" />
                Message sent
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {status === "submitting" ? "Sending…" : "Send message"}
              </>
            )}
          </button>

          {status === "sent" && (
            <p className="text-sm text-secondary">
              Thanks! We'll be in touch shortly.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-2 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
