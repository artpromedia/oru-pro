"use client";

import { useState } from "react";
import { CheckCircle, Clock, DollarSign, Fuel, MapPin, Thermometer, Truck, Users } from "lucide-react";

type DeliveryStatus = "in_transit" | "loading" | "scheduled" | "delivered";
type DeliveryPriority = "high" | "medium" | "low";

type Delivery = {
  id: string;
  customer: string;
  address: string;
  items: number;
  weight: string;
  status: DeliveryStatus;
  driver: string;
  vehicle: string;
  eta?: string;
  scheduledTime?: string;
  temperature?: string;
  distance?: string;
  progress?: number;
  coldChain: boolean;
  priority: DeliveryPriority;
};

type FleetVehicle = {
  id: string;
  type: string;
  status: "in_transit" | "idle" | "loading" | "maintenance";
  driver: string;
  location: { lat: number; lng: number } | string;
  speed?: number;
  fuel: number;
  temperature?: string;
  nextMaintenance?: string;
  capacity: string;
  utilization?: number;
};

type RoutePlan = {
  id: string;
  name: string;
  stops: number;
  totalDistance: string;
  estimatedTime: string;
  fuelCost: string;
  optimized: boolean;
  savings?: string;
};

type ColdChainAlertItem = {
  vehicle: string;
  type: string;
  message: string;
  severity: "warning" | "info" | "critical";
  time: string;
};

const deliveries: Delivery[] = [
  {
    id: "DEL-2025-1847",
    customer: "Whole Foods Store #234",
    address: "123 Market St, Chicago",
    items: 24,
    weight: "847 kg",
    status: "in_transit",
    driver: "John Smith",
    vehicle: "TRK-001",
    eta: "2025-11-15 14:30",
    temperature: "3.2°C",
    distance: "45 km",
    progress: 67,
    coldChain: true,
    priority: "high",
  },
  {
    id: "DEL-2025-1848",
    customer: "Restaurant Depot",
    address: "456 Industrial Ave, Chicago",
    items: 18,
    weight: "523 kg",
    status: "loading",
    driver: "Mike Johnson",
    vehicle: "TRK-003",
    scheduledTime: "2025-11-15 15:00",
    coldChain: false,
    priority: "medium",
  },
  {
    id: "DEL-2025-1849",
    customer: "Central Market",
    address: "789 Commerce Blvd, Evanston",
    items: 36,
    weight: "1250 kg",
    status: "scheduled",
    driver: "Sarah Davis",
    vehicle: "TRK-002",
    scheduledTime: "2025-11-15 16:00",
    coldChain: true,
    priority: "medium",
  },
];

const fleet: FleetVehicle[] = [
  {
    id: "TRK-001",
    type: "Refrigerated Truck",
    status: "in_transit",
    driver: "John Smith",
    location: { lat: 41.8781, lng: -87.6298 },
    speed: 45,
    fuel: 67,
    temperature: "3.2°C",
    nextMaintenance: "2025-11-20",
    capacity: "5000 kg",
    utilization: 84,
  },
  {
    id: "TRK-002",
    type: "Refrigerated Van",
    status: "idle",
    driver: "Sarah Davis",
    location: { lat: 41.8827, lng: -87.6233 },
    fuel: 89,
    temperature: "4.1°C",
    capacity: "2000 kg",
    utilization: 0,
  },
  {
    id: "TRK-003",
    type: "Box Truck",
    status: "loading",
    driver: "Mike Johnson",
    location: "Warehouse",
    fuel: 92,
    capacity: "3500 kg",
    utilization: 45,
  },
];

const routes: RoutePlan[] = [
  {
    id: "RT-2025-001",
    name: "North Chicago Route",
    stops: 5,
    totalDistance: "67 km",
    estimatedTime: "3.5 hours",
    fuelCost: "$45",
    optimized: true,
    savings: "12 km, $8",
  },
  {
    id: "RT-2025-002",
    name: "Downtown Express",
    stops: 3,
    totalDistance: "34 km",
    estimatedTime: "2 hours",
    fuelCost: "$28",
    optimized: true,
    savings: "5 km, $3",
  },
];

