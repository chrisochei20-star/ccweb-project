/**
 * Lead generation automation — research, discovery, outreach, follow-up, tracking.
 * Demo-quality synthesis; plug CRM/email/DM providers at integration points.
 */

const crypto = require("crypto");
const { LEAD_GEN_RATES } = require("./pricing");
const { trackUsage, calculateCost, pushBillingHistory } = require("./billingEngine");
const {
  leadCampaigns,
  leadContacts,
  leadEvents,
  nextLeadCampaignId,
  nextLeadContactId,
} = require("./store");

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function slug(text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pushEvent(tenantId, campaignId, type, payload = {}) {
  leadEvents.unshift({
    id: `lev-${crypto.randomUUID().slice(0, 10)}`,
    tenantId,
    campaignId,
    type,
    payload,
    createdAt: new Date().toISOString(),
  });
  if (leadEvents.length > 500) leadEvents.pop();
}

function synthesizeResearchInsights(businessType, audience, location) {
  const loc = location || "United States";
  const bt = businessType || "Local service";
  const aud = audience || "SMB decision-makers";
  return {
    summary: `Mapped ${aud} in ${loc} for ${bt}: buying triggers include compliance deadlines, seasonal demand, and vendor consolidation.`,
    segments: [
      { label: "High intent", signals: ["recent hiring", "funding", "expansion news"], score: 86 },
      { label: "Warm", signals: ["tool evaluation content", "community questions"], score: 72 },
      { label: "Nurture", signals: ["generic site visits", "passive social follows"], score: 54 },
    ],
    dataGathered: [
      { source: "public_web", fields: ["company_size_estimate", "tech_stack_hints", "contact_page_url"] },
      { source: "maps_directories", fields: ["reviews_velocity", "category_fit"] },
    ],
  };
}

function generateSyntheticContacts(campaignId, tenantId, count, seedBases) {
  const bases = seedBases || ["Acme", "Northwind", "Globex", "Umbrella", "Stark", "Wayne", "Hooli"];
  const contacts = [];
  for (let i = 0; i < count; i += 1) {
    const id = nextLeadContactId();
    const nameBase = bases[i % bases.length];
    const contact = {
      id,
      campaignId,
      tenantId,
      company: `${nameBase} ${String.fromCharCode(65 + (i % 26))} ${i + 1}`,
      role: i % 3 === 0 ? "Owner" : i % 3 === 1 ? "Operations Lead" : "Marketing Manager",
      channelHint: i % 4 === 0 ? "linkedin_dm" : "email",
      email: `contact.${slug(nameBase)}.${i}@example.com`,
      fitScore: 58 + ((i * 7) % 40),
      status: "discovered",
      outreachSent: false,
      replied: false,
      converted: false,
      nextFollowUpAt: null,
      createdAt: new Date().toISOString(),
    };
    leadContacts.set(id, contact);
    contacts.push(contact);
    pushEvent(tenantId, campaignId, "lead_discovered", { contactId: id, company: contact.company });
  }
  trackUsage(tenantId, {
    type: "lead_qualified",
    quantity: count,
    metadata: { campaignId, phase: "discovery" },
  });
  trackUsage(tenantId, {
    type: "agent_action",
    quantity: Math.ceil(count * 2.2),
    metadata: { campaignId, phase: "discovery" },
  });
  trackUsage(tenantId, {
    type: "api_call",
    quantity: Math.ceil(count * 1.5),
    metadata: { campaignId, phase: "discovery" },
  });
  return contacts;
}

function personalizeMessage(contact, businessType, audience, location) {
  const opener = `Hi ${contact.role} at ${contact.company},`;
  const hook = `We help ${businessType || "teams"} reach ${audience || "the right buyers"} in ${location || "your market"} without manual prospecting.`;
  const cta = `Worth a 12-minute fit check this week?`;
  const channel = contact.channelHint === "linkedin_dm" ? "DM" : "Email";
  return {
    channel,
    subject: `${businessType || "Growth"} fit — ${contact.company}`,
    body: `${opener}\n\n${hook}\n\n${cta}\n\n— CCWEB Lead Automation`,
  };
}

function runOutreachPhase(campaign, contacts, tenantId) {
  let sent = 0;
  const messages = [];
  for (const c of contacts) {
    const contact = leadContacts.get(c.id);
    if (!contact || contact.outreachSent) continue;
    const msg = personalizeMessage(contact, campaign.businessType, campaign.targetAudience, campaign.location);
    contact.outreachSent = true;
    contact.status = "contacted";
    contact.lastMessagePreview = msg.body.slice(0, 120);
    contact.channelUsed = msg.channel;
    leadContacts.set(contact.id, contact);
    messages.push({ contactId: contact.id, ...msg });
    sent += 1;
    pushEvent(tenantId, campaign.id, "outreach_sent", { contactId: contact.id, channel: msg.channel });

    trackUsage(tenantId, {
      type: "outreach_action",
      quantity: 1,
      metadata: { campaignId: campaign.id, contactId: contact.id },
    });
    trackUsage(tenantId, {
      type: "api_call",
      quantity: 2,
      metadata: { campaignId: campaign.id, phase: "outreach_copy" },
    });
  }
  return { sent, messages };
}

function simulateRepliesAndConversions(contacts, tenantId, campaignId) {
  let replies = 0;
  let conversions = 0;
  for (let i = 0; i < contacts.length; i += 1) {
    const contact = leadContacts.get(contacts[i].id);
    if (!contact || !contact.outreachSent) continue;
    const replyRoll = (i * 13 + campaignId.length) % 10;
    if (replyRoll < 4) {
      contact.replied = true;
      contact.status = "replied";
      replies += 1;
      pushEvent(tenantId, campaignId, "reply_received", { contactId: contact.id });
    }
    const convRoll = (i * 17 + replyRoll) % 10;
    if (contact.replied && convRoll < 3) {
      contact.converted = true;
      contact.status = "converted";
      conversions += 1;
      pushEvent(tenantId, campaignId, "conversion", { contactId: contact.id });
    }
    leadContacts.set(contact.id, contact);
  }
  return { replies, conversions };
}

function scheduleFollowUps(contacts, tenantId, campaignId) {
  let scheduled = 0;
  const now = Date.now();
  for (let i = 0; i < contacts.length; i += 1) {
    const contact = leadContacts.get(contacts[i].id);
    if (!contact || !contact.outreachSent || contact.replied) continue;
    contact.nextFollowUpAt = new Date(now + (2 + (i % 5)) * 86400000).toISOString();
    scheduled += 1;
    pushEvent(tenantId, campaignId, "follow_up_scheduled", {
      contactId: contact.id,
      when: contact.nextFollowUpAt,
    });
    leadContacts.set(contact.id, contact);
  }
  trackUsage(tenantId, {
    type: "follow_up_scheduled",
    quantity: scheduled,
    metadata: { campaignId },
  });
  return scheduled;
}

function createLeadCampaign(body) {
  const tenantId = (body.tenantId || "default").toString().trim();
  const businessType = (body.businessType || "").toString().trim();
  const targetAudience = (body.targetAudience || "").toString().trim();
  const location = (body.location || "").toString().trim();
  if (!businessType || !targetAudience || !location) {
    return { error: "businessType, targetAudience, and location are required.", status: 400 };
  }

  const id = nextLeadCampaignId();
  const now = new Date().toISOString();
  const campaign = {
    id,
    tenantId,
    businessType,
    targetAudience,
    location,
    status: "draft",
    metrics: {
      leadsDiscovered: 0,
      contacted: 0,
      replies: 0,
      conversions: 0,
      followUpsScheduled: 0,
    },
    research: null,
    contacts: [],
    estimatedCostUsd: 0,
    createdAt: now,
    updatedAt: now,
  };
  leadCampaigns.set(id, campaign);
  pushEvent(tenantId, id, "campaign_created", { businessType, targetAudience, location });

  trackUsage(tenantId, { type: "workflow_run", quantity: 1, metadata: { campaignId: id, kind: "lead_gen" } });
  trackUsage(tenantId, { type: "pipeline_run", quantity: 1, metadata: { campaignId: id } });

  return { campaign };
}

function runLeadCampaignWorkflow(campaignId, tenantId, options = {}) {
  const campaign = leadCampaigns.get(campaignId);
  if (!campaign) {
    return { error: "Campaign not found.", status: 404 };
  }
  const tid = tenantId || campaign.tenantId;

  campaign.status = "researching";
  campaign.updatedAt = new Date().toISOString();

  trackUsage(tid, { type: "agent_action", quantity: 24, metadata: { campaignId, phase: "research" } });
  trackUsage(tid, { type: "api_call", quantity: 18, metadata: { campaignId, phase: "research" } });

  const research = synthesizeResearchInsights(campaign.businessType, campaign.targetAudience, campaign.location);
  campaign.research = research;

  campaign.status = "discovering";
  const targetCount = clampInt(options.leadCount ?? 8, 3, 40);
  const contacts = generateSyntheticContacts(campaign.id, tid, targetCount);
  campaign.contacts = contacts.map((c) => c.id);
  campaign.metrics.leadsDiscovered = contacts.length;

  campaign.status = "outreach";
  const outreach = runOutreachPhase(campaign, contacts, tid);
  campaign.metrics.contacted = outreach.sent;

  const sim = simulateRepliesAndConversions(contacts, tid, campaign.id);
  campaign.metrics.replies = sim.replies;
  campaign.metrics.conversions = sim.conversions;

  const followUps = scheduleFollowUps(contacts, tid, campaign.id);
  campaign.metrics.followUpsScheduled = followUps;

  campaign.status = "active";
  campaign.updatedAt = new Date().toISOString();

  const costSnapshot = calculateCost(tid);
  campaign.estimatedCostUsd = costSnapshot.estimatedTotalUsd;

  pushBillingHistory(tid, {
    kind: "lead_generation_run",
    campaignId: campaign.id,
    estimatedBillUsd: costSnapshot.estimatedTotalUsd,
    note: `Lead gen: ${contacts.length} leads, ${outreach.sent} outreach, ${followUps} follow-ups queued.`,
  });

  leadCampaigns.set(campaign.id, campaign);

  return {
    campaign,
    research,
    outreachPreview: outreach.messages.slice(0, 5),
    billing: {
      estimatedTotalUsd: costSnapshot.estimatedTotalUsd,
      leadGenRates: LEAD_GEN_RATES,
      breakdownNote:
        "Charges combine subscription, core automation meters, and lead-gen meters (qualified leads, outreach actions, scheduled follow-ups).",
    },
  };
}

function clampInt(n, min, max) {
  const v = Math.round(safeNumber(n, min));
  return Math.min(max, Math.max(min, v));
}

function listLeadCampaigns(tenantId) {
  const tid = tenantId || "default";
  return Array.from(leadCampaigns.values())
    .filter((c) => c.tenantId === tid)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function getLeadCampaign(campaignId) {
  return leadCampaigns.get(campaignId) || null;
}

function getContactsForCampaign(campaignId) {
  const campaign = leadCampaigns.get(campaignId);
  if (!campaign) return [];
  return campaign.contacts.map((id) => leadContacts.get(id)).filter(Boolean);
}

function getLeadEvents(tenantId, campaignId = null) {
  let list = leadEvents;
  if (campaignId) {
    list = leadEvents.filter((e) => e.campaignId === campaignId);
  } else if (tenantId) {
    list = leadEvents.filter((e) => e.tenantId === tenantId);
  }
  return list.slice(0, 100);
}

function getLeadGenDashboard(tenantId) {
  const tid = tenantId || "default";
  const campaigns = listLeadCampaigns(tid);
  const cost = calculateCost(tid);
  const totals = campaigns.reduce(
    (acc, c) => {
      acc.leads += c.metrics.leadsDiscovered;
      acc.contacted += c.metrics.contacted;
      acc.replies += c.metrics.replies;
      acc.conversions += c.metrics.conversions;
      return acc;
    },
    { leads: 0, contacted: 0, replies: 0, conversions: 0 }
  );
  return {
    tenantId: tid,
    campaigns,
    totals,
    funnel: {
      discovered: totals.leads,
      contacted: totals.contacted,
      replied: totals.replies,
      converted: totals.conversions,
      replyRate: totals.contacted ? Math.round((totals.replies / totals.contacted) * 1000) / 10 : 0,
      conversionRate: totals.contacted ? Math.round((totals.conversions / totals.contacted) * 1000) / 10 : 0,
    },
    monetization: {
      rates: LEAD_GEN_RATES,
      estimatedPeriodBillUsd: cost.estimatedTotalUsd,
      leadGenLineItems: cost.usageBreakdown?.leadGen || null,
    },
    recentEvents: getLeadEvents(tid).slice(0, 20),
  };
}

module.exports = {
  createLeadCampaign,
  runLeadCampaignWorkflow,
  listLeadCampaigns,
  getLeadCampaign,
  getContactsForCampaign,
  getLeadEvents,
  getLeadGenDashboard,
};
