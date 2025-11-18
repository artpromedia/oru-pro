/* eslint-disable */
const { PrismaClient, Prisma } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await seedCommunications();
  await prisma.vehicleModel.upsert({
    where: { id: "vehicle-model-rivian-r1" },
    update: {},
    create: {
      id: "vehicle-model-rivian-r1",
      modelCode: "R1S",
      platform: "Skateboard",
      modelYear: 2025,
      variant: "Adventure",
      bom: {
        components: 2412,
        critical: ["TractionBattery", "Inverter", "ThermalModule"]
      },
      assemblySequence: {
        stages: ["Body", "Paint", "Battery", "Final"]
      },
      taktTime: 312,
      qualityGates: [{ gate: "Electrical", status: "pass" }]
    }
  });

  await prisma.supplyChainTier.upsert({
    where: { id: "tier-1-inverter" },
    update: {},
    create: {
      id: "tier-1-inverter",
      supplierCode: "INV-001",
      tier: 1,
      parts: ["Inverter", "DC-DC"],
      justInTime: true,
      kanbanSignals: { bins: 8, threshold: 3 },
      ediIntegration: true,
      qualityRating: new Prisma.Decimal("98.7"),
      deliveryPerformance: new Prisma.Decimal("97.3"),
      contingencySupplier: "INV-ALT-2"
    }
  });

  await prisma.productionLine.upsert({
    where: { id: "line-body-w1" },
    update: {},
    create: {
      id: "line-body-w1",
      lineCode: "BODY-WEST-01",
      stationType: "Body",
      capacity: 420,
      currentVIN: "5YJSA1E2XFF080001",
      sequenceNumber: 8124,
      andonStatus: "green",
      qualityDefects: [],
      cycleTime: 305
    }
  });

  await prisma.qualityGate.upsert({
    where: { id: "gate-final-fit" },
    update: {},
    create: {
      id: "gate-final-fit",
      gateNumber: 8,
      gateName: "Fit & Finish",
      vin: "5YJSA1E2XFF080001",
      defects: [{ panel: "Hood", gap: "-0.5mm" }],
      reworkRequired: false,
      passStatus: true,
      torqueData: [{ fastener: "A12", torqueNm: 35 }],
      gapFlushData: [{ location: "LH Door", gap: 3.1 }]
    }
  });

  await prisma.vehicleRecall.upsert({
    where: { id: "recall-r1s-thermal" },
    update: {},
    create: {
      id: "recall-r1s-thermal",
      recallNumber: "23V-902",
      affectedVINs: ["5YJSA1E2XFF080001"],
      component: "High-voltage harness",
      supplier: "HAR-220",
      safetyRisk: "Potential coolant ingress",
      remediation: "Replace harness + seal",
      nhtsaCampaign: "23V902"
    }
  });

  await prisma.patientFlow.upsert({
    where: { id: "pf-123" },
    update: {},
    create: {
      id: "pf-123",
      patientId: "PT-00981",
      admissionType: "Emergency",
      department: "Cardiology",
      bedAssignment: "CCU-12",
      acuityLevel: 4,
      lengthOfStay: 3,
      dischargeDisposition: null,
      readmissionRisk: 0.34
    }
  });

  await prisma.medicalSupplies.upsert({
    where: { id: "supply-vent" },
    update: {},
    create: {
      id: "supply-vent",
      itemCode: "VENT-TUBE-01",
      category: "Surgical",
      parLevel: 120,
      currentStock: 98,
      expiryTracked: true,
      lotNumbers: ["LT-5511", "LT-5512"],
      implantable: false,
      fdaClass: "Class II",
      sterilizationDate: new Date().toISOString()
    }
  });

  await prisma.operatingRoom.upsert({
    where: { id: "or-7" },
    update: {},
    create: {
      id: "or-7",
      orNumber: "OR-07",
      status: "Turnover",
      currentProcedure: "Lap Chole",
      surgeonId: "SURG-1102",
      nextCase: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      utilizationRate: new Prisma.Decimal("82.4"),
      turnaroundTime: 18,
      equipmentStatus: { tower: "ok", anesthesia: "ok" }
    }
  });

  await prisma.clinicalPathway.upsert({
    where: { id: "cp-hip-replacement" },
    update: {},
    create: {
      id: "cp-hip-replacement",
      pathwayName: "Total Hip Replacement",
      drg: "469",
      expectedLOS: 3,
      steps: [{ name: "Pre-op" }, { name: "Surgery" }, { name: "Rehab" }],
      outcomes: { mobilityIndex: 0.92 },
      costPerCase: new Prisma.Decimal("18450"),
      qualityMetrics: { readmit: 0.04 }
    }
  });

  await prisma.fleet.upsert({
    where: { id: "fleet-rig-22" },
    update: {},
    create: {
      id: "fleet-rig-22",
      vehicleId: "TRK-2201",
      type: "Refrigerated",
      capacity: { pallets: 22, weightKg: 14000 },
      currentLocation: { lat: 34.15, lng: -118.13 },
      status: "In-Transit",
      driver: "D-188",
      fuelLevel: 0.56,
      nextMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      iotTelemetry: { tempC: 3.8, speedKph: 92 }
    }
  });

  await prisma.route.upsert({
    where: { id: "route-west-12" },
    update: {},
    create: {
      id: "route-west-12",
      routeNumber: "W12",
      origin: "LAX",
      destination: "SEA",
      stops: [{ city: "Fresno" }, { city: "Portland" }],
      distance: 1860,
      estimatedTime: 1640,
      actualTime: null,
      fuelConsumption: 812,
      trafficConditions: "Moderate",
      weatherImpact: "Rain",
      optimization: { score: 0.91 }
    }
  });

  await prisma.crossDock.upsert({
    where: { id: "xd-denver" },
    update: {},
    create: {
      id: "xd-denver",
      facilityCode: "DEN-XD",
      inboundShipments: [{ carrier: "UPS" }],
      outboundShipments: [{ carrier: "FedEx" }],
      sortingLanes: 18,
      throughputRate: 5200,
      dwellTime: 46,
      missortRate: new Prisma.Decimal("0.35")
    }
  });

  await prisma.lastMile.upsert({
    where: { id: "lm-9912" },
    update: {},
    create: {
      id: "lm-9912",
      deliveryId: "DEL-9912",
      customerLocation: { lat: 37.77, lng: -122.41 },
      timeWindow: { from: "14:00", to: "16:00" },
      deliveryAttempts: 1,
      proofOfDelivery: null,
      customerSatisfaction: null,
      deliveryCost: new Prisma.Decimal("18.60"),
      alternativeDelivery: "Locker"
    }
  });
}

