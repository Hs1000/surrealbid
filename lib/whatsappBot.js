// WhatsApp conversation engine: "Continue with WhatsApp" sign-in codes and the artist application bot.
// The bot asks fixed questions one at a time; answers can be text or (for open questions) voice notes.
const config = require("./config");
const User = require("../models/User");
const Artist = require("../models/Artist");
const WhatsAppSession = require("../models/WhatsAppSession");
const WhatsAppLogin = require("../models/WhatsAppLogin");
const { sendText, downloadMedia } = require("./whatsapp");
const { saveImageBuffer, saveAudioBuffer } = require("./uploads");
const { randomId } = require("./tokens");
const { emails } = require("./mailer");

const MAX_PHOTOS = 5;
const STYLES = ["surrealism", "abstract", "expressionism", "fantasy", "dark-art", "psychedelic", "symbolism", "dreamlike", "other"];
const EXPERIENCE = ["beginner", "intermediate", "experienced", "professional", "master"];

// ---------------- MESSAGES (English / Hindi) ----------------
const T = {
  en: {
    chooseLang: "Welcome to *SurrealBid* 🎨\nWe help artists sell original work to collectors across India.\n\nReply *1* for English\nजवाब दें *2* हिंदी के लिए",
    askName: (suggest) => `Let's get your artist application started. It takes about 5 minutes.\n\nWhat is your *full name*?${suggest ? `\n\nReply *1* to use "${suggest}".` : ""}`,
    askCity: "Which *city or town* do you work in?",
    askMedium: "What do you *make*? For example: paintings, murals, sculpture, pottery, prints, wood carving.\n\nYou can type it or send a 🎤 voice note.",
    askStyles: (list) => `Which *styles* describe your work? Reply with one or more numbers, like *1,4*.\n\n${list}`,
    askExperience: "How long have you been making art?\n\n*1* Less than 2 years\n*2* 3–5 years\n*3* 6–10 years\n*4* More than 10 years\n*5* More than 20 years",
    askStory: "Tell us about your work: what you make, what inspires you, who taught you, and where people can see it.\n\n🎤 A *voice note* is perfect (1–2 minutes), in any language. You can also type.",
    askPhotos: `Now send *photos of your artwork* (1–${MAX_PHOTOS}). Take them in daylight, straight on, with the whole piece visible.\n\nWhen you've sent them all, reply *DONE*.`,
    photoSaved: (n) => `📷 Photo ${n} saved.${n < MAX_PHOTOS ? " Send another, or reply *DONE*." : " That's the maximum. Reply *DONE*."}`,
    needPhoto: "Please send at least one photo of your work first.",
    askConsent: "Last step. Please reply *YES* to confirm:\n\n• You made all the artwork you will sell on SurrealBid.\n• You agree that we may check your identity before approving you.",
    summary: (a, photos, voice) => `Here's your application:\n\n*Name:* ${a.name}\n*City:* ${a.city}\n*Makes:* ${a.medium}\n*Styles:* ${a.styles.join(", ")}\n*Experience:* ${a.experienceLabel}\n*About you:* ${a.storyPreview}\n*Photos:* ${photos}\n*Voice notes:* ${voice}\n\nReply *1* to submit, or *2* to start again.`,
    submitted: (link) => `✅ Application submitted!\n\nOur team reviews every application by hand, usually within a few days. We'll message you here with the decision.${link ? `\n\nYou can also follow it on the website: ${link}` : ""}`,
    pending: "Your application is *under review*. We'll message you here as soon as there's a decision. 🙏",
    approved: (link) => `🎉 You're an approved SurrealBid artist! List your work on the website${link ? `: ${link}` : "."}`,
    invalidChoice: "Sorry, I didn't understand. Please reply with one of the numbers shown.",
    typeInstead: "Please *type* this answer (voice notes work for the questions about your work).",
    tooShort: "That's a little short. Please tell us a bit more.",
    voiceSaved: "🎤 Got your voice note, thank you.",
    mediaFailed: "Sorry, I couldn't save that file. Please try sending it again.",
    help: "Commands:\n*RESTART* start your application again\n*STATUS* check your application\n*HELP* show this message",
    restarted: "Starting over.",
    loginOk: "✅ You're signed in. Go back to the SurrealBid website to continue.",
    linkOk: "✅ WhatsApp is now linked to your SurrealBid account.",
    loginBad: "That sign-in code has expired or is invalid. Please request a new one on the website.",
    phoneTaken: "This WhatsApp number is already linked to another SurrealBid account.",
    unsupported: "I can read text, voice notes and photos. Please send one of those.",
  },
  hi: {
    chooseLang: "",
    askName: (suggest) => `चलिए आपका कलाकार आवेदन शुरू करते हैं। इसमें लगभग 5 मिनट लगेंगे।\n\nआपका *पूरा नाम* क्या है?${suggest ? `\n\n"${suggest}" इस्तेमाल करने के लिए *1* भेजें।` : ""}`,
    askCity: "आप किस *शहर या कस्बे* में काम करते हैं?",
    askMedium: "आप क्या *बनाते* हैं? जैसे: पेंटिंग, दीवार चित्र, मूर्ति, मिट्टी के बर्तन, प्रिंट, लकड़ी की नक्काशी।\n\nआप लिखकर या 🎤 वॉइस नोट भेजकर बता सकते हैं।",
    askStyles: (list) => `आपके काम की *शैली* कौन सी है? एक या ज़्यादा नंबर भेजें, जैसे *1,4*।\n\n${list}`,
    askExperience: "आप कितने समय से कला बना रहे हैं?\n\n*1* 2 साल से कम\n*2* 3–5 साल\n*3* 6–10 साल\n*4* 10 साल से ज़्यादा\n*5* 20 साल से ज़्यादा",
    askStory: "अपने काम के बारे में बताइए: आप क्या बनाते हैं, आपको प्रेरणा कहाँ से मिलती है, आपने किससे सीखा, और लोग आपका काम कहाँ देख सकते हैं।\n\n🎤 *वॉइस नोट* सबसे अच्छा है (1–2 मिनट), किसी भी भाषा में। आप लिख भी सकते हैं।",
    askPhotos: `अब अपनी *कलाकृतियों की फ़ोटो* भेजें (1–${MAX_PHOTOS})। दिन की रोशनी में, सामने से, पूरी कलाकृति दिखाते हुए फ़ोटो लें।\n\nसब फ़ोटो भेजने के बाद *DONE* लिखें।`,
    photoSaved: (n) => `📷 फ़ोटो ${n} सेव हो गई।${n < MAX_PHOTOS ? " एक और भेजें, या *DONE* लिखें।" : " यह अधिकतम संख्या है। *DONE* लिखें।"}`,
    needPhoto: "कृपया पहले अपने काम की कम से कम एक फ़ोटो भेजें।",
    askConsent: "आख़िरी कदम। पुष्टि के लिए *YES* लिखें:\n\n• SurrealBid पर बेची जाने वाली सारी कलाकृतियाँ आपने खुद बनाई हैं।\n• आप सहमत हैं कि मंज़ूरी से पहले हम आपकी पहचान जाँच सकते हैं।",
    summary: (a, photos, voice) => `आपका आवेदन:\n\n*नाम:* ${a.name}\n*शहर:* ${a.city}\n*काम:* ${a.medium}\n*शैली:* ${a.styles.join(", ")}\n*अनुभव:* ${a.experienceLabel}\n*आपके बारे में:* ${a.storyPreview}\n*फ़ोटो:* ${photos}\n*वॉइस नोट:* ${voice}\n\nजमा करने के लिए *1* भेजें, या फिर से शुरू करने के लिए *2*।`,
    submitted: (link) => `✅ आवेदन जमा हो गया!\n\nहमारी टीम हर आवेदन खुद देखती है, आमतौर पर कुछ दिनों में। फ़ैसला हम आपको यहीं बताएँगे।${link ? `\n\nआप वेबसाइट पर भी देख सकते हैं: ${link}` : ""}`,
    pending: "आपका आवेदन *जाँच में* है। फ़ैसला होते ही हम आपको यहीं संदेश भेजेंगे। 🙏",
    approved: (link) => `🎉 आप SurrealBid के मान्य कलाकार हैं! अपना काम वेबसाइट पर लिस्ट करें${link ? `: ${link}` : "।"}`,
    invalidChoice: "माफ़ कीजिए, समझ नहीं आया। कृपया दिखाए गए नंबरों में से एक भेजें।",
    typeInstead: "कृपया यह जवाब *लिखकर* भेजें (काम के बारे में सवालों के लिए वॉइस नोट चलेगा)।",
    tooShort: "यह थोड़ा छोटा है। कृपया थोड़ा और बताइए।",
    voiceSaved: "🎤 आपका वॉइस नोट मिल गया, धन्यवाद।",
    mediaFailed: "माफ़ कीजिए, यह फ़ाइल सेव नहीं हो पाई। कृपया दोबारा भेजें।",
    help: "कमांड:\n*RESTART* आवेदन फिर से शुरू करें\n*STATUS* आवेदन की स्थिति देखें\n*HELP* यह संदेश दिखाएँ",
    restarted: "फिर से शुरू करते हैं।",
    loginOk: "✅ आप साइन इन हो गए हैं। आगे बढ़ने के लिए SurrealBid वेबसाइट पर वापस जाएँ।",
    linkOk: "✅ WhatsApp आपके SurrealBid खाते से जुड़ गया है।",
    loginBad: "यह साइन-इन कोड पुराना या गलत है। कृपया वेबसाइट पर नया कोड लें।",
    phoneTaken: "यह WhatsApp नंबर पहले से किसी दूसरे SurrealBid खाते से जुड़ा है।",
    unsupported: "मैं टेक्स्ट, वॉइस नोट और फ़ोटो पढ़ सकता हूँ। कृपया इनमें से कुछ भेजें।",
  },
};

