import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "accent" | "success" | "warning";
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = "default" 
}: StatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "accent":
        return "border-hotel-accent/20 bg-gradient-to-br from-hotel-accent/5 to-hotel-accent/10";
      case "success":
        return "border-hotel-success/20 bg-gradient-to-br from-hotel-success/5 to-hotel-success/10";
      case "warning":
        return "border-hotel-warning/20 bg-gradient-to-br from-hotel-warning/5 to-hotel-warning/10";
      default:
        return "border-hotel-primary/10 bg-gradient-card";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "accent":
        return "text-hotel-accent";
      case "success":
        return "text-hotel-success";
      case "warning":
        return "text-hotel-warning";
      default:
        return "text-hotel-primary";
    }
  };

  return (
    <Card className={`${getVariantStyles()} shadow-hotel transition-all duration-300 hover:shadow-elegant animate-scale-in`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getIconColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && trendValue && (
            <p className={`text-xs ${trend === "up" ? "text-hotel-success" : "text-destructive"}`}>
              {trend === "up" ? "↗" : "↘"} {trendValue}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}