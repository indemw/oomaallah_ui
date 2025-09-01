import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HotelNavigation } from "@/components/HotelNavigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, UtensilsCrossed, ChefHat } from "lucide-react";

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

type Profile = { user_id: string; role: string };

type StockItem = { id: string; name: string; unit: string; current_quantity: number; minimum_quantity: number; category: string };

type StockMovement = {
  id: string;
  stock_item_id: string;
  movement_type: 'in' | 'out';
  quantity: number;
  reference_table: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
};

type StockRequest = {
  id: string;
  stock_item_id: string;
  quantity_requested: number;
  reason: string | null;
  urgency: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  created_at: string;
  request_type?: 'replenishment' | 'deduction';
};

export default function Stock() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [myRequests, setMyRequests] = useState<StockRequest[]>([]);
  const [pending, setPending] = useState<StockRequest[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  // form state
  const [stockItemId, setStockItemId] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [urgency, setUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>("normal");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<'replenishment' | 'deduction'>("replenishment");

  // receive stock (managers)
  const [receiveItemId, setReceiveItemId] = useState<string>("");
  const [receiveQty, setReceiveQty] = useState<number>(1);
  const [receiveNotes, setReceiveNotes] = useState<string>("");

  // create stock item (managers)
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newMin, setNewMin] = useState<number>(0);
  const [creating, setCreating] = useState(false);

  const isManager = useMemo(() => ['manager','admin','super_admin'].includes(profile?.role ?? ''), [profile]);

  useEffect(() => {
    setSEO(
      "Stock Management | Oomaallah Hotel",
      "Request stock replenishment and approve requests.",
      "/stock"
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      setUserId(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const { data: prof } = await supabase.from('profiles').select('user_id, role').eq('user_id', userId).maybeSingle();
      if (prof) setProfile(prof as Profile);

      const { data: stock } = await supabase.from('stock_items').select('id, name, unit, current_quantity, minimum_quantity, category').order('name');
      setItems((stock as unknown as StockItem[]) || []);

      // Load recent stock movements
      const { data: movements } = await supabase.from('stock_movements')
        .select('id, stock_item_id, movement_type, quantity, reference_table, reference_id, notes, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50);
      setMovements((movements as unknown as StockMovement[]) || []);

      const { data: mine } = await supabase.from('stock_requests')
        .select('id, stock_item_id, quantity_requested, reason, urgency, status, created_at, request_type')
        .order('created_at', { ascending: false });
      setMyRequests((mine as unknown as StockRequest[]) || []);

      if (isManager) {
        const { data: pend } = await supabase.from('stock_requests')
          .select('id, stock_item_id, quantity_requested, reason, urgency, status, created_at, request_type')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        setPending((pend as unknown as StockRequest[]) || []);
      }
    };

    load();
  }, [userId, isManager]);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !stockItemId || qty <= 0) return;
    setLoading(true);
    await supabase.from('stock_requests').insert({
      stock_item_id: stockItemId,
      quantity_requested: qty,
      reason: reason || null,
      urgency,
      requested_by: userId,
      request_type: requestType,
    });
    setLoading(false);
    setQty(1);
    setReason("");
    setUrgency("normal");
    setStockItemId("");
    const { data: mine } = await supabase.from('stock_requests')
      .select('id, stock_item_id, quantity_requested, reason, urgency, status, created_at, request_type')
      .order('created_at', { ascending: false });
    setMyRequests((mine as unknown as StockRequest[]) || []);
  };

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    if (!userId) return;

    // Apply side effects on approval (e.g., non-sales deduction)
    if (status === 'approved') {
      const req = pending.find((r) => r.id === id);
      if (req?.request_type === 'deduction') {
        // Deduct from stock and record movement
        const { data: item } = await supabase
          .from('stock_items')
          .select('current_quantity')
          .eq('id', req.stock_item_id)
          .maybeSingle();
        const newQty = Math.max(0, (item?.current_quantity ?? 0) - req.quantity_requested);
        await supabase.from('stock_items').update({ current_quantity: newQty }).eq('id', req.stock_item_id);
        await supabase.from('stock_movements').insert({
          stock_item_id: req.stock_item_id,
          movement_type: 'out',
          quantity: req.quantity_requested,
          reference_table: 'stock_requests',
          reference_id: id,
          notes: req.reason || 'Non-sales deduction',
          created_by: userId,
        });
        // refresh stock items view
        const { data: stock } = await supabase
          .from('stock_items')
          .select('id, name, unit, current_quantity, minimum_quantity, category')
          .order('name');
        setItems((stock as unknown as StockItem[]) || []);
      }
    }

    await supabase
      .from('stock_requests')
      .update({
        status,
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id);

    const { data: pend } = await supabase
      .from('stock_requests')
      .select('id, stock_item_id, quantity_requested, reason, urgency, status, created_at, request_type')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPending((pend as unknown as StockRequest[]) || []);
  };

  const receiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager || !userId || !receiveItemId || receiveQty <= 0) return;

    await supabase.from('stock_movements').insert({
      stock_item_id: receiveItemId,
      movement_type: 'in',
      quantity: receiveQty,
      reference_table: 'manual_receive',
      reference_id: null,
      notes: receiveNotes || null,
      created_by: userId,
    });

    const { data: item } = await supabase
      .from('stock_items')
      .select('current_quantity')
      .eq('id', receiveItemId)
      .maybeSingle();
    const newQty = (item?.current_quantity ?? 0) + receiveQty;
    await supabase
      .from('stock_items')
      .update({ current_quantity: newQty })
      .eq('id', receiveItemId);

    const { data: stock } = await supabase
      .from('stock_items')
      .select('id, name, unit, current_quantity, minimum_quantity, category')
      .order('name');
    setItems((stock as unknown as StockItem[]) || []);

    // Refresh movements
    const { data: movements } = await supabase.from('stock_movements')
      .select('id, stock_item_id, movement_type, quantity, reference_table, reference_id, notes, created_at, created_by')
      .order('created_at', { ascending: false })
      .limit(50);
    setMovements((movements as unknown as StockMovement[]) || []);

    setReceiveItemId("");
    setReceiveQty(1);
    setReceiveNotes("");
  };

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    if (!newName.trim() || !newUnit.trim() || !newCategory.trim()) return;
    setCreating(true);
    try {
      await supabase.from('stock_items').insert({
        name: newName.trim(),
        unit: newUnit.trim(),
        category: newCategory.trim(),
        minimum_quantity: Number(newMin) || 0,
      });
      const { data: stock } = await supabase
        .from('stock_items')
        .select('id, name, unit, current_quantity, minimum_quantity, category')
        .order('name');
      setItems((stock as unknown as StockItem[]) || []);
      setNewName("");
      setNewUnit("");
      setNewCategory("");
      setNewMin(0);
    } finally {
      setCreating(false);
    }
  };

  const lowStockItems = items.filter(item => item.current_quantity <= item.minimum_quantity);
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + item.current_quantity, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      low: "bg-green-100 text-green-800",
      normal: "bg-blue-100 text-blue-800", 
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };
    return <Badge className={variants[urgency as keyof typeof variants] || variants.normal}>{urgency}</Badge>;
  };

  return (
    <>
      <HotelNavigation />
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-hotel-primary">Stock Management</h1>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>{totalItems} Items</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span>{lowStockItems.length} Low Stock</span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="movements">Movements</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {isManager && (
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add Stock Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={createItem} className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Name</Label>
                          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Mineral Water 500ml" />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit</Label>
                          <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="e.g. bottle, kg, pack" />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Beverages" />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Qty</Label>
                          <Input type="number" min={0} value={newMin} onChange={(e) => setNewMin(parseInt(e.target.value || '0', 10))} />
                        </div>
                        <div className="md:col-span-2">
                          <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Item'}</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Receive Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={receiveStock} className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label>Item</Label>
                          <Select value={receiveItemId} onValueChange={setReceiveItemId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map(i => (
                                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <Input type="number" min={1} value={receiveQty} onChange={(e) => setReceiveQty(parseInt(e.target.value || '0', 10))} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Notes</Label>
                          <Textarea value={receiveNotes} onChange={(e) => setReceiveNotes(e.target.value)} placeholder="Supplier / GRN / remarks" />
                        </div>
                        <div className="md:col-span-2">
                          <Button type="submit">Add Stock</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Stock Levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Current</TableHead>
                        <TableHead className="text-right">Min</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(i => (
                        <TableRow key={i.id} className={i.current_quantity <= i.minimum_quantity ? "bg-destructive/5" : undefined}>
                          <TableCell className="font-medium">{i.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{i.category}</Badge>
                          </TableCell>
                          <TableCell>{i.unit}</TableCell>
                          <TableCell className="text-right">{i.current_quantity}</TableCell>
                          <TableCell className="text-right">{i.minimum_quantity}</TableCell>
                          <TableCell>
                            {i.current_quantity <= i.minimum_quantity ? (
                              <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="secondary">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">No stock items yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitRequest} className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stock Item</Label>
                      <Select value={stockItemId} onValueChange={setStockItemId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.name} ({i.category})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value || '0', 10))} />
                    </div>

                    <div className="space-y-2">
                      <Label>Request Type</Label>
                      <Select value={requestType} onValueChange={(v) => setRequestType(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="replenishment">Replenishment (Add Stock)</SelectItem>
                          <SelectItem value="deduction">Deduction (Non-sales)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Urgency</Label>
                      <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Reason</Label>
                      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this needed?" />
                    </div>

                    <div className="md:col-span-2">
                      <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>My Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {myRequests.map(r => {
                        const item = items.find(i => i.id === r.stock_item_id);
                        return (
                          <div key={r.id} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(r.status)}
                                <span className="font-medium">{item?.name || 'Unknown Item'}</span>
                              </div>
                              {getUrgencyBadge(r.urgency)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Qty: {r.quantity_requested} | Type: {r.request_type}</p>
                              <p>{new Date(r.created_at).toLocaleString()}</p>
                              {r.reason && <p className="italic">"{r.reason}"</p>}
                            </div>
                          </div>
                        );
                      })}
                      {myRequests.length === 0 && <p className="text-muted-foreground">No requests yet.</p>}
                    </div>
                  </CardContent>
                </Card>

                {isManager && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Approvals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {pending.map(r => {
                          const item = items.find(i => i.id === r.stock_item_id);
                          return (
                            <div key={r.id} className="p-3 border rounded-md space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{item?.name || 'Unknown Item'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Qty: {r.quantity_requested} | Type: {r.request_type}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                                  {r.reason && <p className="text-sm italic mt-1">"{r.reason}"</p>}
                                </div>
                                {getUrgencyBadge(r.urgency)}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => decide(r.id, 'approved')}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => decide(r.id, 'rejected')}>Reject</Button>
                              </div>
                            </div>
                          );
                        })}
                        {pending.length === 0 && <p className="text-muted-foreground">No pending requests.</p>}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="movements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Stock Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map(m => {
                        const item = items.find(i => i.id === m.stock_item_id);
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{item?.name || 'Unknown Item'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {m.movement_type === 'in' ? (
                                  <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span className={m.movement_type === 'in' ? 'text-green-600' : 'text-red-600'}>
                                  {m.movement_type === 'in' ? 'Stock In' : 'Stock Out'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{m.quantity}</TableCell>
                            <TableCell>{m.reference_table || 'Manual'}</TableCell>
                            <TableCell>{m.notes || '-'}</TableCell>
                            <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                          </TableRow>
                        );
                      })}
                      {movements.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">No movements recorded yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stock Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Items:</span>
                        <span className="font-medium">{totalItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Low Stock Items:</span>
                        <span className="font-medium text-orange-600">{lowStockItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Units:</span>
                        <span className="font-medium">{totalValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Categories:</span>
                        <span className="font-medium">{new Set(items.map(i => i.category)).size}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setActiveTab("requests")}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Make Request
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => window.open('/restaurant', '_blank')}
                    >
                      <UtensilsCrossed className="h-4 w-4 mr-2" />
                      View Restaurant
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => window.open('/food-beverages', '_blank')}
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      Manage Menu Items
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Low Stock Alert</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lowStockItems.length > 0 ? (
                      <div className="space-y-2">
                        {lowStockItems.slice(0, 5).map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="truncate">{item.name}</span>
                            <Badge variant="destructive" className="text-xs">
                              {item.current_quantity}/{item.minimum_quantity}
                            </Badge>
                          </div>
                        ))}
                        {lowStockItems.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            +{lowStockItems.length - 5} more items
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">All items are adequately stocked.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </>
  );
}