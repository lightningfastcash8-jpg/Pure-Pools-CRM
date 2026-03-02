"use client";

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Camera, Save, ArrowLeft, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WorkOrderDetail {
  id: string;
  type: string;
  workflow_stage: string;
  status: string;
  scheduled_date: string | null;
  product_issue: string;
  notes: string;
  attachment_urls: string[];
  created_at: string;
  customer: any;
  primary_asset: any;
}

export default function WorkOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadWorkOrder();
  }, [params.id]);

  const loadWorkOrder = async () => {
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
      .eq("id", params.id)
      .single();

    if (!error && data) {
      setWorkOrder(data as any);
      setNotes(data.notes || "");
      setPhotos(data.attachment_urls || []);
      if (data.scheduled_date) {
        setScheduledDate(new Date(data.scheduled_date));
      }
    }
    setLoading(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCapturing(true);
    } catch (error) {
      console.error("Camera access error:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const fileName = `${params.id}/${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from("work-order-photos")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
        });

      if (!error && data) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("work-order-photos").getPublicUrl(data.path);

        const newPhotos = [...photos, publicUrl];
        setPhotos(newPhotos);

        await supabase
          .from("work_orders")
          .update({ attachment_urls: newPhotos })
          .eq("id", params.id);
      }
    }, "image/jpeg");

    stopCamera();
  };

  const removePhoto = async (photoUrl: string) => {
    const newPhotos = photos.filter((p) => p !== photoUrl);
    setPhotos(newPhotos);

    await supabase
      .from("work_orders")
      .update({ attachment_urls: newPhotos })
      .eq("id", params.id);
  };

  const saveWorkOrder = async () => {
    const updates: any = {
      notes,
      attachment_urls: photos,
    };

    if (scheduledDate) {
      updates.scheduled_date = format(scheduledDate, "yyyy-MM-dd");
      updates.workflow_stage = "scheduled";
      updates.status = "scheduled";
    }

    const { error } = await supabase
      .from("work_orders")
      .update(updates)
      .eq("id", params.id);

    if (!error) {
      window.location.href = "/work-orders";
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="text-center py-12">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  if (!workOrder) {
    return (
      <AppLayout>
        <div className="p-8">
          <div className="text-center py-12">Work order not found</div>
        </div>
      </AppLayout>
    );
  }

  const customer = workOrder.customer;
  const asset = workOrder.primary_asset;

  return (
    <AppLayout>
      <div className="p-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => (window.location.href = "/work-orders")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Work Orders
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Customer</Label>
                  <div className="text-lg font-semibold mt-1">
                    {customer.first_name} {customer.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {customer.address_line1}, {customer.city}, {customer.state}{" "}
                    {customer.zip}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {customer.phone} | {customer.email}
                  </div>
                </div>

                {asset && (
                  <div>
                    <Label>Equipment</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{asset.asset_type}</div>
                      <div className="text-sm text-gray-600">
                        {asset.brand} {asset.model_raw}
                      </div>
                      <div className="text-sm text-gray-600">S/N: {asset.serial}</div>
                    </div>
                  </div>
                )}

                {workOrder.product_issue && (
                  <div>
                    <Label>Issue Description</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                      {workOrder.product_issue}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="scheduled-date">Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start mt-1">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? (
                          format(scheduledDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="mt-1"
                    placeholder="Add notes about this work order..."
                  />
                </div>

                <Button onClick={saveWorkOrder} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Work Order
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!capturing ? (
                  <Button onClick={startCamera} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="flex gap-2">
                      <Button onClick={capturePhoto} className="flex-1">
                        Capture
                      </Button>
                      <Button onClick={stopCamera} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {photos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Attached Photos ({photos.length})</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhoto(photo)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