const STYLE_LABELS = {
  en: ["Surrealism", "Abstract", "Expressionism", "Fantasy", "Dark art", "Psychedelic", "Symbolism", "Dreamlike", "Something else"],
  hi: ["अतियथार्थवाद (Surrealism)", "अमूर्त (Abstract)", "अभिव्यंजनावाद (Expressionism)", "कल्पना (Fantasy)", "डार्क आर्ट", "साइकेडेलिक", "प्रतीकवाद (Symbolism)", "स्वप्निल (Dreamlike)", "कुछ और"],
};
const EXPERIENCE_LABELS = {
  en: ["Less than 2 years", "3–5 years", "6–10 years", "More than 10 years", "More than 20 years"],
  hi: ["2 साल से कम", "3–5 साल", "6–10 साल", "10 साल से ज़्यादा", "20 साल से ज़्यादा"],
};

const siteLink = (path) => (config.appUrl ? `${config.appUrl}${path}` : "");
const styleList = (lang) => STYLE_LABELS[lang].map((label, i) => `*${i + 1}* ${label}`).join("\n");
const isCommand = (text, words) => words.includes(text.trim().toLowerCase());

// ---------------- SIGN-IN CODES ----------------
async function handleLoginCode(phone, profileName, code) {
  const login = await WhatsAppLogin.findOne({ code, status: "pending", expiresAt: { $gt: new Date() } });
  const lang = (await WhatsAppSession.findOne({ phone }, { lang: 1 }))?.lang || "en";
  if (!login) return sendText(phone, T[lang].loginBad);

  let user;
  if (login.linkUserId) {
    // A signed-in website user is adding WhatsApp to their account.
    const owner = await User.findOne({ phone });
    if (owner && String(owner._id) !== String(login.linkUserId)) {
      await WhatsAppLogin.updateOne({ _id: login._id }, { $set: { status: "verified", error: "phone_taken" } });
      return sendText(phone, T[lang].phoneTaken);
    }
    user = await User.findByIdAndUpdate(login.linkUserId, { $set: { phone, phoneVerified: true } }, { new: true });
  } else {
    user = await User.findOne({ phone });
    if (!user) user = await User.create({ name: profileName || "SurrealBid member", phone, phoneVerified: true, role: "buyer" });
    else if (!user.phoneVerified) await User.updateOne({ _id: user._id }, { $set: { phoneVerified: true } });
  }

  await WhatsAppLogin.updateOne({ _id: login._id }, { $set: { status: "verified", userId: user._id } });
  return sendText(phone, T[lang][login.linkUserId ? "linkOk" : "loginOk"]);
}

