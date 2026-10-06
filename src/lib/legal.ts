/*
 * FINVOSMART — Finvosmart by Navgrow
 *
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd.
 * CIN: U29302WB2025PTC281015
 *
 * All rights reserved. This source code is proprietary and confidential.
 * Unauthorized copying, distribution, modification, or use of this file,
 * via any medium, is strictly prohibited without prior written permission.
 */

/**
 * Privacy Policy and Terms of Service content.
 *
 * Rules for this file:
 *  • Describe only data flows that really exist. (Voice transcription and e-signing
 *    are not integrated yet; when they are, add their providers to "sharing".)
 *  • When you change either document, bump LEGAL_VERSION *and* TERMS_VERSION in
 *    backend AuthService.java — a test checks they match — and update LEGAL_UPDATED.
 *  • Have a lawyer review before relying on these documents.
 */

export const LEGAL_VERSION = '2026-10-05'
export const LEGAL_UPDATED = '5 October 2026'

export const LEGAL_ENTITY = {
  name: 'Navgrow Engineering Service Pvt. Ltd.',
  cin: 'U29302WB2025PTC281015',
  email: 'contact@finvosmart.com',
  // Registered office address, as on the certificate of incorporation. Shown on the
  // legal pages once filled in.
  address: '',
}

export interface LegalSection { id: string; h2: string; paragraphs?: string[]; bullets?: string[]; after?: string[] }
export interface LegalDoc { key: 'privacy' | 'terms'; h1: string; intro: string; sections: LegalSection[] }

const E = LEGAL_ENTITY.email

