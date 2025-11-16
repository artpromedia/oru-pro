"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Heart,
  Package,
  Pill,
  Shield,
  Stethoscope,
  Syringe,
  Thermometer,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TransactionKey =
  | "patient_admission"
  | "surgical_case"
  | "medication_administration"
  | "lab_results"
  | "discharge_planning"
  | "supply_chain";

type TransactionConfig<TWorkflow extends WorkflowVariant> = {
  name: string;
  icon: LucideIcon;
  critical?: boolean;
  workflows: TWorkflow[];
};

type PatientAdmissionWorkflow = {
  id: string;
  type: string;
  patient: {
    mrn: string;
    name: string;
    age: number;
    gender: string;
    insurance: string;
    primaryDiagnosis: string;
    acuity: number;
    chiefComplaint: string;
    vitals: {
      bp: string;
      pulse: number;
      temp: string;
      spo2: string;
      painScale: number;
    };
  };
  admission: {
    timestamp: string;
    source: string;
    admittingPhysician: string;
    attendingPhysician: string;
    unit: string;
    bed: string;
    isolation: string;
  };
  clinicalPathway: {
    name: string;
    phase: string;
    orders: Array<{
      type: string;
      name: string;
      status: string;
      value?: string;
      critical?: boolean;
      result?: string;
      time?: string;
      rate?: string;
    }>;
    nextSteps: string[];
  };
  bedManagement: {
    previousBed: string;
    transferTime: string;
    transportedBy: string;
    equipmentNeeded: string[];
    cleaning: { status: string; time: string };
  };
};

type SurgicalCaseWorkflow = {
  id: string;
  type: string;
  patient: {
    mrn: string;
    name: string;
    procedure: string;
    side: string;
    surgeon: string;
    anesthesiologist: string;
  };
  scheduling: {
    or: string;
    date: string;
    startTime: string;
    duration: string;
    setupTime: string;
    turnoverTime: string;
  };
  preOp: {
    checklist: Array<{ item: string; status: boolean; since?: string; drug?: string; typed?: string }>;
    timeout: {
      patient: string;
      procedure: string;
      site: string;
      position: string;
      implants: string;
    };
  };
  supplies: {
    implants: Array<{ item: string; size: string; lot: string; cost: number }>;
    instruments: string[];
    medications: string[];
  };
  postOp: {
    recovery: string;
    disposition: string;
    painManagement: string;
    mobilization: string;
    estimatedLOS: string;
  };
};

type MedicationAdministrationWorkflow = {
  id: string;
  type: string;
  patient: {
    mrn: string;
    name: string;
    allergies: string[];
    weight: string;
    creatinine: number;
  };
  medication: {
    name: string;
    dose: string;
    route: string;
    frequency: string;
    indication: string;
    highAlert: boolean;
  };
  administration: {
    scheduledTime: string;
    nurse: string;
    barcodeScan: { patient: string; medication: string; timestamp: string };
    fiveRights: Record<string, boolean>;
    doubleCheck: { required: boolean; verifiedBy: string; timestamp: string };
    administration: { given: boolean; time: string; site: string; patientResponse: string };
  };
  documentation: {
    mar: string;
    vitals: { bp: string; pulse: number };
    painScore: number;
    education: string[];
  };
};

type LabResultsWorkflow = {
  id: string;
  type: string;
  patient: { mrn: string; name: string; location: string; diagnosis: string };
  order: {
    id: string;
    orderingProvider: string;
    priority: string;
    tests: string[];
  };
  results: {
    timestamp: string;
    criticalValues: Array<{ test: string; value: string; reference: string; critical: boolean; severity: string }>;
    notification: {
      method: string;
      notifiedProvider: string;
      time: string;
      readBack: string;
      orders: string[];
    };
  };
  actions: {
    medications: Array<{ name: string; dose?: string; route?: string; time?: string; status?: string }>;
    repeat: { test: string; scheduledTime: string; reason: string };
    escalation: { rapidResponse: boolean; consultRequested: string };
  };
};

