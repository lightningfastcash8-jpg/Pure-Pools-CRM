"use client";

import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { format, addDays, isWithinInterval, getDay } from "date-fns";
import {
  Settings,
  Play,
  Trash2,
  MapPin,
  Phone,
  Calendar as CalendarIcon,
} from "lucide-react";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
}

interface Appointment {
  id: string;
  scheduled_date: string;
  status: string;
  route_group: string;
  customer: Customer;
}

interface BlockedRange {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export default function SchedulerPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [enrolledCustomers, setEnrolledCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState(4);
  const [seasonStart, setSeasonStart] = useState({ month: 5, day: 15 });
  const [seasonEnd, setSeasonEnd] = useState({ month: 9, day: 15 });
  const [showSettings, setShowSettings] = useState(false);
  const [blockStart, setBlockStart] = useState<Date>();
  const [blockEnd, setBlockEnd] = useState<Date>();
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);

    const [settingsRes, appointmentsRes, blockedRes, customersRes] =
      await Promise.all([
        supabase.from("schedule_settings").select("*").limit(1).single(),
        supabase
          .from("appointments")
          .select(
            `
          *,
          customer:customers(*)
        `
          )
          .eq("appt_type", "heater_annual")
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("blocked_ranges")
          .select("*")
          .order("start_date", { ascending: true }),
        supabase
          .from("program_enrollments")
          .select(
            `
          *,
          customer:customers(*)
        `
          )
          .eq("program_type", "heater_annual")
          .eq("status", "active"),
      ]);

    if (settingsRes.data) {
      setMaxPerDay(settingsRes.data.max_per_day);
      setSeasonStart({
        month: settingsRes.data.season_start_month,
        day: settingsRes.data.season_start_day,
      });
      setSeasonEnd({
        month: settingsRes.data.season_end_month,
        day: settingsRes.data.season_end_day,
      });
    }

    if (appointmentsRes.data) {
      setAppointments(appointmentsRes.data as any);
    }

    if (blockedRes.data) {
      setBlockedRanges(blockedRes.data);
    }

    if (customersRes.data) {
      setEnrolledCustomers(customersRes.data);
    }