export const PRIVACY: LegalDoc = {
  key: 'privacy',
  h1: 'Privacy Policy',
  intro: `Finvosmart is a product of ${LEGAL_ENTITY.name} (CIN ${LEGAL_ENTITY.cin}), a company registered in India. This notice explains what personal data we process when you visit finvosmart.com or use the Finvosmart app, why we process it, and your rights under India's Digital Personal Data Protection Act, 2023 (DPDP Act).`,
  sections: [
    { id: 'roles', h2: 'Your data, and your business\'s data', paragraphs: [
      'When you create an account, sign in or contact us, we decide how your personal data is used. For that data, we are the Data Fiduciary under the DPDP Act.',
      'Your business also uses Finvosmart to keep records about other people — customers, vendors and employees. For those records, your business is the Data Fiduciary. We process them only on your business\'s instructions, to provide the service, as a Data Processor. Requests about those records should go to the business that holds them, and we will help it respond.',
    ]},
    { id: 'collect', h2: 'Personal data we collect', bullets: [
      'Account details: your name, email address, mobile number (if you give it) and password. Passwords are stored only as a one-way bcrypt hash, which nobody — including us — can read.',
      'Company details: your business name and, if you add them, your GSTIN, address and other registration details.',
      'If you sign in with Google: your name and email address, after Google confirms your identity. We never see your Google password.',
      'Records you add while using Finvosmart, such as invoices, customer and vendor details, and employee records.',
      'Security and usage data: IP address, browser type, sign-in times and server logs of requests to our service.',
      'Messages you send us, such as support requests.',
    ]},
    { id: 'use', h2: 'Why we use it', bullets: [
      'To create your account and company, and to sign you in securely.',
      'To provide the features you use — GST invoicing, e-invoicing, inventory, CRM, HR and the rest of Finvosmart.',
      'To send emails about your account: welcome messages, sign-in codes, password resets and important service updates.',
      'To answer your questions and give support.',
      'To keep the service secure: to detect abuse, prevent fraud and investigate incidents.',
      'To meet our legal obligations, such as keeping records required by law.',
    ], after: [
      'We use personal data only for these purposes. We do not sell personal data, and we do not use it for advertising.',
    ]},
    { id: 'sharing', h2: 'Who we share it with', paragraphs: [
      'We share personal data only with service providers that help us run Finvosmart, only as much as each needs, and only for the purposes above:',
    ], bullets: [
      'Our hosting provider, which runs the servers that store Finvosmart\'s data.',
      'Our email delivery provider, which sends account emails such as sign-in codes and password resets.',
      'Google, if you choose "Sign in with Google": we send Google your sign-in token so it can confirm the token is genuine.',
      'Meta\'s WhatsApp Business service, only if your business turns on WhatsApp sending: the recipient\'s number and the message or invoice being sent.',
      'The Government of India\'s e-invoice (IRP) and e-way bill systems, only when you generate an e-invoice or e-way bill: the invoice details the law requires, including your customer\'s GSTIN.',
    ], after: [
      'We may also disclose personal data where the law requires it, for example to comply with a valid order from a court or government authority.',
    ]},
    { id: 'cookies', h2: 'Cookies and tracking', paragraphs: [
      'We do not use advertising or analytics trackers. To keep you signed in, the app stores your session in your browser\'s local storage, together with preferences such as the light or dark theme. Signing out removes your session.',
    ]},
    { id: 'security', h2: 'How we protect it', bullets: [
      'Encrypted connections (HTTPS) between your browser and our servers.',
      'Passwords stored only as bcrypt hashes.',
      'Role-based access, so each person sees only what their role allows.',
      'Strict separation between companies: one company can never see another company\'s data.',
      'Rate limits on sign-in and sign-up to stop automated attacks.',
    ], after: [
      'No system is perfectly secure. If a breach affects your personal data, we will inform you and the Data Protection Board of India as the DPDP Act requires.',
    ]},
    { id: 'retention', h2: 'How long we keep it', bullets: [
      'We keep account and company data for as long as your account is open.',
      'When an account is closed, we delete or anonymise its personal data unless the law requires us to keep it longer — for example, tax records — or we need it to resolve a dispute. Before deleting a company\'s data, we give the business a chance to export it.',
      'We keep security logs for at least one year, as the DPDP Rules require.',
    ]},
    { id: 'rights', h2: 'Your rights', paragraphs: ['Under the DPDP Act, you can:'], bullets: [
      'Ask for a summary of the personal data we hold about you and how we use it.',
      'Ask us to correct, complete or update it.',
      'Ask us to erase it, unless we must keep it by law.',
      'Withdraw consent you have given. This does not affect processing already done, and we may then be unable to provide some services.',
      'Nominate someone to exercise these rights for you if you die or become unable to.',
      'Raise a grievance with us.',
    ], after: [
      `To use any of these rights, email ${E}. We may need to confirm your identity first. We aim to reply quickly, and we will always respond within 90 days — the maximum the DPDP Rules allow.`,
      'For records a business keeps about you in Finvosmart (for example as its customer or employee), please contact that business; we will help it respond.',
    ]},
    { id: 'grievances', h2: 'Grievance Officer and complaints', paragraphs: [
      `You can contact our Grievance Officer at ${E} — please put "Grievance" in the subject line. If you are not satisfied with our response, you can complain to the Data Protection Board of India.`,
    ]},
    { id: 'children', h2: 'Children', paragraphs: [
      'Finvosmart is a tool for businesses and is not meant for anyone under 18. We do not knowingly collect children\'s personal data. If you believe a child has given us personal data, contact us and we will delete it.',
    ]},
    { id: 'storage', h2: 'Where your data is stored', paragraphs: [
      'Your data is stored on servers operated by our hosting provider. If personal data is ever transferred outside India, we will do so only as permitted under Indian law.',
    ]},
    { id: 'changes', h2: 'Changes to this policy', paragraphs: [
      'When this policy changes, we will update the date at the top. For significant changes, we will also tell you by email or in the app.',
    ]},
  ],
}

