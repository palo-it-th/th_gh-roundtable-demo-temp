import { PrismaClient, CustomerType, RiskRating, CaseStatus, TransactionDirection, NoteType, FilingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Clean existing data in dependency order
  await prisma.auditLog.deleteMany();
  await prisma.investigationNote.deleteMany();
  await prisma.strDecision.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.amlCase.deleteMany();
  await prisma.customer.deleteMany();

  // ─── Customers ───────────────────────────────────────────

  const meridianStar = await prisma.customer.create({
    data: {
      name: 'Meridian Star Trading Pte Ltd',
      type: CustomerType.CORPORATE,
      riskRating: RiskRating.MEDIUM,
      businessActivity: 'Regional electronics distributor — imports components from East Asia, resells to Southeast Asian markets',
      accountOpenDate: new Date('2021-03-15'),
      sourceOfWealth: 'Business revenue from electronics distribution',
      nationality: 'Singapore',
    },
  });

  const limWeiHao = await prisma.customer.create({
    data: {
      name: 'Lim Wei Hao',
      type: CustomerType.INDIVIDUAL,
      riskRating: RiskRating.LOW,
      businessActivity: 'Software engineer at a local fintech company',
      accountOpenDate: new Date('2019-08-01'),
      sourceOfWealth: 'Employment income',
      nationality: 'Singapore',
    },
  });

  const easternHorizon = await prisma.customer.create({
    data: {
      name: 'Eastern Horizon Imports Pte Ltd',
      type: CustomerType.CORPORATE,
      riskRating: RiskRating.HIGH,
      businessActivity: 'Import/export of textiles and garments — primary suppliers in Myanmar and Cambodia',
      accountOpenDate: new Date('2022-11-20'),
      sourceOfWealth: 'Trade finance revenue',
      nationality: 'Singapore',
    },
  });

  const ashaGlobal = await prisma.customer.create({
    data: {
      name: 'Asha Global Services Pte Ltd',
      type: CustomerType.CORPORATE,
      riskRating: RiskRating.MEDIUM,
      businessActivity: 'IT consulting and offshore staffing services',
      accountOpenDate: new Date('2020-06-10'),
      sourceOfWealth: 'Consulting fees and service contracts',
      nationality: 'Singapore',
    },
  });

  const tanRuiEn = await prisma.customer.create({
    data: {
      name: 'Tan Rui En',
      type: CustomerType.INDIVIDUAL,
      riskRating: RiskRating.LOW,
      businessActivity: 'Retired — previously in property management',
      accountOpenDate: new Date('2015-02-28'),
      sourceOfWealth: 'Retirement savings and CPF',
      nationality: 'Singapore',
    },
  });

  // ─── Case 1: AML-2026-0017 — Meridian Star (UNDER_REVIEW) ────

  const case1 = await prisma.amlCase.create({
    data: {
      caseNumber: 'AML-2026-0017',
      customerId: meridianStar.id,
      status: CaseStatus.UNDER_REVIEW,
      riskScore: 82,
      createdAt: new Date('2026-04-28T08:00:00Z'),
      alertType: 'Rapid Movement of Funds',
      alertReason: 'Multiple large transfers received and disbursed within 48 hours across unrelated counterparties in high-risk jurisdictions. Pattern inconsistent with declared electronics distribution business.',
      riskIndicators: [
        'Rapid pass-through of funds',
        'Unrelated counterparties',
        'High-risk jurisdiction counterparty',
        'Inconsistent with declared business activity',
      ],
      totalAmount: 480000,
      assignedAnalyst: 'Sarah Chen',
    },
  });

  // Case 1 Transactions (4 — rapid pass-through pattern)
  await prisma.transaction.createMany({
    data: [
      {
        caseId: case1.id,
        direction: TransactionDirection.INCOMING,
        amount: 150000,
        currency: 'USD',
        counterparty: 'Northstar Holdings Ltd',
        country: 'British Virgin Islands',
        date: new Date('2026-04-10T09:15:00Z'),
        purpose: 'Payment for electronic components — Invoice NS-4401',
      },
      {
        caseId: case1.id,
        direction: TransactionDirection.OUTGOING,
        amount: 145000,
        currency: 'USD',
        counterparty: 'Blue River Consulting SA',
        country: 'Panama',
        date: new Date('2026-04-11T14:30:00Z'),
        purpose: 'Consulting services — contract BR-2026-088',
      },
      {
        caseId: case1.id,
        direction: TransactionDirection.INCOMING,
        amount: 120000,
        currency: 'USD',
        counterparty: 'Golden Peak Enterprises',
        country: 'Myanmar',
        date: new Date('2026-04-12T11:00:00Z'),
        purpose: 'Trade settlement — PO GP-7722',
      },
      {
        caseId: case1.id,
        direction: TransactionDirection.OUTGOING,
        amount: 65000,
        currency: 'USD',
        counterparty: 'Apex Ventures International',
        country: 'Cayman Islands',
        date: new Date('2026-04-13T16:45:00Z'),
        purpose: 'Investment advisory fees',
      },
    ],
  });

  // Case 1 Investigation Notes (3)
  await prisma.investigationNote.createMany({
    data: [
      {
        caseId: case1.id,
        noteType: NoteType.CUSTOMER_PROFILE_REVIEW,
        author: 'Sarah Chen',
        content: 'Reviewed customer profile. Meridian Star is registered as an electronics distributor but recent transaction patterns do not align with typical trade flows. No invoices for electronic goods match the counterparties involved in flagged transactions.',
        createdAt: new Date('2026-04-15T10:30:00Z'),
      },
      {
        caseId: case1.id,
        noteType: NoteType.TRANSACTION_REVIEW,
        author: 'Sarah Chen',
        content: 'Analyzed flagged transactions from 10-13 April 2026. Funds received from BVI and Myanmar entities were disbursed within 24-48 hours to Panama and Cayman Islands entities. Pass-through pattern with minimal retention. Amounts are inconsistent with declared trade volumes.',
        createdAt: new Date('2026-04-16T09:15:00Z'),
      },
      {
        caseId: case1.id,
        noteType: NoteType.COUNTERPARTY_REVIEW,
        author: 'Sarah Chen',
        content: 'Counterparty screening: Northstar Holdings (BVI) — no adverse media found but shell company indicators. Blue River Consulting (Panama) — limited online presence, no verifiable consulting operations. Golden Peak Enterprises (Myanmar) — flagged in FATF grey-list jurisdiction. Apex Ventures (Cayman) — registered investment entity with no public track record.',
        createdAt: new Date('2026-04-17T14:00:00Z'),
      },
    ],
  });

  // Case 1 Audit Log
  await prisma.auditLog.createMany({
    data: [
      {
        caseId: case1.id,
        actor: 'System',
        action: 'Case Created',
        details: 'Case AML-2026-0017 created from automated alert — Rapid Movement of Funds',
        timestamp: new Date('2026-04-14T08:00:00Z'),
      },
      {
        caseId: case1.id,
        actor: 'Sarah Chen',
        action: 'Status Changed',
        details: 'Status changed from NEW to UNDER_REVIEW',
        timestamp: new Date('2026-04-15T09:00:00Z'),
      },
      {
        caseId: case1.id,
        actor: 'Sarah Chen',
        action: 'Note Added',
        details: 'Customer Profile Review note added',
        timestamp: new Date('2026-04-15T10:30:00Z'),
      },
      {
        caseId: case1.id,
        actor: 'Sarah Chen',
        action: 'Note Added',
        details: 'Transaction Review note added',
        timestamp: new Date('2026-04-16T09:15:00Z'),
      },
      {
        caseId: case1.id,
        actor: 'Sarah Chen',
        action: 'Note Added',
        details: 'Counterparty Review note added',
        timestamp: new Date('2026-04-17T14:00:00Z'),
      },
    ],
  });

  // ─── Case 2: AML-2026-0012 — Lim Wei Hao (CLOSED_NO_STR) ────

  const case2 = await prisma.amlCase.create({
    data: {
      caseNumber: 'AML-2026-0012',
      customerId: limWeiHao.id,
      status: CaseStatus.CLOSED_NO_STR,
      riskScore: 28,
      createdAt: new Date('2026-03-08T08:00:00Z'),
      alertType: 'Unusual Transaction Volume',
      alertReason: 'Transaction volume exceeded 3x monthly average. Customer received multiple transfers in a short period.',
      riskIndicators: [
        'Transaction volume spike',
        'Multiple transfers in short period',
      ],
      totalAmount: 35000,
      assignedAnalyst: 'James Wong',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        caseId: case2.id,
        direction: TransactionDirection.INCOMING,
        amount: 12000,
        currency: 'SGD',
        counterparty: 'TechFlow Solutions Pte Ltd',
        country: 'Singapore',
        date: new Date('2026-03-05T10:00:00Z'),
        purpose: 'Annual performance bonus',
      },
      {
        caseId: case2.id,
        direction: TransactionDirection.INCOMING,
        amount: 15000,
        currency: 'SGD',
        counterparty: 'Central Provident Fund Board',
        country: 'Singapore',
        date: new Date('2026-03-06T14:00:00Z'),
        purpose: 'CPF withdrawal — housing scheme',
      },
      {
        caseId: case2.id,
        direction: TransactionDirection.OUTGOING,
        amount: 8000,
        currency: 'SGD',
        counterparty: 'DBS Vickers Securities',
        country: 'Singapore',
        date: new Date('2026-03-07T11:30:00Z'),
        purpose: 'Securities investment — ETF purchase',
      },
    ],
  });

  await prisma.investigationNote.createMany({
    data: [
      {
        caseId: case2.id,
        noteType: NoteType.CUSTOMER_PROFILE_REVIEW,
        author: 'James Wong',
        content: 'Customer is a salaried software engineer. Volume spike attributable to annual bonus and CPF withdrawal, both verified through supporting documents. No suspicious indicators.',
        createdAt: new Date('2026-03-10T09:00:00Z'),
      },
      {
        caseId: case2.id,
        noteType: NoteType.DECISION_RATIONALE,
        author: 'James Wong',
        content: 'Transactions are consistent with customer profile and employment. Bonus payment verified with employer records. CPF withdrawal confirmed via official notification. No grounds for suspicion.',
        createdAt: new Date('2026-03-10T11:00:00Z'),
      },
    ],
  });

  // Case 2 STR Decision (closed, no STR)
  await prisma.strDecision.create({
    data: {
      caseId: case2.id,
      suspicionEstablished: false,
      suspicionReason: 'Transaction volume spike fully explained by legitimate employment bonus and CPF withdrawal. All sources verified.',
      analystRecommendation: 'No STR filing recommended. Transactions are consistent with customer profile and verified income sources.',
      filingStatus: FilingStatus.NOT_STARTED,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        caseId: case2.id,
        actor: 'System',
        action: 'Case Created',
        details: 'Case AML-2026-0012 created from automated alert — Unusual Transaction Volume',
        timestamp: new Date('2026-03-08T08:00:00Z'),
      },
      {
        caseId: case2.id,
        actor: 'James Wong',
        action: 'Status Changed',
        details: 'Status changed from NEW to UNDER_REVIEW',
        timestamp: new Date('2026-03-09T09:00:00Z'),
      },
      {
        caseId: case2.id,
        actor: 'James Wong',
        action: 'Note Added',
        details: 'Customer Profile Review note added',
        timestamp: new Date('2026-03-10T09:00:00Z'),
      },
      {
        caseId: case2.id,
        actor: 'James Wong',
        action: 'Recommendation Submitted',
        details: 'Analyst recommendation: No STR filing — no suspicion established',
        timestamp: new Date('2026-03-10T11:30:00Z'),
      },
      {
        caseId: case2.id,
        actor: 'System',
        action: 'Status Changed',
        details: 'Status changed from UNDER_REVIEW to CLOSED_NO_STR',
        timestamp: new Date('2026-03-10T11:30:00Z'),
      },
    ],
  });

  // ─── Case 3: AML-2026-0021 — Eastern Horizon (PENDING_REVIEWER_APPROVAL) ────

  const case3 = await prisma.amlCase.create({
    data: {
      caseNumber: 'AML-2026-0021',
      customerId: easternHorizon.id,
      status: CaseStatus.PENDING_REVIEWER_APPROVAL,
      riskScore: 91,
      createdAt: new Date('2026-04-08T08:00:00Z'),
      alertType: 'High-Risk Jurisdiction Transfer',
      alertReason: 'Large transfers to and from entities in FATF grey-list jurisdictions with insufficient trade documentation.',
      riskIndicators: [
        'FATF grey-list jurisdiction',
        'Insufficient trade documentation',
        'Complex layered transactions',
        'Shell company indicators',
        'Sanctions proximity',
      ],
      totalAmount: 720000,
      assignedAnalyst: 'Sarah Chen',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        caseId: case3.id,
        direction: TransactionDirection.INCOMING,
        amount: 250000,
        currency: 'USD',
        counterparty: 'Jade Mountain Textiles Co',
        country: 'Myanmar',
        date: new Date('2026-04-01T08:30:00Z'),
        purpose: 'Payment for garment shipment — LC ref JMT-2026-115',
      },
      {
        caseId: case3.id,
        direction: TransactionDirection.OUTGOING,
        amount: 180000,
        currency: 'USD',
        counterparty: 'Crown Pacific Trading LLC',
        country: 'Cambodia',
        date: new Date('2026-04-03T10:15:00Z'),
        purpose: 'Raw materials procurement — silk and cotton',
      },
      {
        caseId: case3.id,
        direction: TransactionDirection.INCOMING,
        amount: 190000,
        currency: 'USD',
        counterparty: 'Emerald Bay Holdings',
        country: 'Vanuatu',
        date: new Date('2026-04-05T15:00:00Z'),
        purpose: 'Trade finance settlement',
      },
      {
        caseId: case3.id,
        direction: TransactionDirection.OUTGOING,
        amount: 100000,
        currency: 'USD',
        counterparty: 'Silverline Logistics International',
        country: 'Laos',
        date: new Date('2026-04-07T13:45:00Z'),
        purpose: 'Shipping and logistics services',
      },
    ],
  });

  await prisma.investigationNote.createMany({
    data: [
      {
        caseId: case3.id,
        noteType: NoteType.TRANSACTION_REVIEW,
        author: 'Sarah Chen',
        content: 'Reviewed four flagged transactions totalling USD 720,000. All involve entities in FATF grey-list or high-risk jurisdictions. Trade documentation provided is incomplete — missing bill of lading for Jade Mountain shipment and no verifiable contract with Emerald Bay Holdings.',
        createdAt: new Date('2026-04-09T10:00:00Z'),
      },
      {
        caseId: case3.id,
        noteType: NoteType.COUNTERPARTY_REVIEW,
        author: 'Sarah Chen',
        content: 'Emerald Bay Holdings (Vanuatu) appears to be a shell entity — no physical office, no employees listed. Crown Pacific Trading (Cambodia) has minimal web presence and was recently incorporated. Silverline Logistics (Laos) cannot be verified through standard shipping directories.',
        createdAt: new Date('2026-04-10T14:30:00Z'),
      },
      {
        caseId: case3.id,
        noteType: NoteType.DECISION_RATIONALE,
        author: 'Sarah Chen',
        content: 'Based on the involvement of shell entities, FATF grey-list jurisdictions, missing documentation, and transaction patterns inconsistent with legitimate textile trade, suspicion of money laundering is established. Recommending STR filing.',
        createdAt: new Date('2026-04-11T09:00:00Z'),
      },
    ],
  });

  // Case 3 STR Decision (pending reviewer approval)
  await prisma.strDecision.create({
    data: {
      caseId: case3.id,
      suspicionEstablished: true,
      suspicionReason: 'Transactions involve shell entities in high-risk jurisdictions with insufficient documentation. Pattern is consistent with trade-based money laundering.',
      analystRecommendation: 'File STR with STRO via SONAR. Grounds: suspected trade-based money laundering through layered transactions across FATF grey-list jurisdictions.',
      filingStatus: FilingStatus.NOT_STARTED,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        caseId: case3.id,
        actor: 'System',
        action: 'Case Created',
        details: 'Case AML-2026-0021 created from automated alert — High-Risk Jurisdiction Transfer',
        timestamp: new Date('2026-04-08T08:00:00Z'),
      },
      {
        caseId: case3.id,
        actor: 'Sarah Chen',
        action: 'Status Changed',
        details: 'Status changed from NEW to UNDER_REVIEW',
        timestamp: new Date('2026-04-09T09:00:00Z'),
      },
      {
        caseId: case3.id,
        actor: 'Sarah Chen',
        action: 'Note Added',
        details: 'Transaction Review note added',
        timestamp: new Date('2026-04-09T10:00:00Z'),
      },
      {
        caseId: case3.id,
        actor: 'Sarah Chen',
        action: 'Note Added',
        details: 'Counterparty Review note added',
        timestamp: new Date('2026-04-10T14:30:00Z'),
      },
      {
        caseId: case3.id,
        actor: 'Sarah Chen',
        action: 'Recommendation Submitted',
        details: 'Analyst recommendation: File STR — suspicion of trade-based money laundering established',
        timestamp: new Date('2026-04-11T09:30:00Z'),
      },
      {
        caseId: case3.id,
        actor: 'System',
        action: 'Status Changed',
        details: 'Status changed from UNDER_REVIEW to PENDING_REVIEWER_APPROVAL',
        timestamp: new Date('2026-04-11T09:30:00Z'),
      },
    ],
  });

  // ─── Case 4: AML-2026-0009 — Asha Global (NEW) ────

  const case4 = await prisma.amlCase.create({
    data: {
      caseNumber: 'AML-2026-0009',
      customerId: ashaGlobal.id,
      status: CaseStatus.NEW,
      riskScore: 45,
      createdAt: new Date('2026-04-23T08:00:00Z'),
      alertType: 'Multiple Unrelated Counterparties',
      alertReason: 'Payments to multiple unrelated entities across different industries and jurisdictions within a single month.',
      riskIndicators: [
        'Multiple unrelated counterparties',
        'Cross-industry payments',
        'Unusual payment frequency',
      ],
      totalAmount: 95000,
      assignedAnalyst: 'James Wong',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        caseId: case4.id,
        direction: TransactionDirection.OUTGOING,
        amount: 28000,
        currency: 'SGD',
        counterparty: 'Skybridge Construction Pte Ltd',
        country: 'Singapore',
        date: new Date('2026-04-18T09:00:00Z'),
        purpose: 'Office renovation services',
      },
      {
        caseId: case4.id,
        direction: TransactionDirection.OUTGOING,
        amount: 35000,
        currency: 'USD',
        counterparty: 'Pacific Rim Agriculture Co',
        country: 'Thailand',
        date: new Date('2026-04-20T11:00:00Z'),
        purpose: 'Consulting engagement — agricultural sector review',
      },
      {
        caseId: case4.id,
        direction: TransactionDirection.OUTGOING,
        amount: 32000,
        currency: 'SGD',
        counterparty: 'Redwood Capital Partners',
        country: 'Hong Kong',
        date: new Date('2026-04-22T15:30:00Z'),
        purpose: 'Investment management fees',
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        caseId: case4.id,
        actor: 'System',
        action: 'Case Created',
        details: 'Case AML-2026-0009 created from automated alert — Multiple Unrelated Counterparties',
        timestamp: new Date('2026-04-23T08:00:00Z'),
      },
    ],
  });

  // ─── Case 5: AML-2026-0023 — Tan Rui En (PENDING_INFORMATION) ────

  const case5 = await prisma.amlCase.create({
    data: {
      caseNumber: 'AML-2026-0023',
      customerId: tanRuiEn.id,
      status: CaseStatus.PENDING_INFORMATION,
      riskScore: 38,
      createdAt: new Date('2026-04-27T08:00:00Z'),
      alertType: 'Dormant Account Reactivated',
      alertReason: 'Account dormant for 18 months suddenly reactivated with significant inbound transfers from overseas.',
      riskIndicators: [
        'Dormant account reactivation',
        'Overseas transfers after inactivity',
        'Inconsistent with retirement profile',
      ],
      totalAmount: 62000,
      assignedAnalyst: 'James Wong',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        caseId: case5.id,
        direction: TransactionDirection.INCOMING,
        amount: 25000,
        currency: 'SGD',
        counterparty: 'Tan Mei Ling',
        country: 'Malaysia',
        date: new Date('2026-04-25T10:00:00Z'),
        purpose: 'Family remittance',
      },
      {
        caseId: case5.id,
        direction: TransactionDirection.INCOMING,
        amount: 22000,
        currency: 'SGD',
        counterparty: 'Horizon Property Management',
        country: 'Malaysia',
        date: new Date('2026-04-26T14:00:00Z'),
        purpose: 'Rental income from overseas property',
      },
      {
        caseId: case5.id,
        direction: TransactionDirection.OUTGOING,
        amount: 15000,
        currency: 'SGD',
        counterparty: 'Great Eastern Life Assurance',
        country: 'Singapore',
        date: new Date('2026-04-28T11:30:00Z'),
        purpose: 'Life insurance premium — annual payment',
      },
    ],
  });

  await prisma.investigationNote.createMany({
    data: [
      {
        caseId: case5.id,
        noteType: NoteType.CUSTOMER_PROFILE_REVIEW,
        author: 'James Wong',
        content: 'Customer is retired, account was dormant since October 2024. Reactivation coincides with transfers from Malaysia. Need to verify: (1) relationship with Tan Mei Ling, (2) property ownership records in Malaysia, (3) source of rental income.',
        createdAt: new Date('2026-04-29T10:00:00Z'),
      },
      {
        caseId: case5.id,
        noteType: NoteType.CUSTOMER_OUTREACH,
        author: 'James Wong',
        content: 'Contacted customer via registered phone number. Customer states Tan Mei Ling is his daughter based in Kuala Lumpur. Claims to own a rental property in Penang. Requested supporting documents — property deed and tenancy agreement. Customer agreed to provide within 7 working days.',
        createdAt: new Date('2026-04-30T14:00:00Z'),
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        caseId: case5.id,
        actor: 'System',
        action: 'Case Created',
        details: 'Case AML-2026-0023 created from automated alert — Dormant Account Reactivated',
        timestamp: new Date('2026-04-27T08:00:00Z'),
      },
      {
        caseId: case5.id,
        actor: 'James Wong',
        action: 'Status Changed',
        details: 'Status changed from NEW to UNDER_REVIEW',
        timestamp: new Date('2026-04-28T09:00:00Z'),
      },
      {
        caseId: case5.id,
        actor: 'James Wong',
        action: 'Note Added',
        details: 'Customer Profile Review note added',
        timestamp: new Date('2026-04-29T10:00:00Z'),
      },
      {
        caseId: case5.id,
        actor: 'James Wong',
        action: 'Status Changed',
        details: 'Status changed from UNDER_REVIEW to PENDING_INFORMATION — awaiting customer documents',
        timestamp: new Date('2026-04-30T14:30:00Z'),
      },
    ],
  });

  // ─── Case 6: AML-2026-0005 — Meridian Star (CLOSED_STR_FILED) ────

  const case6 = await prisma.amlCase.create({
    data: {
      caseNumber: 'AML-2026-0005',
      customerId: meridianStar.id,
      status: CaseStatus.CLOSED_STR_FILED,
      riskScore: 76,
      createdAt: new Date('2026-01-20T08:00:00Z'),
      alertType: 'Transaction Inconsistent with Profile',
      alertReason: 'Series of transfers to entities unrelated to electronics distribution, including a property developer and an offshore trust.',
      riskIndicators: [
        'Inconsistent with declared business activity',
        'Offshore trust involvement',
        'Layered transaction structure',
      ],
      totalAmount: 310000,
      assignedAnalyst: 'Sarah Chen',
    },
  });

  await prisma.transaction.createMany({
    data: [
      {
        caseId: case6.id,
        direction: TransactionDirection.OUTGOING,
        amount: 120000,
        currency: 'USD',
        counterparty: 'Pinnacle Property Development',
        country: 'Malaysia',
        date: new Date('2026-01-15T09:30:00Z'),
        purpose: 'Property deposit — unit purchase in KL Sentral',
      },
      {
        caseId: case6.id,
        direction: TransactionDirection.OUTGOING,
        amount: 90000,
        currency: 'USD',
        counterparty: 'Westbridge Family Trust',
        country: 'Jersey',
        date: new Date('2026-01-18T14:00:00Z'),
        purpose: 'Trust settlement — beneficiary contribution',
      },
      {
        caseId: case6.id,
        direction: TransactionDirection.INCOMING,
        amount: 100000,
        currency: 'USD',
        counterparty: 'Sunview Electronics Co Ltd',
        country: 'Taiwan',
        date: new Date('2026-01-12T10:00:00Z'),
        purpose: 'Payment for electronic components — Invoice SV-8890',
      },
    ],
  });

  await prisma.investigationNote.createMany({
    data: [
      {
        caseId: case6.id,
        noteType: NoteType.TRANSACTION_REVIEW,
        author: 'Sarah Chen',
        content: 'Incoming funds from Sunview Electronics (Taiwan) appear legitimate based on existing trade relationship. However, subsequent transfers to Pinnacle Property (Malaysia) and Westbridge Family Trust (Jersey) are unrelated to electronics distribution and not reflected in declared business activities.',
        createdAt: new Date('2026-01-22T10:00:00Z'),
      },
      {
        caseId: case6.id,
        noteType: NoteType.COUNTERPARTY_REVIEW,
        author: 'Sarah Chen',
        content: 'Westbridge Family Trust (Jersey) — offshore trust with opaque beneficial ownership structure. No connection to electronics industry. Pinnacle Property (Malaysia) — legitimate developer, but purchase is unusual for a corporate trading account.',
        createdAt: new Date('2026-01-23T11:00:00Z'),
      },
      {
        caseId: case6.id,
        noteType: NoteType.DECISION_RATIONALE,
        author: 'Sarah Chen',
        content: 'Funds received from legitimate trade are being diverted to personal property purchase and offshore trust. This is inconsistent with the corporate mandate and suggests potential misuse of corporate accounts. Recommending STR filing.',
        createdAt: new Date('2026-01-24T09:00:00Z'),
      },
    ],
  });

  // Case 6 STR Decision (filed)
  await prisma.strDecision.create({
    data: {
      caseId: case6.id,
      suspicionEstablished: true,
      suspicionReason: 'Corporate funds diverted to personal property acquisition and offshore trust, inconsistent with declared business mandate.',
      analystRecommendation: 'File STR with STRO via SONAR. Grounds: suspected misuse of corporate account for personal enrichment and layered transfers to offshore structures.',
      reviewerDecision: 'approved',
      reviewerComment: 'Concur with analyst assessment. Offshore trust involvement and property purchase clearly outside business scope. Approve for STR filing.',
      filingStatus: FilingStatus.FILED,
      filingReference: 'STR-2026-SG-004812',
      filedAt: new Date('2026-02-10T16:00:00Z'),
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        caseId: case6.id,
        actor: 'System',
        action: 'Case Created',
        details: 'Case AML-2026-0005 created from automated alert — Transaction Inconsistent with Profile',
        timestamp: new Date('2026-01-20T08:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'Sarah Chen',
        action: 'Status Changed',
        details: 'Status changed from NEW to UNDER_REVIEW',
        timestamp: new Date('2026-01-21T09:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'Sarah Chen',
        action: 'Note Added',
        details: 'Transaction Review note added',
        timestamp: new Date('2026-01-22T10:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'Sarah Chen',
        action: 'Note Added',
        details: 'Counterparty Review note added',
        timestamp: new Date('2026-01-23T11:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'Sarah Chen',
        action: 'Recommendation Submitted',
        details: 'Analyst recommendation: File STR — suspicion of corporate account misuse established',
        timestamp: new Date('2026-01-24T09:30:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'System',
        action: 'Status Changed',
        details: 'Status changed from UNDER_REVIEW to PENDING_REVIEWER_APPROVAL',
        timestamp: new Date('2026-01-24T09:30:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'David Lim',
        action: 'Reviewer Decision',
        details: 'Reviewer approved STR filing recommendation',
        timestamp: new Date('2026-01-28T14:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'System',
        action: 'Status Changed',
        details: 'Status changed from PENDING_REVIEWER_APPROVAL to APPROVED_FOR_STR_FILING',
        timestamp: new Date('2026-01-28T14:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'David Lim',
        action: 'Filing Status Updated',
        details: 'Filing status changed to DRAFTING',
        timestamp: new Date('2026-02-01T10:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'David Lim',
        action: 'Filing Status Updated',
        details: 'Filing status changed to READY_FOR_FILING',
        timestamp: new Date('2026-02-07T16:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'David Lim',
        action: 'Filing Status Updated',
        details: 'STR filed with STRO via SONAR — Reference: STR-2026-SG-004812',
        timestamp: new Date('2026-02-10T16:00:00Z'),
      },
      {
        caseId: case6.id,
        actor: 'System',
        action: 'Status Changed',
        details: 'Status changed from APPROVED_FOR_STR_FILING to CLOSED_STR_FILED',
        timestamp: new Date('2026-02-10T16:00:00Z'),
      },
    ],
  });

  console.log('Seed data created successfully');
  console.log('  Customers: 5');
  console.log('  Cases: 6');
  console.log('  Transactions: 17');
  console.log('  Investigation Notes: 11');
  console.log('  STR Decisions: 3');
  console.log('  Audit Log Entries: 28');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
