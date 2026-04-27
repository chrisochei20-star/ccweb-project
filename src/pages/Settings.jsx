import { useState } from "react";
import { User, Bell, Shield, CreditCard, Palette, Save, ChevronRight, CircleCheck as CheckCircle, Zap } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input, { Select } from "../components/ui/Input";
import Toggle from "../components/ui/Toggle";
import Badge from "../components/ui/Badge";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "appearance", label: "Appearance", icon: Palette },
];

function ProfileSection() {
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">Profile Information</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-white/[0.05]">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan/30 to-blue-500/30 border border-brand-cyan/20 flex items-center justify-center">
                <User size={24} className="text-brand-cyan" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Demo User</p>
              <p className="text-xs text-slate-500">demo@ccweb.io</p>
              <Badge variant="cyan" className="mt-1">Pro Plan</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" defaultValue="Demo" />
            <Input label="Last Name" defaultValue="User" />
          </div>
          <Input label="Email" type="email" defaultValue="demo@ccweb.io" />
          <Input label="Display Name" defaultValue="Demo User" />
          <Select label="Timezone">
            <option>UTC (GMT+0)</option>
            <option>Eastern (GMT-5)</option>
            <option>Pacific (GMT-8)</option>
          </Select>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="primary" leftIcon={saved ? <CheckCircle size={14} /> : <Save size={14} />} onClick={save}>
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    sessionStart: true,
    revenueUpdate: true,
    newFollower: false,
    courseCompletion: true,
    systemAlerts: true,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
        </CardHeader>
        <CardBody className="space-y-0 p-0">
          {Object.entries(prefs).map(([ key, value ], i) => (
            <div key={key} className={`flex items-center justify-between px-5 py-3 ${i < Object.entries(prefs).length - 1 ? "border-b border-white/[0.04]" : ""}`}>
              <div>
                <p className="text-sm text-slate-200 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              </div>
              <Toggle checked={value} onChange={() => toggle(key)} />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">Password</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
          <Button variant="primary" leftIcon={<Shield size={14} />}>Update Password</Button>
        </CardBody>
      </Card>
    </div>
  );
}

function BillingSection() {
  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">Current Plan</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-brand-cyan/5 to-blue-500/5 border border-brand-cyan/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                <Zap size={18} className="text-brand-cyan" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Pro Plan</p>
                <p className="text-xs text-slate-500">$10/month</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  return (
    <div className="space-y-5 animate-fade-in">
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">Theme</h3>
        </CardHeader>
        <CardBody>
          <Toggle checked={true} onChange={() => {}} label="Dark Mode (Enabled)" />
        </CardBody>
      </Card>
    </div>
  );
}

export default function Settings({ darkMode, onToggleDark }) {
  const [activeSection, setActiveSection] = useState("profile");

  const sectionComponent = {
    profile: <ProfileSection />,
    notifications: <NotificationsSection />,
    security: <SecuritySection />,
    billing: <BillingSection />,
    appearance: <AppearanceSection />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-0.5">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${activeSection === section.id
                    ? "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/15"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
              >
                <section.icon size={16} />
                {section.label}
                <ChevronRight size={14} className={`ml-auto transition-transform ${activeSection === section.id ? "text-brand-cyan" : "text-slate-600"}`} />
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {sectionComponent[activeSection]}
        </div>
      </div>
    </div>
  );
}