export const TERMS: LegalDoc = {
  key: 'terms',
  h1: 'Terms of Service',
  intro: `These terms govern your use of Finvosmart, provided by ${LEGAL_ENTITY.name} (CIN ${LEGAL_ENTITY.cin}). By creating an account or using Finvosmart, you agree to them on behalf of your business. If you do not agree, please do not use Finvosmart. Our Privacy Policy explains how we handle personal data.`,
  sections: [
    { id: 'eligibility', h2: 'Who can use Finvosmart', paragraphs: [
      'Finvosmart is for businesses and professionals. You must be at least 18 years old and authorised to act for the business you register.',
    ]},
    { id: 'accounts', h2: 'Your account', bullets: [
      'Each business gets its own company account with a company code. Keep your company code, email and password safe; you are responsible for activity under your account.',
      'Your account admin decides who in your business gets access and what each person\'s role allows.',
      `Tell us immediately at ${E} if you suspect unauthorised access.`,
    ]},
    { id: 'plans', h2: 'Free trial, plans and payment', paragraphs: [
      'New businesses get a 14-day free trial, with no credit card required. To keep using Finvosmart after the trial, choose a paid plan.',
      'Plans and prices are shown on our pricing page and may change. We will give you advance notice before a price change applies to you. Applicable taxes, such as GST, are charged as required by law.',
    ]},
    { id: 'your-data', h2: 'Your data', paragraphs: [
      'You own the data you put into Finvosmart. You permit us to store and process it only to provide the service to you, as described in our Privacy Policy. While your account is active, you can export your records, such as invoices and GST return files.',
    ]},
    { id: 'compliance', h2: 'Your responsibilities, including tax compliance', paragraphs: [
      'Finvosmart helps you prepare invoices, GST returns and other records, but you remain responsible for:',
    ], bullets: [
      'the accuracy of the information you enter, including GST rates and HSN/SAC codes;',
      'reviewing documents and returns before you issue or file them; and',
      'meeting your own legal and tax obligations.',
    ], after: [
      'Finvosmart is a software tool. It is not tax, legal or accounting advice.',
    ]},
    { id: 'acceptable-use', h2: 'Acceptable use', paragraphs: ['You agree not to:'], bullets: [
      'use Finvosmart for anything unlawful or fraudulent, including fake invoices;',
      'try to access other companies\' data, or our systems, without permission;',
      'disrupt the service, probe it for vulnerabilities, or overload it — for example with automated scraping or load testing — without our written permission;',
      'upload malware;',
      'send spam or unsolicited messages using the WhatsApp or email features; or',
      'copy, resell or reverse-engineer the software.',
    ], after: [
      `If you find a security issue, please report it to ${E}.`,
    ]},
    { id: 'third-party', h2: 'Third-party services', paragraphs: [
      'Some features connect to services we do not control, such as the Government\'s GST, e-invoice and e-way bill systems, WhatsApp and Google. Their own terms apply, and we are not responsible for their availability or errors — for example, when a government portal is down.',
    ]},
    { id: 'availability', h2: 'Availability and changes', paragraphs: [
      'We work to keep Finvosmart available and secure, but we cannot promise it will be uninterrupted or error-free. We may carry out maintenance and change or improve features. If we remove a feature you rely on, we will try to give you reasonable notice.',
    ]},
    { id: 'termination', h2: 'Ending your account', paragraphs: [
      'You can stop using Finvosmart at any time. We may suspend or close an account that breaches these terms, is not paid for, or puts the service or other people at risk; where reasonable, we will warn you first.',
      'After an account closes, we will give you a reasonable opportunity to export your data, unless the law prevents it, and then delete it as described in our Privacy Policy.',
    ]},
    { id: 'ip', h2: 'Our software and brand', paragraphs: [
      `Finvosmart, its software and its brand belong to ${LEGAL_ENTITY.name}. These terms give you the right to use the service; they do not transfer any ownership.`,
    ]},
    { id: 'liability', h2: 'Disclaimer and limitation of liability', paragraphs: [
      'Finvosmart is provided "as is". To the extent the law allows, we are not liable for indirect or consequential losses, such as lost profits, and our total liability for any claim is limited to the amount you paid us for Finvosmart in the 12 months before the claim. Nothing in these terms limits liability that cannot be limited under Indian law.',
    ]},
    { id: 'indemnity', h2: 'Indemnity', paragraphs: [
      'If someone makes a claim against us because of data you put into Finvosmart or your breach of these terms, you will cover the reasonable costs that result.',
    ]},
    { id: 'law', h2: 'Governing law and disputes', paragraphs: [
      'These terms are governed by the laws of India. Before going to court, we will both try to resolve any dispute informally by contacting each other. If that fails, the courts at Kolkata, West Bengal, have exclusive jurisdiction.',
    ]},
    { id: 'changes', h2: 'Changes to these terms', paragraphs: [
      'We may update these terms. We will change the date at the top and, for significant changes, tell you in advance by email or in the app. If you keep using Finvosmart after the changes take effect, the updated terms apply.',
    ]},
  ],
}
