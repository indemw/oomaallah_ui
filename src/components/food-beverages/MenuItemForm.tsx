
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MenuItemFormProps {
  item?: any;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function MenuItemForm({ item, onClose, onSuccess }: MenuItemFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    station: 'kitchen',
    is_active: true,
    tax_rate: '0.165'
  });

  useEffect(() => {
    loadCategories();
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || '',
        price: item.price?.toString() || '',
        station: item.station || 'kitchen',
        is_active: item.is_active ?? true,
        tax_rate: item.tax_rate?.toString() || '0.165'
      });
    }
  }, [item]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("category")
      .not("category", "is", null);
    
    if (data) {
      const uniqueCategories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));
      setCategories(uniqueCategories);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category,
      price: parseFloat(formData.price),
      station: formData.station,
      is_active: formData.is_active,
      tax_rate: parseFloat(formData.tax_rate)
    };

    let error;
    if (item) {
      const result = await supabase
        .from("menu_items")
        .update(payload)
        .eq("id", item.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("menu_items")
        .insert([payload]);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onSuccess(item ? "Menu item updated successfully" : "Menu item created successfully");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{item ? 'Edit Menu Item' : 'Add Menu Item'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter item description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or enter new category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="price">Price (MWK) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="station">Station</Label>
              <Select
                value={formData.station}
                onValueChange={(value) => setFormData({ ...formData, station: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tax_rate">Tax Rate</Label>
              <Select
                value={formData.tax_rate}
                onValueChange={(value) => setFormData({ ...formData, tax_rate: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (No Tax)</SelectItem>
                  <SelectItem value="0.165">16.5% (Standard VAT)</SelectItem>
                  <SelectItem value="0.20">20% (Premium VAT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-hotel-primary hover:bg-hotel-primary/90">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