type DischargeWorkflow = {
  id: string;
  type: string;
  patient: {
    mrn: string;
    name: string;
    age: number;
    los: number;
    diagnosis: string;
    socialSupport: string;
    insurance: string;
  };
  planning: {
    estimatedDischarge: string;
    disposition: string;
    barriers: string[];
    needs: { medical: string[]; functional: string[] };
  };
  services: {
    homeHealth: { agency: string; frequency: string; disciplines: string[]; startDate: string };
    dme: Array<{ item: string; status: string; delivery: string }>;
    medications: { newPrescriptions: number; priorAuth: string[]; copayAssistance: string };
  };
  education: { topics: string[]; teachBack: { completed: boolean; understanding: string }; materials: string[] };
  followUp: {
    primaryCare: { provider: string; date: string };
    cardiology: { provider: string; date: string };
    labs: { tests: string; date: string };
  };
};

type SupplyChainWorkflow = {
  id: string;
  type: string;
  category: string;
  surgery: string;
  items: Array<{
    type: string;
    manufacturer: string;
    model: string;
    components: Array<{ part: string; size: string; lot: string; udi: string }>;
    cost: number;
    reimbursement: string;
    margin: number;
  }>;
  consignment: { vendor: string; delivered: string; verified: boolean; returnBy: string };
  documentation: {
    implantLog: string;
    stickerChart: string;
    billing: string;
    registry: string;
  };
  tracking: {
    sterilization: { date: string; method: string; cycles: number };
    chainOfCustody: string[];
    warranty: string;
    patientNotification: string;
  };
};

type WorkflowVariant =
  | PatientAdmissionWorkflow
  | SurgicalCaseWorkflow
  | MedicationAdministrationWorkflow
  | LabResultsWorkflow
  | DischargeWorkflow
  | SupplyChainWorkflow;