// ---------------- APPLICATION BOT ----------------
async function existingApplication(phone) {
  const user = await User.findOne({ phone });
  const artist = user ? await Artist.findOne({ userId: user._id }) : null;
  return { user, artist, status: artist ? artist.status() : null };
}

async function ask(session, step) {
  const t = T[session.lang];
  session.step = step;
  await session.save();
  const prompts = {
    name: () => t.askName(session.profileName),
    city: () => t.askCity,
    medium: () => t.askMedium,
    styles: () => t.askStyles(styleList(session.lang)),
    experience: () => t.askExperience,
    story: () => t.askStory,
    photos: () => t.askPhotos,
    consent: () => t.askConsent,
  };
  return sendText(session.phone, prompts[step]());
}

function summaryText(session) {
  const a = session.answers;
  const lang = session.lang;
  const storyPreview = a.story ? (a.story.length > 160 ? `${a.story.slice(0, 160)}…` : a.story) : lang === "hi" ? "(वॉइस नोट)" : "(voice note)";
  return T[lang].summary(
    {
      ...a,
      styles: a.styles.map((s) => STYLE_LABELS[lang][STYLES.indexOf(s)]),
      experienceLabel: EXPERIENCE_LABELS[lang][EXPERIENCE.indexOf(a.experience)] || "",
      storyPreview,
    },
    session.photos.length,
    session.voiceNotes.length
  );
}