    setLoading(false);
  };

  const saveSettings = async () => {
    await supabase
      .from("schedule_settings")
      .update({
        max_per_day: maxPerDay,
        season_start_month: seasonStart.month,
        season_start_day: seasonStart.day,
        season_end_month: seasonEnd.month,
        season_end_day: seasonEnd.day,
      })
      .eq("id", (await supabase.from("schedule_settings").select("id").single()).data
        ?.id);

    setShowSettings(false);
  };

  const addBlockedRange = async () => {
    if (!blockStart || !blockEnd) return;

    await supabase.from("blocked_ranges").insert({
      start_date: format(blockStart, "yyyy-MM-dd"),
      end_date: format(blockEnd, "yyyy-MM-dd"),
      reason: blockReason || "Blocked",
    });

    setBlockStart(undefined);
    setBlockEnd(undefined);
    setBlockReason("");
    loadData();
  };

  const removeBlockedRange = async (id: string) => {
    await supabase.from("blocked_ranges").delete().eq("id", id);
    loadData();
  };

  const isDateBlocked = (checkDate: Date): boolean => {
    return blockedRanges.some((range) =>
      isWithinInterval(checkDate, {
        start: new Date(range.start_date),
        end: new Date(range.end_date),
      })
    );
  };

  const isWorkingDay = (checkDate: Date): boolean => {
    const day = getDay(checkDate);
    return day >= 2 && day <= 4;
  };

  const getAppointmentsForDate = (checkDate: string): Appointment[] => {
    return appointments.filter((apt) => apt.scheduled_date === checkDate);
  };

  const autoScheduleAll = async () => {
    const currentYear = new Date().getFullYear();
    const seasonStartDate = new Date(
      currentYear,
      seasonStart.month - 1,
      seasonStart.day
    );
    const seasonEndDate = new Date(currentYear, seasonEnd.month - 1, seasonEnd.day);

    const unscheduledCustomers = enrolledCustomers.filter(
      (enrollment) =>
        !appointments.some(
          (apt) =>
            apt.customer.id === enrollment.customer.id &&
            new Date(apt.scheduled_date).getFullYear() === currentYear
        )
    );

    const customersByStreet = unscheduledCustomers.reduce((acc: any, enrollment) => {
      const street = enrollment.customer.address_line1
        .replace(/\d+/g, "")
        .trim()
        .toLowerCase();
      if (!acc[street]) acc[street] = [];
      acc[street].push(enrollment);
      return acc;
    }, {});

    let currentDate = new Date(seasonStartDate);
    const newAppointments = [];

    for (const street in customersByStreet) {
      const customersOnStreet = customersByStreet[street];

      for (const enrollment of customersOnStreet) {
        while (currentDate <= seasonEndDate) {
          if (
            isWorkingDay(currentDate) &&
            !isDateBlocked(currentDate) &&
            getAppointmentsForDate(format(currentDate, "yyyy-MM-dd")).length <
              maxPerDay
          ) {
            const { data: workOrder } = await supabase
              .from("work_orders")
              .insert({
                customer_id: enrollment.customer.id,
                type: "heater_annual",
                status: "scheduled",
                workflow_stage: "scheduled",
                scheduled_date: format(currentDate, "yyyy-MM-dd"),
              })
              .select()
              .single();

            if (workOrder) {
              await supabase.from("appointments").insert({
                customer_id: enrollment.customer.id,
                work_order_id: workOrder.id,
                appt_type: "heater_annual",
                scheduled_date: format(currentDate, "yyyy-MM-dd"),
                status: "scheduled",
                route_group: street,
              });

              newAppointments.push({
                customer: enrollment.customer,
                date: format(currentDate, "yyyy-MM-dd"),
              });
            }

            break;
          }

          currentDate = addDays(currentDate, 1);
        }

        currentDate = addDays(currentDate, 0);
      }
    }

    await loadData();
    alert(`Scheduled ${newAppointments.length} appointments automatically!`);
  };

  const dayAppointments = date
    ? getAppointmentsForDate(format(date, "yyyy-MM-dd"))
    : [];
  const remainingSlots = maxPerDay - dayAppointments.length;

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Annual Service Scheduler
            </h1>
            <p className="text-gray-600 mt-1">
              Schedule heater annual services by street for efficient routing
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Schedule Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Max Appointments Per Day</Label>
                  <Input
                    type="number"
                    value={maxPerDay}
                    onChange={(e) => setMaxPerDay(parseInt(e.target.value))}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <Label>Season Start (Month/Day)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={seasonStart.month}
                      onChange={(e) =>
                        setSeasonStart({ ...seasonStart, month: parseInt(e.target.value) })
                      }
                      min={1}
                      max={12}
                      placeholder="Month"
                    />
                    <Input
                      type="number"
                      value={seasonStart.day}
                      onChange={(e) =>
                        setSeasonStart({ ...seasonStart, day: parseInt(e.target.value) })
                      }
                      min={1}
                      max={31}
                      placeholder="Day"
                    />
                  </div>
                </div>
                <div>
                  <Label>Season End (Month/Day)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={seasonEnd.month}
                      onChange={(e) =>
                        setSeasonEnd({ ...seasonEnd, month: parseInt(e.target.value) })
                      }
                      min={1}
                      max={12}
                      placeholder="Month"
                    />
                    <Input
                      type="number"
                      value={seasonEnd.day}
                      onChange={(e) =>
                        setSeasonEnd({ ...seasonEnd, day: parseInt(e.target.value) })
                      }
                      min={1}
                      max={31}
                      placeholder="Day"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label>Block Date Range</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <Input
                      type="date"
                      value={blockStart ? format(blockStart, "yyyy-MM-dd") : ""}
                      onChange={(e) => setBlockStart(new Date(e.target.value))}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={blockEnd ? format(blockEnd, "yyyy-MM-dd") : ""}
                      onChange={(e) => setBlockEnd(new Date(e.target.value))}
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Reason"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={addBlockedRange} size="sm" className="mt-2">
                  Add Blocked Range
                </Button>
              </div>

              {blockedRanges.length > 0 && (
                <div className="border-t pt-4">
                  <Label>Blocked Ranges</Label>
                  <div className="space-y-2 mt-2">
                    {blockedRanges.map((range) => (
                      <div
                        key={range.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="text-sm">
                          {format(new Date(range.start_date), "MMM d, yyyy")} -{" "}
                          {format(new Date(range.end_date), "MMM d, yyyy")}
                          <span className="text-gray-600 ml-2">{range.reason}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBlockedRange(range.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={saveSettings}>Save Settings</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Season:</span> {seasonStart.month}/
                  {seasonStart.day} - {seasonEnd.month}/{seasonEnd.day}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Working Days:</span> Tue, Wed, Thu
                </div>
                <div className="text-sm">
                  <span className="font-medium">Max Per Day:</span> {maxPerDay}
                </div>
              </div>
              <Button onClick={autoScheduleAll} className="w-full mt-4">
                <Play className="h-4 w-4 mr-2" />
                Auto-Schedule All
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {date && format(date, "EEEE, MMMM d, yyyy")}
                </CardTitle>
                <Badge variant={remainingSlots > 0 ? "default" : "secondary"}>
                  {remainingSlots} slots remaining
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : dayAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No appointments scheduled for this date
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((apt) => (
                    <Card key={apt.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-lg">
                            {apt.customer.first_name} {apt.customer.last_name}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {apt.customer.address_line1}, {apt.customer.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{apt.customer.phone}</span>
                          </div>
                          {apt.route_group && (
                            <Badge variant="outline" className="mt-2">
                              Route: {apt.route_group}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            (window.location.href = `/customers/${apt.customer.id}`)
                          }
                        >
                          Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