const transactionTypes: Record<TransactionKey, TransactionConfig<WorkflowVariant>> = {
  patient_admission: {
    name: "Patient Admission & Bed Management",
    icon: Users,
    critical: true,
    workflows: [
      {
        id: "ADM-HC-2025-1115-001",
        type: "emergency_admission",
        patient: {
          mrn: "MRN-123456",
          name: "John Doe",
          age: 67,
          gender: "Male",
          insurance: "Medicare",
          primaryDiagnosis: "Acute MI",
          acuity: 4,
          chiefComplaint: "Chest pain",
          vitals: {
            bp: "145/92",
            pulse: 98,
            temp: "37.2°C",
            spo2: "94%",
            painScale: 7,
          },
        },
        admission: {
          timestamp: "2025-11-15 21:15:00",
          source: "Emergency Department",
          admittingPhysician: "Dr. Sarah Johnson",
          attendingPhysician: "Dr. Michael Chen",
          unit: "Cardiac ICU",
          bed: "CICU-204",
          isolation: "Standard Precautions",
        },
        clinicalPathway: {
          name: "Acute MI Protocol",
          phase: "Initial Assessment",
          orders: [
            { type: "Lab", name: "Troponin I", status: "Resulted", value: "2.4 ng/mL", critical: true },
            { type: "Lab", name: "CBC", status: "In Process" },
            { type: "Lab", name: "BMP", status: "In Process" },
            { type: "Imaging", name: "Chest X-Ray", status: "Completed" },
            { type: "Procedure", name: "EKG", status: "Completed", result: "ST elevation V2-V4" },
            { type: "Medication", name: "Aspirin 325mg", status: "Administered", time: "21:20" },
            { type: "Medication", name: "Heparin drip", status: "Active", rate: "12 units/kg/hr" },
          ],
          nextSteps: ["Cardiac catheterization", "Cardiology consult"],
        },
        bedManagement: {
          previousBed: "ED-07",
          transferTime: "21:30",
          transportedBy: "Transport Team #3",
          equipmentNeeded: ["Cardiac monitor", "IV pump", "O2 setup"],
          cleaning: { status: "Completed", time: "21:00" },
        },
      },
    ],
  },
  surgical_case: {
    name: "OR Scheduling & Case Management",
    icon: Stethoscope,
    workflows: [
      {
        id: "SRG-HC-2025-1115-001",
        type: "scheduled_surgery",
        patient: {
          mrn: "MRN-789012",
          name: "Mary Wilson",
          procedure: "Total Hip Replacement",
          side: "Right",
          surgeon: "Dr. Robert Lee",
          anesthesiologist: "Dr. Emily Brown",
        },
        scheduling: {
          or: "OR-5",
          date: "2025-11-16",
          startTime: "07:30",
          duration: "120 minutes",
          setupTime: "30 minutes",
          turnoverTime: "30 minutes",
        },
        preOp: {
          checklist: [
            { item: "Consent signed", status: true },
            { item: "H&P within 30 days", status: true },
            { item: "Anesthesia evaluation", status: true },
            { item: "NPO status verified", status: true, since: "2025-11-15 20:00" },
            { item: "Surgical site marked", status: true },
            { item: "Antibiotics ordered", status: true, drug: "Cefazolin 2g" },
            { item: "Blood products", status: true, typed: "2 units PRBC" },
            { item: "Implant available", status: true, typed: "IMP-2025-8923" },
          ],
          timeout: {
            patient: "Confirmed",
            procedure: "Confirmed",
            site: "Confirmed",
            position: "Lateral",
            implants: "Verified",
          },
        },
        supplies: {
          implants: [
            { item: "Femoral stem", size: "12", lot: "FS-2025-001", cost: 2500 },
            { item: "Acetabular cup", size: "54", lot: "AC-2025-002", cost: 1800 },
            { item: "Femoral head", size: "32", lot: "FH-2025-003", cost: 800 },
          ],
          instruments: ["Hip tray #3", "Power tools", "C-arm compatible table"],
          medications: ["Tranexamic acid", "Vancomycin powder", "Local anesthetic"],
        },
        postOp: {
          recovery: "PACU Bay 3",
          disposition: "Floor - Ortho Unit",
          painManagement: "Epidural + PCA",
          mobilization: "POD #0 - Sit edge of bed",
          estimatedLOS: "2-3 days",
        },
      },
    ],
  },
  medication_administration: {
    name: "Medication Administration (eMAR)",
    icon: Pill,
    workflows: [
      {
        id: "MED-HC-2025-1115-001",
        type: "high_alert_medication",
        patient: {
          mrn: "MRN-345678",
          name: "Robert Davis",
          allergies: ["Penicillin - Rash", "Sulfa - Anaphylaxis"],
          weight: "82 kg",
          creatinine: 1.2,
        },
        medication: {
          name: "Heparin",
          dose: "5000 units",
          route: "SubQ",
          frequency: "Q8H",
          indication: "DVT prophylaxis",
          highAlert: true,
        },
        administration: {
          scheduledTime: "22:00",
          nurse: "RN Jennifer Smith",
          barcodeScan: {
            patient: "Verified",
            medication: "Verified",
            timestamp: "21:58:45",
          },
          fiveRights: {
            rightPatient: true,
            rightMedication: true,
            rightDose: true,
            rightRoute: true,
            rightTime: true,
          },
          doubleCheck: {
            required: true,
            verifiedBy: "RN Michael Johnson",
            timestamp: "21:59:30",
          },
          administration: {
            given: true,
            time: "22:00:15",
            site: "Abdomen - RUQ",
            patientResponse: "Tolerated well",
          },
        },
        documentation: {
          mar: "Updated",
          vitals: { bp: "128/78", pulse: 72 },
          painScore: 3,
          education: ["Bleeding precautions", "Report unusual bruising"],
        },
      },
    ],
  },
  lab_results: {
    name: "Lab Results & Critical Values",
    icon: Activity,
    critical: true,
    workflows: [
      {
        id: "LAB-HC-2025-1115-001",
        type: "critical_value",
        patient: {
          mrn: "MRN-567890",
          name: "Susan Martinez",
          location: "ICU-301",
          diagnosis: "Sepsis",
        },
        order: {
          id: "LAB-ORD-98234",
          orderingProvider: "Dr. James Wilson",
          priority: "STAT",
          tests: ["CBC", "BMP", "Lactate", "Blood Culture"],
        },
        results: {
          timestamp: "2025-11-15 21:45:00",
          criticalValues: [
            {
              test: "Potassium",
              value: "6.8 mEq/L",
              reference: "3.5-5.0",
              critical: true,
              severity: "Life threatening",
            },
            {
              test: "Hemoglobin",
              value: "6.2 g/dL",
              reference: "12-16",
              critical: true,
              severity: "Urgent",
            },
          ],
          notification: {
            method: "Phone call",
            notifiedProvider: "Dr. Wilson",
            time: "21:47",
            readBack: "Confirmed",
            orders: ["Kayexalate 30g PO", "Type & Cross 2 units PRBC"],
          },
        },
        actions: {
          medications: [
            { name: "Kayexalate", dose: "30g", route: "PO", time: "22:00" },
            { name: "Insulin/D50", status: "Prepared" },
          ],
          repeat: {
            test: "BMP",
            scheduledTime: "23:00",
            reason: "Monitor K+ after treatment",
          },
          escalation: {
            rapidResponse: false,
            consultRequested: "Nephrology",
          },
        },
      },
    ],
  },
  discharge_planning: {
    name: "Discharge Planning & Coordination",
    icon: Calendar,
    workflows: [
      {
        id: "DIS-HC-2025-1115-001",
        type: "complex_discharge",
        patient: {
          mrn: "MRN-234567",
          name: "William Thompson",
          age: 78,
          los: 7,
          diagnosis: "CHF exacerbation",
          socialSupport: "Lives alone",
          insurance: "Medicare + Supplement",
        },
        planning: {
          estimatedDischarge: "2025-11-16",
          disposition: "Home with services",
          barriers: ["Lives on 2nd floor", "Limited family support"],
          needs: {
            medical: ["Daily weights", "Medication management", "Diet compliance"],
            functional: ["ADL assistance", "Fall risk", "Ambulation"],
          },
        },
        services: {
          homeHealth: {
            agency: "Caring Hands HH",
            frequency: "3x/week x 4 weeks",
            disciplines: ["RN", "PT", "OT"],
            startDate: "2025-11-17",
          },
          dme: [
            { item: "Hospital bed", status: "Ordered", delivery: "2025-11-16" },
            { item: "Walker", status: "Ordered", delivery: "2025-11-16" },
            { item: "O2 concentrator", status: "Pending insurance auth", delivery: "TBD" },
          ],
          medications: {
            newPrescriptions: 5,
            priorAuth: ["Entresto - Approved"],
            copayAssistance: "Applied",
          },
        },
        education: {
          topics: ["CHF management", "Low sodium diet", "Daily weights", "Medication schedule"],
          teachBack: { completed: true, understanding: "Good" },
          materials: ["CHF booklet", "Diet guide", "Medication calendar"],
        },
        followUp: {
          primaryCare: { provider: "Dr. Smith", date: "2025-11-20" },
          cardiology: { provider: "Dr. Jones", date: "2025-11-25" },
          labs: { tests: "BMP", date: "2025-11-19" },
        },
      },
    ],
  },
  supply_chain: {
    name: "Medical Supply Chain",
    icon: Package,
    workflows: [
      {
        id: "SUP-HC-2025-1115-001",
        type: "implant_tracking",
        category: "Orthopedic Implants",
        surgery: "SRG-HC-2025-1115-001",
        items: [
          {
            type: "Knee Prosthesis",
            manufacturer: "Zimmer Biomet",
            model: "NexGen CR-Flex",
            components: [
              { part: "Femoral Component", size: "67.5", lot: "FB-2025-001", udi: "01234567890123" },
              { part: "Tibial Tray", size: "3", lot: "TT-2025-002", udi: "01234567890124" },
              { part: "Polyethylene Insert", size: "10mm", lot: "PI-2025-003", udi: "01234567890125" },
            ],
            cost: 8500,
            reimbursement: "DRG 470",
            margin: -2100,
          },
        ],
        consignment: {
          vendor: "Zimmer Rep",
          delivered: "2025-11-15 06:00",
          verified: true,
          returnBy: "2025-11-17",
        },
        documentation: {
          implantLog: "Completed",
          stickerChart: "In patient chart",
          billing: "Charge captured",
          registry: "Submitted to AJRR",
        },
        tracking: {
          sterilization: { date: "2025-11-14", method: "EO", cycles: 2 },
          chainOfCustody: ["Central Supply", "OR-5", "Patient", "Chart"],
          warranty: "10 years",
          patientNotification: "Card provided",
        },
      },
    ],
  },
};

