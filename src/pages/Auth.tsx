import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthService from "@/service/AuthService";

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
const authService=new AuthService();
export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSEO(
      "Login & Signup | Oomaallah Hotel",
      "Secure login and signup for Oomaallah Hotel staff portal.",
      "/auth"
    );

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { data,error } = await await authService.register({ email, password });
        if (error) {

           setError(data.message ?? "Authentication failed")
        } 
         else{
             localStorage.setItem("access_token", data.token);
           navigate(redirectUrl)
         }
      } else {
        const { data,error } = await authService.authenticate({ email, password });
        if (error) {
           setError(data.message ?? "Authentication failed");
        }
        else{
          navigate('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-hotel-primary">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && (
              <p className="text-destructive text-sm" role="alert">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Sign up" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground text-center">
            {isSignUp ? (
              <button className="underline" onClick={() => setIsSignUp(false)}>Have an account? Sign in</button>
            ) : (
              <button className="underline" onClick={() => setIsSignUp(true)}>New here? Create an account</button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