async function saveVoiceNote(session, mediaId, question) {
  const { buffer, mime } = await downloadMedia(mediaId);
  const url = await saveAudioBuffer(buffer, mime);
  // Written atomically to the database only; pushing onto the in-memory copy as well would make
  // Mongoose add it a second time on the next session.save().
  await WhatsAppSession.updateOne({ _id: session._id }, { $push: { voiceNotes: { question, url } } });
}

async function submitApplication(session) {
  const a = session.answers;
  let user = await User.findOne({ phone: session.phone });
  if (!user) user = await User.create({ name: a.name, phone: session.phone, phoneVerified: true, role: "buyer" });

  const existing = await Artist.findOne({ userId: user._id });
  if (existing && existing.status() !== "rejected") return existing;

  const hasVoiceStory = session.voiceNotes.some((v) => v.question === "story");
  const bio = [a.story, hasVoiceStory && "(The artist also sent a voice statement — listen to it in the application.)"].filter(Boolean).join("\n\n");

  const data = {
    userId: user._id,
    source: "whatsapp",
    basicInfo: {
      artistId: existing?.basicInfo.artistId || randomId("artist"),
      fullName: a.name,
      email: user.email || "",
      phone: session.phone,
      location: a.city,
      profilePhoto: "",
    },
    artisticProfile: { bio, artisticStyle: a.styles, yearsExperience: a.experience, medium: a.medium, education: "", awards: "", exhibitions: "" },
    portfolio: { images: session.photos, voiceNotes: session.voiceNotes },
    identityVerification: { website: "", instagram: "", otherSocialMedia: "", ownershipDeclaration: true, identityConsent: true },
    verification: { approved: false, portfolioReviewed: false, submittedAt: new Date(), rejectionReason: "" },
  };
  const artist = existing ? Object.assign(existing, data) : new Artist(data);
  await artist.save();
  emails.applicationReceived(artist).catch(() => {});
  return artist;
}

