"use client";

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Inbox,
  Calendar,
  Clock,
  Archive,
  Camera,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
}

interface Asset {
  id: string;
  asset_type: string;
  brand: string;
  model_raw: string;
  serial: string;
}

interface WorkOrder {
  id: string;
  type: string;
  workflow_stage: string;
  status: string;
  scheduled_date: string | null;
  product_issue: string;
  notes: string;
  attachment_urls: string[];
  created_at: string;
  customer: Customer;
  primary_asset: Asset | null;
}

export default function WorkOrdersPage() {
  const [activeTab, setActiveTab] = useState("today");
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select(
        `
        *,
        customer:customers(*),
        primary_asset:assets(*)
      `
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWorkOrders(data as any);
    }
    setLoading(false);
  };

  const filterWorkOrders = (stage: string) => {
    if (stage === "today") {
      const today = format(new Date(), "yyyy-MM-dd");
      return workOrders.filter(
        (wo) => wo.scheduled_date === today && wo.workflow_stage !== "filed"
      );
    }
    return workOrders.filter((wo) => wo.workflow_stage === stage);
  };

  const moveToStage = async (workOrderId: string, newStage: string) => {
    const updates: any = { workflow_stage: newStage };

    if (newStage === "scheduled") {
      updates.status = "scheduled";
    } else if (newStage === "filed") {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("work_orders")
      .update(updates)
      .eq("id", workOrderId);

    if (!error) {
      loadWorkOrders();
    }
  };

  const WorkOrderCard = ({ workOrder }: { workOrder: WorkOrder }) => {
    const customer = workOrder.customer;
    const asset = workOrder.primary_asset;

    return (
      <Card className="mb-4 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                {customer.first_name} {customer.last_name}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {customer.address_line1}, {customer.city}
                </span>
              </div>
            </div>
            <Badge variant={workOrder.type === "warranty" ? "destructive" : "default"}>
              {workOrder.type}
            </Badge>
          </div>

          {asset && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700">
                {asset.asset_type}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {asset.brand} {asset.model_raw} - S/N: {asset.serial}
              </div>
            </div>
          )}

          {workOrder.product_issue && (
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700">Issue:</div>
              <div className="text-sm text-gray-600">{workOrder.product_issue}</div>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            {customer.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </div>
            )}
          </div>

          {workOrder.scheduled_date && (
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Scheduled:</span>{" "}
              {format(new Date(workOrder.scheduled_date), "MMM d, yyyy")}
            </div>
          )}

          {workOrder.attachment_urls && workOrder.attachment_urls.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {workOrder.attachment_urls.length} photos attached
              </span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {workOrder.workflow_stage === "queued" && (
              <Button
                size="sm"
                onClick={() =>
                  (window.location.href = `/work-orders/${workOrder.id}`)
                }
              >
                Schedule
              </Button>
            )}

            {workOrder.workflow_stage === "scheduled" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  (window.location.href = `/work-orders/${workOrder.id}`)
                }
              >
                View Details
              </Button>
            )}

            {(workOrder.workflow_stage === "today" ||
              (workOrder.scheduled_date === format(new Date(), "yyyy-MM-dd") &&
                workOrder.workflow_stage === "scheduled")) && (
              <>
                <Button
                  size="sm"
                  onClick={() =>
                    (window.location.href = `/work-orders/${workOrder.id}`)
                  }
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => moveToStage(workOrder.id, "waiting_to_file")}
                >
                  Mark Complete
                </Button>
              </>
            )}

            {workOrder.workflow_stage === "waiting_to_file" && (
              <Button
                size="sm"
                onClick={() => moveToStage(workOrder.id, "filed")}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                File & Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const queuedOrders = filterWorkOrders("queued");
  const scheduledOrders = filterWorkOrders("scheduled");
  const todayOrders = filterWorkOrders("today");
  const waitingOrders = filterWorkOrders("waiting_to_file");
  const filedOrders = filterWorkOrders("filed");

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-600 mt-1">Manage your warranty and service workflow</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today ({todayOrders.length})
            </TabsTrigger>
            <TabsTrigger value="queued" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Queued ({queuedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled ({scheduledOrders.length})
            </TabsTrigger>
            <TabsTrigger value="waiting_to_file" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              To File ({waitingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="filed" className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Filed ({filedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : todayOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No work orders scheduled for today
              </div>
            ) : (
              todayOrders.map((wo) => <WorkOrderCard key={wo.id} workOrder={wo} />)
            )}
          </TabsContent>

          <TabsContent value="queued" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : queuedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No work orders in queue
              </div>
            ) : (
              queuedOrders.map((wo) => <WorkOrderCard key={wo.id} workOrder={wo} />)
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : scheduledOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No scheduled work orders
              </div>
            ) : (
              scheduledOrders.map((wo) => <WorkOrderCard key={wo.id} workOrder={wo} />)
            )}
          </TabsContent>

          <TabsContent value="waiting_to_file" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : waitingOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No work orders waiting to be filed
              </div>
            ) : (
              waitingOrders.map((wo) => <WorkOrderCard key={wo.id} workOrder={wo} />)
            )}
          </TabsContent>

          <TabsContent value="filed" className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : filedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No filed work orders</div>
            ) : (
              filedOrders.map((wo) => <WorkOrderCard key={wo.id} workOrder={wo} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
