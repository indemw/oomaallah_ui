import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { LucideIcon, ArrowRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  onClick?: () => void;
  variant?: "primary" | "accent" | "secondary";
}

export function ModuleCard({ 
  title, 
  description, 
  icon: Icon, 
  features, 
  onClick,
  variant = "primary" 
}: ModuleCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "accent":
        return "border-hotel-accent/20 bg-gradient-to-br from-hotel-accent/5 to-hotel-accent/10 hover:from-hotel-accent/10 hover:to-hotel-accent/20";
      case "secondary":
        return "border-hotel-primary/10 bg-gradient-to-br from-secondary/50 to-secondary hover:from-secondary to-secondary/80";
      default:
        return "border-hotel-primary/20 bg-gradient-card hover:shadow-elegant";
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case "accent":
        return "text-hotel-accent";
      case "secondary":
        return "text-hotel-primary-light";
      default:
        return "text-hotel-primary";
    }
  };

  return (
    <Card className={`${getVariantStyles()} shadow-hotel transition-all duration-300 cursor-pointer animate-fade-in group`} onClick={onClick}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Icon className={`h-8 w-8 ${getIconColor()}`} />
          <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {features.slice(0, 3).map((feature, index) => (
            <li key={index} className="text-sm text-muted-foreground flex items-center">
              <span className="w-1.5 h-1.5 bg-hotel-accent rounded-full mr-2"></span>
              {feature}
            </li>
          ))}
          {features.length > 3 && (
            <li className="text-sm text-muted-foreground">
              + {features.length - 3} more features
            </li>
          )}
        </ul>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-4 w-full group-hover:bg-hotel-primary group-hover:text-white transition-colors"
        >
          Access Module
        </Button>
      </CardContent>
    </Card>
  );
}