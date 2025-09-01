
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuItemsTable } from "@/components/food-beverages/MenuItemsTable";
import { MenuItemForm } from "@/components/food-beverages/MenuItemForm";
import { CategoriesManager } from "@/components/food-beverages/CategoriesManager";
import { Plus, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const setSEO = (title: string, description: string, path: string) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
  meta.setAttribute("name", "description");
  meta.setAttribute("content", description);
  document.head.appendChild(meta);
  const link = document.querySelector('link[rel="canonical"]') || document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", `${window.location.origin}${path}`);
  document.head.appendChild(link);
};

export default function FoodBeverages() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setSEO("Food & Beverages Management | Oomaallah Hotel", "Manage menu items, categories, and F&B operations.", "/food-beverages");
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'modules')
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(Boolean((data?.value as any)?.restaurant ?? true));
        setChecked(true);
      });
  }, []);

  const handleAddNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
    });
    handleFormClose();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hotel-primary flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8" />
            Food & Beverages Management
          </h1>
          <p className="text-muted-foreground">Manage menu items, categories, and F&B operations.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-hotel-primary hover:bg-hotel-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </header>

      {!checked ? (
        <p>Loading...</p>
      ) : !enabled ? (
        <Card className="p-6 border rounded-lg bg-gradient-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-hotel-primary">Module disabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Ask an administrator to enable Restaurant in Settings.</p>
          </CardContent>
        </Card>
      ) : (
        <main className="space-y-6">
          <Tabs defaultValue="menu-items" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>

            <TabsContent value="menu-items" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Menu Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <MenuItemsTable 
                    onEdit={handleEdit}
                    refreshTrigger={refreshTrigger}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Categories Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoriesManager />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {showForm && (
            <MenuItemForm
              item={editingItem}
              onClose={handleFormClose}
              onSuccess={handleSuccess}
            />
          )}
        </main>
      )}
    </div>
  );
}
