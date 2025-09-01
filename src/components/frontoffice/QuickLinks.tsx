import { ModuleCard } from "@/components/ModuleCard";
import { CalendarDays, ClipboardList, Utensils, Presentation, Boxes } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickLinks() {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-hotel-primary">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ModuleCard
          title="Reservations"
          description="Bookings, allocation, and calendar"
          icon={CalendarDays}
          features={["Create bookings","Assign rooms","View occupancy calendar"]}
          onClick={() => navigate('/reservations')}
        />
        <ModuleCard
          title="Front Office Tasks"
          description="Arrivals, departures, and in-house"
          icon={ClipboardList}
          features={["Check-in/out","Guest details","Room status"]}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />
        <ModuleCard
          title="Restaurant"
          description="Dining and POS"
          icon={Utensils}
          features={["Restaurant menus","Orders","Billing"]}
          onClick={() => navigate('/restaurant')}
          variant="accent"
        />
        <ModuleCard
          title="Conference"
          description="Meetings and events"
          icon={Presentation}
          features={["Bookings","Layouts","Schedules"]}
          onClick={() => navigate('/conference')}
        />
        <ModuleCard
          title="Stock"
          description="Inventory and requests"
          icon={Boxes}
          features={["Stock levels","Requests","Approvals"]}
          onClick={() => navigate('/stock')}
          variant="secondary"
        />
      </div>
    </section>
  );
}
