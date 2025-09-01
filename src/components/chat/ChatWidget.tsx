import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export default function ChatWidget() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    // Ensure General room exists and fetch its id
    const init = async () => {
      const { data, error } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("name", "General")
        .maybeSingle();
      if (error) {
        console.error(error);
        toast({ title: "Chat error", description: error.message, variant: "destructive" });
        return;
      }
      if (data?.id) setRoomId(data.id);
    };
    init();
  }, [userId, toast]);

  useEffect(() => {
    if (!roomId) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, room_id, user_id, content, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error(error);
        toast({ title: "Chat error", description: error.message, variant: "destructive" });
        return;
      }
      setMessages(data || []);
      // scroll to bottom
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    };
    load();

    // Realtime inserts
    const channel = supabase
      .channel("chat_messages_room_" + roomId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 25);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, toast]);

  const send = async () => {
    if (!input.trim() || !roomId || !userId) return;
    const text = input.trim();
    setInput("");
    const { error } = await supabase.from("chat_messages").insert({ room_id: roomId, user_id: userId, content: text });
    if (error) {
      console.error(error);
      toast({ title: "Send failed", description: error.message, variant: "destructive" });
    }
  };

  const toggle = () => setOpen((o) => !o);

  if (!userId) return null; // Only for logged-in staff

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <Card className="w-[22rem] h-[28rem] shadow-lg flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h2 className="text-sm font-semibold">Staff Chat — General</h2>
            <Button size="sm" variant="ghost" onClick={toggle}>Close</Button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={m.user_id === userId ? "text-right" : "text-left"}>
                <div className={
                  "inline-block rounded-md px-3 py-2 text-sm " +
                  (m.user_id === userId ? "bg-primary/10" : "bg-muted")
                }>
                  <div>{m.content}</div>
                  <div className="text-xs opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <Button onClick={send}>Send</Button>
          </div>
        </Card>
      )}
      <Button onClick={toggle} className="shadow-lg">{open ? "Hide Chat" : "Chat"}</Button>
    </div>
  );
}
