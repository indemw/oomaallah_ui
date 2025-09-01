
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  station: string;
  is_active: boolean;
  tax_rate: number;
  created_at: string;
}

interface MenuItemsTableProps {
  onEdit: (item: MenuItem) => void;
  refreshTrigger: number;
}

export function MenuItemsTable({ onEdit, refreshTrigger }: MenuItemsTableProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, [refreshTrigger]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("menu_items")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Item ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
      loadItems();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      loadItems();
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading menu items...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.category}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.station === 'bar' ? 'secondary' : 'default'}>
                  {item.station.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>MWK {item.price.toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={item.is_active ? 'default' : 'secondary'}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleActive(item.id, item.is_active)}
                  >
                    {item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id, item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No menu items found. Add your first menu item to get started.
        </div>
      )}
    </div>
  );
}