async function freshSession(session, keepLang = true) {
  session.set({ step: keepLang ? "name" : "lang", answers: {}, photos: [], voiceNotes: [] });
  return session;
}

/**
 * Handles one incoming WhatsApp message.
 * message: { id, type: "text"|"image"|"audio"|..., text?, mediaId?, mime? }
 */
async function handleIncoming({ phone, profileName, message }) {
  // Sign-in codes come first, whatever state the conversation is in.
  const loginMatch = message.type === "text" && /\blogin\s*(\d{6})\b/i.exec(message.text || "");
  if (loginMatch) return handleLoginCode(phone, profileName, loginMatch[1]);

  // Ignore duplicate deliveries of the same message.
  const session =
    (await WhatsAppSession.findOneAndUpdate(
      { phone, seen: { $ne: message.id } },
      { $push: { seen: { $each: [message.id], $slice: -50 } }, $set: { lastMessageAt: new Date(), ...(profileName ? { profileName } : {}) } },
      { new: true }
    )) ||
    (!(await WhatsAppSession.exists({ phone })) ? await WhatsAppSession.create({ phone, profileName, seen: [message.id] }) : null);
  if (!session) return; // duplicate

  const t = () => T[session.lang];
  const text = message.type === "text" ? String(message.text || "").trim() : "";

  if (text && isCommand(text, ["help", "मदद"])) return sendText(phone, t().help);
  if (text && isCommand(text, ["restart", "फिर से"])) {
    await freshSession(session);
    await sendText(phone, t().restarted);
    return ask(session, "name");
  }

  // Already applied? Answer with the status instead of starting a new application.
  if (session.step === "start" || session.step === "done" || isCommand(text, ["status", "स्थिति"])) {
    const { status } = await existingApplication(phone);
    if (status === "pending") return sendText(phone, t().pending);
    if (status === "approved") return sendText(phone, t().approved(siteLink("/submit")));
    if (session.step === "start" || session.step === "done") {
      session.step = "lang";
      await session.save();
      return sendText(phone, T.en.chooseLang);
    }
  }

  const step = session.step;
  const voiceAllowed = ["medium", "story"].includes(step);

  if (message.type === "audio") {
    if (!voiceAllowed) return sendText(phone, t().typeInstead);
    try {
      await saveVoiceNote(session, message.mediaId, step);
    } catch (err) {
      console.error("[whatsapp-bot] voice note failed:", err.message);
      return sendText(phone, t().mediaFailed);
    }
    await sendText(phone, t().voiceSaved);
    if (step === "medium") {
      session.answers.medium = session.answers.medium || (session.lang === "hi" ? "(वॉइस नोट में बताया)" : "(described in a voice note)");
      return ask(session, "styles");
    }
    return ask(session, "photos");
  }

  if (message.type === "image") {
    if (step !== "photos") return sendText(phone, t().unsupported);
    try {
      const { buffer, mime } = await downloadMedia(message.mediaId);
      const url = await saveImageBuffer(buffer, mime, { label: "Photo" });
      // Atomic push with a size check: several photos usually arrive at the same moment.
      const updated = await WhatsAppSession.findOneAndUpdate(
        { _id: session._id, [`photos.${MAX_PHOTOS - 1}`]: { $exists: false } },
        { $push: { photos: url } },
        { new: true }
      );
      if (!updated) return sendText(phone, t().photoSaved(MAX_PHOTOS));
      return sendText(phone, t().photoSaved(updated.photos.length));
    } catch (err) {
      console.error("[whatsapp-bot] photo failed:", err.message);
      return sendText(phone, t().mediaFailed);
    }
  }

  if (message.type !== "text") return sendText(phone, t().unsupported);

  switch (step) {
    case "lang":
      if (text === "1" || /english/i.test(text)) session.lang = "en";
      else if (text === "2" || /hindi|हिंदी/i.test(text)) session.lang = "hi";
      else return sendText(phone, T.en.chooseLang);
      return ask(session, "name");

    case "name": {
      const name = text === "1" && session.profileName ? session.profileName : text;
      if (name.length < 2 || name.length > 100) return sendText(phone, t().tooShort);
      session.answers.name = name;
      return ask(session, "city");
    }

    case "city":
      if (text.length < 2) return sendText(phone, t().tooShort);
      session.answers.city = text.slice(0, 120);
      return ask(session, "medium");

    case "medium":
      if (text.length < 3) return sendText(phone, t().tooShort);
      session.answers.medium = text.slice(0, 300);
      return ask(session, "styles");

    case "styles": {
      const picks = [...new Set((text.match(/\d+/g) || []).map(Number))].filter((n) => n >= 1 && n <= STYLES.length);
      if (!picks.length) return sendText(phone, t().invalidChoice);
      session.answers.styles = picks.map((n) => STYLES[n - 1]);
      return ask(session, "experience");
    }

    case "experience": {
      const n = Number(text);
      if (!(n >= 1 && n <= EXPERIENCE.length)) return sendText(phone, t().invalidChoice);
      session.answers.experience = EXPERIENCE[n - 1];
      return ask(session, "story");
    }

    case "story":
      if (text.length < 20) return sendText(phone, t().tooShort);
      session.answers.story = text.slice(0, 6000);
      return ask(session, "photos");

    case "photos": {
      if (!/^(done|हो गया|ho gaya)$/i.test(text)) return sendText(phone, t().askPhotos);
      const fresh = await WhatsAppSession.findById(session._id, { photos: 1 });
      if (!fresh.photos.length) return sendText(phone, t().needPhoto);
      session.photos = fresh.photos;
      return ask(session, "consent");
    }

    case "consent":
      if (!/^(yes|haan|हाँ|हां|ha)$/i.test(text)) return sendText(phone, t().askConsent);
      session.step = "confirm";
      await session.save();
      return sendText(phone, summaryText(await WhatsAppSession.findById(session._id)));

    case "confirm":
      if (text === "2") {
        await freshSession(session);
        return ask(session, "name");
      }
      if (text !== "1") return sendText(phone, t().invalidChoice);
      {
        const latest = await WhatsAppSession.findById(session._id);
        await submitApplication(latest);
        session.step = "done";
        await session.save();
        return sendText(phone, t().submitted(siteLink("/dashboard")));
      }

    default:
      session.step = "lang";
      await session.save();
      return sendText(phone, T.en.chooseLang);
  }
}

/** Best-effort WhatsApp message to an artist (free only within 24h of their last message). */
async function notifyArtist(artist, kind, reason = "") {
  const phone = artist.basicInfo?.phone && /^\d{8,15}$/.test(artist.basicInfo.phone) ? artist.basicInfo.phone : "";
  if (!phone) return;
  const lang = (await WhatsAppSession.findOne({ phone }, { lang: 1 }))?.lang || "en";
  if (kind === "approved") return sendText(phone, T[lang].approved(siteLink("/submit")));
  const text = lang === "hi"
    ? `आपका SurrealBid आवेदन अभी मंज़ूर नहीं हुआ।${reason ? `\n\nसमीक्षक की टिप्पणी: ${reason}` : ""}\n\nआप *RESTART* लिखकर फिर से आवेदन कर सकते हैं।`
    : `Your SurrealBid application wasn't approved this time.${reason ? `\n\nReviewer note: ${reason}` : ""}\n\nYou can reply *RESTART* to apply again.`;
  return sendText(phone, text);
}

module.exports = { handleIncoming, notifyArtist, MAX_PHOTOS };
