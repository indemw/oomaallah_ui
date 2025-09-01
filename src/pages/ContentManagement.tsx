import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { HotelNavigation } from "@/components/HotelNavigation";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

type ContentItem = {
  id: string;
  section: string;
  key: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function ContentManagement() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);
  const [newContent, setNewContent] = useState({
    section: "homepage",
    key: "",
    title: "",
    content: "",
    is_active: true
  });

  const predefinedSections = [
    "homepage", "about", "services", "gallery", "contact", 
    "dining", "rooms", "facilities", "events", "footer"
  ];

  useEffect(() => {
    setSEO("Content Management | Oomaallah Hotel", "Manage website content and sections.", "/content");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate('/auth');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/auth');
      else loadUserRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    setUserRole(profile?.role || null);
    if (profile?.role === 'super_admin') {
      await loadContent();
    }
    setLoading(false);
  };

  const loadContent = async () => {
    const { data, error } = await supabase
      .from('website_content' as any)
      .select('*')
      .order('section', { ascending: true })
      .order('key', { ascending: true });

    if (error) {
      toast({
        title: "Error loading content",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setContent((data as unknown as ContentItem[]) || []);
    }
  };

  const saveContent = async () => {
    const contentToSave = editingContent || newContent;
    
    if (!contentToSave.key || !contentToSave.title) {
      toast({
        title: "Missing fields",
        description: "Key and title are required.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await (supabase as any)
      .from('website_content')
      .upsert({
        id: editingContent?.id,
        section: contentToSave.section,
        key: contentToSave.key,
        title: contentToSave.title,
        content: contentToSave.content,
        is_active: contentToSave.is_active
      }, {
        onConflict: 'section,key'
      });

    if (error) {
      toast({
        title: "Error saving content",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: editingContent ? "Content updated" : "Content saved",
        description: "Website content has been updated."
      });
      setNewContent({
        section: "homepage",
        key: "",
        title: "",
        content: "",
        is_active: true
      });
      setEditingContent(null);
      await loadContent();
    }
  };

  const startEditing = (item: ContentItem) => {
    setEditingContent(item);
  };

  const cancelEditing = () => {
    setEditingContent(null);
  };

  const toggleContentStatus = async (id: string, is_active: boolean) => {
    const { error } = await (supabase as any)
      .from('website_content')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error updating content",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setContent(prev => prev.map(item => 
        item.id === id ? { ...item, is_active } : item
      ));
    }
  };

  const deleteContent = async (id: string) => {
    const { error } = await (supabase as any)
      .from('website_content')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting content",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Content deleted",
        description: "Content has been removed."
      });
      setContent(prev => prev.filter(item => item.id !== id));
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  if (userRole !== 'super_admin') {
    return (
      <>
        <HotelNavigation />
        <main className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Only super admins can access content management.
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  const sections = Array.from(new Set(content.map(item => item.section)));

  return (
    <>
      <HotelNavigation />
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-8 space-y-8">
          <h1 className="text-3xl font-bold text-primary">Website Content Management</h1>
          
          <Tabs defaultValue="manage" className="w-full">
            <TabsList>
              <TabsTrigger value="manage">Manage Content</TabsTrigger>
              <TabsTrigger value="add">{editingContent ? "Edit Content" : "Add Content"}</TabsTrigger>
            </TabsList>

            <TabsContent value="add" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{editingContent ? "Edit Content" : "Add New Content"}</CardTitle>
                  {editingContent && (
                    <Button variant="outline" onClick={cancelEditing} className="w-fit">
                      Cancel Edit
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <select
                        id="section"
                        value={editingContent?.section || newContent.section}
                        onChange={(e) => {
                          if (editingContent) {
                            setEditingContent(prev => prev ? ({ ...prev, section: e.target.value }) : null);
                          } else {
                            setNewContent(prev => ({ ...prev, section: e.target.value }));
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {predefinedSections.map(section => (
                          <option key={section} value={section}>
                            {section.charAt(0).toUpperCase() + section.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key">Key</Label>
                      <Input
                        id="key"
                        value={editingContent?.key || newContent.key}
                        onChange={(e) => {
                          if (editingContent) {
                            setEditingContent(prev => prev ? ({ ...prev, key: e.target.value }) : null);
                          } else {
                            setNewContent(prev => ({ ...prev, key: e.target.value }));
                          }
                        }}
                        placeholder="e.g., hero_title, about_description"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editingContent?.title || newContent.title}
                      onChange={(e) => {
                        if (editingContent) {
                          setEditingContent(prev => prev ? ({ ...prev, title: e.target.value }) : null);
                        } else {
                          setNewContent(prev => ({ ...prev, title: e.target.value }));
                        }
                      }}
                      placeholder="Content title for management"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={editingContent?.content || newContent.content}
                      onChange={(e) => {
                        if (editingContent) {
                          setEditingContent(prev => prev ? ({ ...prev, content: e.target.value }) : null);
                        } else {
                          setNewContent(prev => ({ ...prev, content: e.target.value }));
                        }
                      }}
                      placeholder="Enter the content..."
                      className="min-h-32"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={editingContent?.is_active ?? newContent.is_active}
                      onCheckedChange={(checked) => {
                        if (editingContent) {
                          setEditingContent(prev => prev ? ({ ...prev, is_active: checked }) : null);
                        } else {
                          setNewContent(prev => ({ ...prev, is_active: checked }));
                        }
                      }}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <Button onClick={saveContent} className="w-full">
                    {editingContent ? "Update Content" : "Save Content"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              {sections.map(section => (
                <Card key={section}>
                  <CardHeader>
                    <CardTitle className="capitalize">{section} Section</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {content
                        .filter(item => item.section === section)
                        .map(item => (
                           <div key={item.id} className="border rounded-lg p-4 space-y-2">
                             <div className="flex items-center justify-between">
                               <div>
                                 <h4 className="font-medium">{item.title}</h4>
                                 <p className="text-sm text-muted-foreground">Key: {item.key}</p>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <Switch
                                   checked={item.is_active}
                                   onCheckedChange={(checked) => toggleContentStatus(item.id, checked)}
                                 />
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => startEditing(item)}
                                 >
                                   Edit
                                 </Button>
                                 <Button
                                   variant="destructive"
                                   size="sm"
                                   onClick={() => deleteContent(item.id)}
                                 >
                                   Delete
                                 </Button>
                               </div>
                             </div>
                             <p className="text-sm">{item.content}</p>
                           </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {content.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No content found. Add some content to get started.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </>
  );
}