async function seedCommunications() {
  const organization = await prisma.organization.upsert({
    where: { id: "org-demo" },
    update: {},
    create: {
      id: "org-demo",
      code: "DEMO",
      name: "Oonru Demo Foods",
      status: "active",
      settings: {
        modules: ["inventory", "production", "comms"],
        timezone: "America/Chicago"
      }
    }
  });

  const operationsRole = await prisma.role.upsert({
    where: { id: "role-ops" },
    update: {},
    create: {
      id: "role-ops",
      organizationId: organization.id,
      name: "Operations Lead",
      permissions: ["inventory.view", "production.view", "comms.manage"]
    }
  });

  const supervisorRole = await prisma.role.upsert({
    where: { id: "role-supervisor" },
    update: {},
    create: {
      id: "role-supervisor",
      organizationId: organization.id,
      name: "Shift Supervisor",
      permissions: ["inventory.view", "comms.send"]
    }
  });

  const alex = await prisma.user.upsert({
    where: { id: "user-alex" },
    update: {},
    create: {
      id: "user-alex",
      organizationId: organization.id,
      email: "alex.rivera@oru.ai",
      passwordHash: "$2a$10$9OmXW/byLlTj1ZNF4RJajuHU37D8GAroVE0cXdrPQgQjJfXI0qZvW",
      name: "Alex Rivera",
      title: "Operations Lead",
      avatarUrl: "/avatars/alex.png",
      roleId: operationsRole.id
    }
  });

  const sam = await prisma.user.upsert({
    where: { id: "user-sam" },
    update: {},
    create: {
      id: "user-sam",
      organizationId: organization.id,
      email: "samantha.lee@oru.ai",
      passwordHash: "$2a$10$9OmXW/byLlTj1ZNF4RJajuHU37D8GAroVE0cXdrPQgQjJfXI0qZvW",
      name: "Samantha Lee",
      title: "Production Supervisor",
      avatarUrl: "/avatars/sam.png",
      roleId: supervisorRole.id
    }
  });

  const jordan = await prisma.user.upsert({
    where: { id: "user-jordan" },
    update: {},
    create: {
      id: "user-jordan",
      organizationId: organization.id,
      email: "jordan.nguyen@oru.ai",
      passwordHash: "$2a$10$9OmXW/byLlTj1ZNF4RJajuHU37D8GAroVE0cXdrPQgQjJfXI0qZvW",
      name: "Jordan Nguyen",
      title: "Procurement Analyst",
      avatarUrl: "/avatars/jordan.png",
      roleId: supervisorRole.id
    }
  });

  const generalChannel = await prisma.channel.upsert({
    where: { id: "chn-general" },
    update: {},
    create: {
      id: "chn-general",
      organizationId: organization.id,
      name: "Operations War Room",
      slug: "ops-war-room",
      type: "channel",
      description: "Live coordination between ops, production, and procurement",
      createdBy: alex.id,
      topic: "Shift 3 cold-chain stabilization"
    }
  });

  const qaChannel = await prisma.channel.upsert({
    where: { id: "chn-qa" },
    update: {},
    create: {
      id: "chn-qa",
      organizationId: organization.id,
      name: "QA Escalations",
      slug: "qa-escalations",
      type: "channel",
      description: "Quality holds and release blockers",
      createdBy: sam.id
    }
  });

  const members = [
    { channelId: generalChannel.id, userId: alex.id },
    { channelId: generalChannel.id, userId: sam.id },
    { channelId: generalChannel.id, userId: jordan.id },
    { channelId: qaChannel.id, userId: sam.id },
    { channelId: qaChannel.id, userId: alex.id }
  ];

  for (const member of members) {
    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId: member.channelId,
          userId: member.userId
        }
      },
      update: {},
      create: {
        channelId: member.channelId,
        userId: member.userId,
        role: member.userId === alex.id ? "owner" : "member"
      }
    });
  }

  const message1 = await prisma.message.upsert({
    where: { id: "msg-ops-1" },
    update: {},
    create: {
      id: "msg-ops-1",
      channelId: generalChannel.id,
      userId: alex.id,
      content: "Cold storage #2 spiked to 6°C. Switching to backup compressor and paging maintenance.",
      metadata: {
        alert: true,
        severity: "high"
      }
    }
  });

  await prisma.message.upsert({
    where: { id: "msg-ops-2" },
    update: {},
    create: {
      id: "msg-ops-2",
      channelId: generalChannel.id,
      userId: sam.id,
      replyToId: message1.id,
      content: "Maintenance ETA 12 minutes. InventoryAgent already throttled outbound orders." ,
      metadata: {
        ai: "InventoryAgent",
        action: "throttle_orders"
      }
    }
  });

  await prisma.message.upsert({
    where: { id: "msg-qa-1" },
    update: {},
    create: {
      id: "msg-qa-1",
      channelId: qaChannel.id,
      userId: jordan.id,
      content: "Lot B2025-1115-A flagged marginal moisture variance. Need QA decision before 18:00.",
      metadata: {
        batch: "B2025-1115-A",
        variance: "moisture",
        deadline: "18:00"
      }
    }
  });
}

main()
  .catch((error) => {
    console.error("Error seeding database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