const coldChainAlerts: ColdChainAlertItem[] = [
  {
    vehicle: "TRK-001",
    type: "temperature",
    message: "Temperature rising: 3.8°C (threshold 4°C)",
    severity: "warning",
    time: "10 mins ago",
  },
  {
    vehicle: "TRK-002",
    type: "door",
    message: "Cargo door opened for 5 minutes",
    severity: "info",
    time: "25 mins ago",
  },
];

export default function LogisticsDashboard() {
  const [selectedView, setSelectedView] = useState<"deliveries" | "map">("deliveries");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transportation Management</h1>
          <p className="text-sm text-gray-500">Real-time fleet and delivery tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Route Planner
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
            New Delivery
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <TMSMetric icon={Truck} label="Active Deliveries" value="12" />
        <TMSMetric icon={CheckCircle} label="On-Time Rate" value="96%" status="success" />
        <TMSMetric icon={Thermometer} label="Cold Chain" value="100%" status="success" />
        <TMSMetric icon={MapPin} label="Avg Distance" value="47 km" />
        <TMSMetric icon={Clock} label="Avg Time" value="2.3 hrs" />
        <TMSMetric icon={Fuel} label="Fuel Efficiency" value="8.2 L/100km" />
        <TMSMetric icon={DollarSign} label="Cost/Delivery" value="$67" />
        <TMSMetric icon={Users} label="Drivers Active" value="8/10" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Deliveries</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedView("deliveries")}
                  className={`rounded px-3 py-1 text-sm ${selectedView === "deliveries" ? "bg-blue-100 text-blue-700" : "text-gray-600"}`}
                >
                  List View
                </button>
                <button
                  onClick={() => setSelectedView("map")}
                  className={`rounded px-3 py-1 text-sm ${selectedView === "map" ? "bg-blue-100 text-blue-700" : "text-gray-600"}`}
                >
                  Map View
                </button>
              </div>
            </div>

            {selectedView === "deliveries" ? (
              <div className="space-y-4">
                {deliveries.map((delivery) => (
                  <DeliveryCard key={delivery.id} delivery={delivery} />
                ))}
              </div>
            ) : (
              <div className="flex h-96 items-center justify-center rounded-xl bg-gray-100">
                <span className="text-sm text-gray-500">Interactive Map View</span>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Optimized Routes</h2>
            <div className="mt-4 space-y-3">
              {routes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Fleet Status</h2>
            <div className="mt-4 space-y-3">
              {fleet.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isSelected={selectedVehicle === vehicle.id}
                  onSelect={() => setSelectedVehicle(vehicle.id)}
                />
              ))}
            </div>
            {selectedVehicle && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                Monitoring <span className="font-semibold">{selectedVehicle}</span> for cold chain adherence
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Cold Chain Alerts</h2>
            <div className="mt-4 space-y-3">
              {coldChainAlerts.map((alert, index) => (
                <ColdChainAlert key={`${alert.vehicle}-${index}`} alert={alert} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

type DeliveryCardProps = {
  delivery: Delivery;
};

function DeliveryCard({ delivery }: DeliveryCardProps) {
  const statusColors: Record<DeliveryStatus, string> = {
    in_transit: "bg-blue-100 text-blue-700",
    loading: "bg-yellow-100 text-yellow-700",
    scheduled: "bg-gray-100 text-gray-700",
    delivered: "bg-green-100 text-green-700",
  };

  const priorityBorders: Record<DeliveryPriority, string> = {
    high: "border-red-500",
    medium: "border-yellow-500",
    low: "border-gray-300",
  };

  return (
    <div className={`rounded-xl border border-gray-200 p-4 shadow-sm ${priorityBorders[delivery.priority]} border-l-4`}>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{delivery.id}</h3>
            <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[delivery.status]}`}>
              {delivery.status.replace("_", " ")}
            </span>
            {delivery.coldChain && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                <Thermometer className="h-3 w-3" /> Cold Chain
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">{delivery.customer}</p>
          <p className="text-xs text-gray-500">{delivery.address}</p>
        </div>
        <div className="text-sm text-gray-600">
          {delivery.eta ? (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-400">ETA</p>
              <p className="font-semibold text-gray-900">{delivery.eta}</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-400">Scheduled</p>
              <p className="font-semibold text-gray-900">{delivery.scheduledTime}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Items</p>
          <p className="font-semibold text-gray-900">{delivery.items}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Weight</p>
          <p className="font-semibold text-gray-900">{delivery.weight}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Driver</p>
          <p className="font-semibold text-gray-900">{delivery.driver}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Vehicle</p>
          <p className="font-semibold text-gray-900">{delivery.vehicle}</p>
        </div>
      </div>

      {delivery.status === "in_transit" && delivery.progress !== undefined && (
        <>
          <div className="mb-2">
            <div className="mb-1 flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>
                {delivery.progress}% · {delivery.distance}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div className="h-2 rounded-full bg-blue-500" style={{ width: `${delivery.progress}%` }} />
            </div>
          </div>
          {delivery.temperature && (
            <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
              <span>Temperature: {delivery.temperature}</span>
              <CheckCircle className="h-3 w-3" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

type VehicleCardProps = {
  vehicle: FleetVehicle;
  isSelected: boolean;
  onSelect: () => void;
};

function VehicleCard({ vehicle, isSelected, onSelect }: VehicleCardProps) {
  const statusColors: Record<FleetVehicle["status"], string> = {
    in_transit: "bg-blue-100 text-blue-700",
    idle: "bg-gray-100 text-gray-700",
    loading: "bg-yellow-100 text-yellow-700",
    maintenance: "bg-red-100 text-red-700",
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-xl border border-gray-200 p-3 text-left shadow-sm transition ${isSelected ? "ring-2 ring-blue-500" : "hover:border-blue-200"}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{vehicle.id}</span>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusColors[vehicle.status]}`}>
          {vehicle.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-xs text-gray-600">{vehicle.type}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-gray-500">Driver</p>
          <p className="font-medium text-gray-900">{vehicle.driver}</p>
        </div>
        <div>
          <p className="text-gray-500">Fuel</p>
          <p className="font-medium text-gray-900">{vehicle.fuel}%</p>
        </div>
        {vehicle.temperature && (
          <div>
            <p className="text-gray-500">Temp</p>
            <p className="font-medium text-green-600">{vehicle.temperature}</p>
          </div>
        )}
        {vehicle.utilization !== undefined && (
          <div>
            <p className="text-gray-500">Load</p>
            <p className="font-medium text-gray-900">{vehicle.utilization}%</p>
          </div>
        )}
      </div>
    </button>
  );
}

type RouteCardProps = {
  route: RoutePlan;
};

function RouteCard({ route }: RouteCardProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{route.name}</p>
        <p className="text-xs text-gray-500">
          {route.stops} stops • {route.totalDistance} • {route.estimatedTime}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{route.fuelCost}</p>
        {route.optimized && <p className="text-xs text-green-600">Saved: {route.savings}</p>}
      </div>
    </div>
  );
}

type ColdChainAlertProps = {
  alert: ColdChainAlertItem;
};

function ColdChainAlert({ alert }: ColdChainAlertProps) {
  const severityStyles: Record<ColdChainAlertItem["severity"], string> = {
    warning: "bg-orange-50 border-orange-200",
    info: "bg-blue-50 border-blue-200",
    critical: "bg-red-50 border-red-200",
  };

  return (
    <div className={`rounded-xl border p-3 ${severityStyles[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{alert.vehicle}</p>
          <p className="text-xs text-gray-600">{alert.message}</p>
        </div>
        <span className="text-xs text-gray-500">{alert.time}</span>
      </div>
    </div>
  );
}

type TMSMetricProps = {
  icon: typeof Truck;
  label: string;
  value: string;
  status?: "success" | "default";
};

function TMSMetric({ icon: Icon, label, value, status = "default" }: TMSMetricProps) {
  const color = status === "success" ? "text-green-600" : "text-gray-900";

  return (
    <div className="rounded-xl bg-white p-4 text-left shadow-sm">
      <Icon className={`h-4 w-4 ${status === "success" ? "text-green-500" : "text-gray-500"}`} />
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