export default function HealthcareTransactions() {
  const [activeTransaction, setActiveTransaction] = useState<TransactionKey>("patient_admission");
  const transactionEntries = useMemo(
    () => Object.entries(transactionTypes) as Array<[TransactionKey, TransactionConfig<WorkflowVariant>]>,
    [],
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">Prompt 5 · Healthcare</p>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare Provider Transactions</h1>
          <p className="text-sm text-gray-500">Clinical workflows and patient care coordination</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 px-3 py-1 text-sm text-emerald-700">
          <Shield className="h-4 w-4" /> HIPAA Compliant
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {transactionEntries.map(([key, config]) => {
          const Icon = config.icon;
          const isActive = key === activeTransaction;
          return (
            <button
              key={key}
              onClick={() => setActiveTransaction(key)}
              className={`rounded-xl border-2 p-4 text-center transition ${
                isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Icon
                className={`mx-auto mb-2 h-6 w-6 ${config.critical ? "text-red-500" : "text-slate-600"}`}
              />
              <p className="text-xs font-semibold text-gray-900">{config.name}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <HealthcareTransactionWorkflow type={activeTransaction} data={transactionTypes[activeTransaction]} />
      </section>
    </div>
  );
}

function HealthcareTransactionWorkflow({
  type,
  data,
}: {
  type: TransactionKey;
  data: TransactionConfig<WorkflowVariant>;
}) {
  const workflow = data.workflows[0];

  switch (type) {
    case "patient_admission":
      return <PatientAdmissionWorkflowView workflow={workflow as PatientAdmissionWorkflow} />;
    case "surgical_case":
      return <SurgicalCaseWorkflowView workflow={workflow as SurgicalCaseWorkflow} />;
    case "medication_administration":
      return <MedicationAdministrationWorkflowView workflow={workflow as MedicationAdministrationWorkflow} />;
    case "lab_results":
      return <CriticalLabWorkflowView workflow={workflow as LabResultsWorkflow} />;
    case "discharge_planning":
      return <DischargePlanningWorkflowView workflow={workflow as DischargeWorkflow} />;
    case "supply_chain":
      return <SupplyChainWorkflowView workflow={workflow as SupplyChainWorkflow} />;
    default:
      return null;
  }
}

function InfoRow({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${accent ? "text-red-600" : "text-gray-900"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <FileText className="h-4 w-4 text-blue-500" />
        {title}
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ label, tone = "default" }: { label: string; tone?: "success" | "warning" | "critical" | "default" }) {
  const palette: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-rose-100 text-rose-700",
    default: "bg-slate-100 text-slate-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${palette[tone]}`}>{label}</span>;
}

function PatientAdmissionWorkflowView({ workflow }: { workflow: PatientAdmissionWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Emergency Admission</h2>
          <p className="text-sm text-gray-500">{workflow.patient.chiefComplaint}</p>
          <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
            <Heart className="h-3.5 w-3.5" /> Acute MI protocol engaged
          </div>
        </div>
        <StatusBadge label={`Acuity Level ${workflow.patient.acuity}`} tone="critical" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Patient Information">
          <div className="space-y-2">
            <InfoRow label="MRN" value={workflow.patient.mrn} />
            <InfoRow label="Name" value={workflow.patient.name} />
            <InfoRow label="Age/Gender" value={`${workflow.patient.age} / ${workflow.patient.gender}`} />
            <InfoRow label="Diagnosis" value={workflow.patient.primaryDiagnosis} accent />
            <InfoRow label="Insurance" value={workflow.patient.insurance} />
          </div>
        </SectionCard>
        <SectionCard title="Current Vitals">
          <div className="space-y-2">
            <InfoRow label="BP" value={workflow.patient.vitals.bp} />
            <InfoRow label="Pulse" value={`${workflow.patient.vitals.pulse} bpm`} />
            <InfoRow label="Temperature" value={workflow.patient.vitals.temp} />
            <InfoRow label="SpO₂" value={workflow.patient.vitals.spo2} />
            <InfoRow label="Pain" value={workflow.patient.vitals.painScale} />
          </div>
        </SectionCard>
        <SectionCard title="Admission Details">
          <div className="space-y-2">
            <InfoRow label="Unit" value={workflow.admission.unit} />
            <InfoRow label="Bed" value={workflow.admission.bed} />
            <InfoRow label="Attending" value={workflow.admission.attendingPhysician} />
            <InfoRow label="Timestamp" value={workflow.admission.timestamp} />
          </div>
        </SectionCard>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Active Orders · {workflow.clinicalPathway.name}</h3>
          <div className="flex gap-2 text-xs text-gray-500">
            <Thermometer className="h-4 w-4" /> Phase: {workflow.clinicalPathway.phase}
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Order</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-left">Result/Notes</th>
              </tr>
            </thead>
            <tbody>
              {workflow.clinicalPathway.orders.map((order, idx) => (
                <tr key={`${order.name}-${idx}`} className="border-t">
                  <td className="px-3 py-2">{order.type}</td>
                  <td className="px-3 py-2">{order.name}</td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge
                      label={order.status}
                      tone={
                        order.status === "Completed" || order.status === "Administered"
                          ? "success"
                          : order.status === "Resulted"
                          ? "default"
                          : order.status === "Active"
                          ? "warning"
                          : "warning"
                      }
                    />
                  </td>
                  <td className={`px-3 py-2 ${order.critical ? "text-rose-600" : "text-gray-700"}`}>
                    {order.value || order.result || order.time || order.rate || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Clinical Next Steps">
          <div className="flex flex-wrap gap-2">
            {workflow.clinicalPathway.nextSteps.map((step) => (
              <span key={step} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {step}
              </span>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Bed Management">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Transferred from {workflow.bedManagement.previousBed} at {workflow.bedManagement.transferTime}</p>
            <p>Transported by {workflow.bedManagement.transportedBy}</p>
            <p className="text-xs text-gray-500">Equipment: {workflow.bedManagement.equipmentNeeded.join(", ")}</p>
            <p className="text-xs text-gray-500">
              Cleaning {workflow.bedManagement.cleaning.status} · {workflow.bedManagement.cleaning.time}
            </p>
          </div>
        </SectionCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
          Order Cardiac Cath STAT
        </button>
        <button className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600">
          Cardiology Consult
        </button>
        <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
          Update Care Plan
        </button>
        <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          View Full Chart
        </button>
      </div>
    </div>
  );
}

function SurgicalCaseWorkflowView({ workflow }: { workflow: SurgicalCaseWorkflow }) {
  const totalImplantCost = workflow.supplies.implants.reduce((sum, implant) => sum + implant.cost, 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{workflow.patient.procedure}</h2>
          <p className="text-sm text-gray-500">{workflow.patient.name} · Surgeon {workflow.patient.surgeon}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <StatusBadge label={`${workflow.scheduling.date} · ${workflow.scheduling.startTime}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="OR Schedule">
          <div className="space-y-2 text-sm text-gray-700">
            <InfoRow label="Room" value={workflow.scheduling.or} />
            <InfoRow label="Duration" value={workflow.scheduling.duration} />
            <InfoRow label="Setup" value={workflow.scheduling.setupTime} />
            <InfoRow label="Turnover" value={workflow.scheduling.turnoverTime} />
          </div>
        </SectionCard>
        <SectionCard title="Pre-op Checklist">
          <div className="space-y-2">
            {workflow.preOp.checklist.map((item) => (
              <div key={item.item} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.item}</span>
                <StatusBadge label={item.status ? "Complete" : "Pending"} tone={item.status ? "success" : "warning"} />
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Timeout">
          <div className="space-y-1 text-sm text-gray-700">
            <p>Patient: {workflow.preOp.timeout.patient}</p>
            <p>Procedure: {workflow.preOp.timeout.procedure}</p>
            <p>Site: {workflow.preOp.timeout.site}</p>
            <p>Position: {workflow.preOp.timeout.position}</p>
            <p>Implants: {workflow.preOp.timeout.implants}</p>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Implant & Supply Costing">
          <div className="space-y-3 text-sm text-gray-700">
            {workflow.supplies.implants.map((implant) => (
              <div key={implant.item} className="rounded-lg border border-gray-100 p-3">
                <p className="font-semibold text-gray-900">{implant.item}</p>
                <p className="text-xs text-gray-500">Lot {implant.lot} · Size {implant.size}</p>
                <p className="text-sm font-semibold text-slate-900">${implant.cost.toLocaleString()}</p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
              <span>Total Implant Cost</span>
              <span>${totalImplantCost.toLocaleString()}</span>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Post-op Plan">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Recovery: {workflow.postOp.recovery}</p>
            <p>Disposition: {workflow.postOp.disposition}</p>
            <p>Pain: {workflow.postOp.painManagement}</p>
            <p>Mobilization: {workflow.postOp.mobilization}</p>
            <p>Estimated LOS: {workflow.postOp.estimatedLOS}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function MedicationAdministrationWorkflowView({ workflow }: { workflow: MedicationAdministrationWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{workflow.medication.name}</h2>
          <p className="text-sm text-gray-500">{workflow.medication.indication}</p>
        </div>
        {workflow.medication.highAlert && <StatusBadge label="High Alert" tone="critical" />}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Patient">
          <div className="space-y-2">
            <InfoRow label="MRN" value={workflow.patient.mrn} />
            <InfoRow label="Name" value={workflow.patient.name} />
            <InfoRow label="Weight" value={workflow.patient.weight} />
            <InfoRow label="Creatinine" value={workflow.patient.creatinine} />
            <p className="text-xs text-rose-600">Allergies: {workflow.patient.allergies.join(", ")}</p>
          </div>
        </SectionCard>
        <SectionCard title="Medication">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Dose: {workflow.medication.dose}</p>
            <p>Route: {workflow.medication.route}</p>
            <p>Frequency: {workflow.medication.frequency}</p>
            <p>Schedule: {workflow.administration.scheduledTime}</p>
          </div>
        </SectionCard>
        <SectionCard title="Administration">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Nurse: {workflow.administration.nurse}</p>
            <p>Barcode scan: {workflow.administration.barcodeScan.timestamp}</p>
            <p>Double-check: {workflow.administration.doubleCheck.verifiedBy}</p>
            <p>Given at {workflow.administration.administration.time}</p>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Five Rights">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(workflow.administration.fiveRights).map(([right, value]) => (
              <div key={right} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
                <Syringe className={`h-4 w-4 ${value ? "text-emerald-600" : "text-amber-500"}`} />
                <span className="capitalize">{right.replace("right", "Right ")}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Documentation">
          <div className="space-y-2 text-sm text-gray-700">
            <p>MAR: {workflow.documentation.mar}</p>
            <p>Vitals: BP {workflow.documentation.vitals.bp} · Pulse {workflow.documentation.vitals.pulse}</p>
            <p>Pain Score: {workflow.documentation.painScore}</p>
            <p>Education: {workflow.documentation.education.join(", ")}</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function CriticalLabWorkflowView({ workflow }: { workflow: LabResultsWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Critical Lab Notification</h2>
          <p className="text-sm text-gray-500">Patient {workflow.patient.name} · {workflow.patient.location}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge label="STAT" tone="critical" />
          <StatusBadge label={workflow.results.timestamp} />
        </div>
      </div>

      <SectionCard title="Critical Values">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Test</th>
                <th className="px-3 py-2 text-left">Value</th>
                <th className="px-3 py-2 text-left">Reference</th>
                <th className="px-3 py-2 text-left">Severity</th>
              </tr>
            </thead>
            <tbody>
              {workflow.results.criticalValues.map((cv) => (
                <tr key={cv.test} className="border-t">
                  <td className="px-3 py-2">{cv.test}</td>
                  <td className="px-3 py-2 font-semibold text-rose-600">
                    <span className="inline-flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> {cv.value}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{cv.reference}</td>
                  <td className="px-3 py-2">
                    <StatusBadge
                      label={cv.severity}
                      tone={cv.severity === "Life threatening" ? "critical" : "warning"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Notification">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Method: {workflow.results.notification.method}</p>
            <p>Provider: {workflow.results.notification.notifiedProvider}</p>
            <p>Time: {workflow.results.notification.time}</p>
            <p>Read-back: {workflow.results.notification.readBack}</p>
            <p>Orders: {workflow.results.notification.orders.join(", ")}</p>
          </div>
        </SectionCard>
        <SectionCard title="Actions">
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">Medications</p>
              {workflow.actions.medications.map((med) => (
                <p key={med.name} className="text-xs text-gray-600">
                  {med.name} {med.dose ?? ""} {med.route ?? ""} {med.time ?? med.status ?? ""}
                </p>
              ))}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Repeat Testing</p>
              <p>{workflow.actions.repeat.test} @ {workflow.actions.repeat.scheduledTime}</p>
              <p className="text-xs text-gray-500">{workflow.actions.repeat.reason}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Escalation</p>
              <p>Rapid Response: {workflow.actions.escalation.rapidResponse ? "Activated" : "Not triggered"}</p>
              <p>Consult: {workflow.actions.escalation.consultRequested}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function DischargePlanningWorkflowView({ workflow }: { workflow: DischargeWorkflow }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Complex Discharge</h2>
          <p className="text-sm text-gray-500">LOS {workflow.patient.los} days · {workflow.patient.diagnosis}</p>
        </div>
        <StatusBadge label={`Target ${workflow.planning.estimatedDischarge}`} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Patient Context">
          <div className="space-y-2 text-sm">
            <InfoRow label="MRN" value={workflow.patient.mrn} />
            <InfoRow label="Age" value={workflow.patient.age} />
            <InfoRow label="Support" value={workflow.patient.socialSupport} />
            <InfoRow label="Insurance" value={workflow.patient.insurance} />
          </div>
        </SectionCard>
        <SectionCard title="Barriers">
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            {workflow.planning.barriers.map((barrier) => (
              <li key={barrier}>{barrier}</li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Needs">
          <div className="text-sm text-gray-700">
            <p className="font-semibold">Medical</p>
            <p className="text-xs">{workflow.planning.needs.medical.join(", ")}</p>
            <p className="mt-2 font-semibold">Functional</p>
            <p className="text-xs">{workflow.planning.needs.functional.join(", ")}</p>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard title="Services">
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">Home Health</p>
              <p>{workflow.services.homeHealth.agency}</p>
              <p>{workflow.services.homeHealth.frequency}</p>
              <p>Disciplines: {workflow.services.homeHealth.disciplines.join(", ")}</p>
              <p>Start: {workflow.services.homeHealth.startDate}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">DME</p>
              {workflow.services.dme.map((dme) => (
                <p key={dme.item} className="text-xs text-gray-600">
                  {dme.item} · {dme.status} (Delivery {dme.delivery})
                </p>
              ))}
            </div>
            <div>
              <p className="font-semibold text-gray-900">Medications</p>
              <p>New scripts: {workflow.services.medications.newPrescriptions}</p>
              <p>Prior Auth: {workflow.services.medications.priorAuth.join(", ")}</p>
              <p>Copay: {workflow.services.medications.copayAssistance}</p>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Education & Follow-up">
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-semibold text-gray-900">Education Topics</p>
              <p className="text-xs">{workflow.education.topics.join(", ")}</p>
              <p className="text-xs text-gray-500">Teach-back: {workflow.education.teachBack.understanding}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Materials</p>
              <p className="text-xs">{workflow.education.materials.join(", ")}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Follow-up</p>
              <p className="text-xs">PCP {workflow.followUp.primaryCare.date} · Cardiology {workflow.followUp.cardiology.date}</p>
              <p className="text-xs">Labs {workflow.followUp.labs.tests} {workflow.followUp.labs.date}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SupplyChainWorkflowView({ workflow }: { workflow: SupplyChainWorkflow }) {
  const implant = workflow.items[0];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{workflow.category}</h2>
          <p className="text-sm text-gray-500">Linked surgery {workflow.surgery}</p>
        </div>
        <StatusBadge label={implant.margin < 0 ? `Margin $${implant.margin}` : "Positive Margin"} tone={implant.margin < 0 ? "critical" : "success"} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Implant Summary">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Manufacturer: {implant.manufacturer}</p>
            <p>Model: {implant.model}</p>
            <p>Cost: ${implant.cost.toLocaleString()}</p>
            <p>Reimbursement: {implant.reimbursement}</p>
          </div>
        </SectionCard>
        <SectionCard title="Consignment">
          <div className="space-y-2 text-sm text-gray-700">
            <p>Vendor: {workflow.consignment.vendor}</p>
            <p>Delivered: {workflow.consignment.delivered}</p>
            <p>Verified: {workflow.consignment.verified ? "Yes" : "No"}</p>
            <p>Return by {workflow.consignment.returnBy}</p>
          </div>
        </SectionCard>
        <SectionCard title="Documentation">
          <div className="space-y-1 text-sm text-gray-700">
            <p>Implant log: {workflow.documentation.implantLog}</p>
            <p>Sticker chart: {workflow.documentation.stickerChart}</p>
            <p>Billing: {workflow.documentation.billing}</p>
            <p>Registry: {workflow.documentation.registry}</p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Component Tracking">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Part</th>
                <th className="px-3 py-2 text-left">Size</th>
                <th className="px-3 py-2 text-left">Lot</th>
                <th className="px-3 py-2 text-left">UDI</th>
              </tr>
            </thead>
            <tbody>
              {implant.components.map((component) => (
                <tr key={component.part} className="border-t">
                  <td className="px-3 py-2">{component.part}</td>
                  <td className="px-3 py-2">{component.size}</td>
                  <td className="px-3 py-2">{component.lot}</td>
                  <td className="px-3 py-2 font-mono text-xs">{component.udi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Sterilization & Chain of Custody">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-gray-700">
            <p>Sterilized {workflow.tracking.sterilization.date}</p>
            <p>Method: {workflow.tracking.sterilization.method}</p>
            <p>Cycles: {workflow.tracking.sterilization.cycles}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-gray-700">
            <p>Chain: {workflow.tracking.chainOfCustody.join(" → ")}</p>
            <p>Warranty: {workflow.tracking.warranty}</p>
            <p>Patient Notice: {workflow.tracking.patientNotification}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
