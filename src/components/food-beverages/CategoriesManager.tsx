
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CategoryStat {
  category: string;
  count: number;
  active_count: number;
}

export function CategoriesManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("category, is_active")
      .not("category", "is", null);

    if (data) {
      const categoryStats = data.reduce((acc: { [key: string]: CategoryStat }, item) => {
        const cat = item.category;
        if (!acc[cat]) {
          acc[cat] = { category: cat, count: 0, active_count: 0 };
        }
        acc[cat].count++;
        if (item.is_active) {
          acc[cat].active_count++;
        }
        return acc;
      }, {});

      setCategories(Object.values(categoryStats).sort((a, b) => a.category.localeCompare(b.category)));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.category.toLowerCase() === newCategory.toLowerCase())) {
      toast({
        title: "Category Exists",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Create a placeholder item for the new category
    const { error } = await supabase
      .from("menu_items")
      .insert([{
        name: `${newCategory} - Sample Item`,
        category: newCategory,
        price: 0,
        station: 'kitchen',
        is_active: false,
        description: 'Sample item - please replace with actual menu items'
      }]);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setNewCategory("");
      loadCategories();
    }
  };

  const handleDeleteCategory = async (category: string) => {
    const categoryData = categories.find(cat => cat.category === category);
    if (!categoryData) return;

    if (categoryData.count > 1) {
      toast({
        title: "Cannot Delete",
        description: `Category "${category}" has ${categoryData.count} items. Delete the items first.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${category}" and its items?`)) return;

    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("category", category);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      loadCategories();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-category">Add New Category</Label>
              <Input
                id="new-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              />
            </div>
            <Button 
              onClick={handleAddCategory} 
              disabled={loading}
              className="bg-hotel-primary hover:bg-hotel-primary/90 mt-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Existing Categories</h3>
        {categories.length === 0 ? (
          <p className="text-muted-foreground">No categories found. Add your first category above.</p>
        ) : (
          <div className="grid gap-2">
            {categories.map((cat) => (
              <Card key={cat.category}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{cat.category}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {cat.count} item{cat.count !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant={cat.active_count > 0 ? "default" : "secondary"}>
                          {cat.active_count} active
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(cat.category)}
                      disabled={cat.count > 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
