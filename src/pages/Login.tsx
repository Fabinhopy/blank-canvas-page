import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import logo from '@/assets/logo-smartest.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError('Email ou senha inválidos. Tente novamente.');
      setLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative gradient-primary items-center justify-center overflow-hidden">
        {/* Geometric shapes inspired by logo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[10%] w-32 h-32 rounded-lg bg-white/5 rotate-12" />
          <div className="absolute top-[30%] right-[15%] w-48 h-48 rounded-lg bg-white/5 -rotate-6" />
          <div className="absolute bottom-[15%] left-[20%] w-40 h-40 rounded-lg bg-white/5 rotate-45" />
          <div className="absolute bottom-[30%] right-[25%] w-24 h-24 rounded-lg bg-white/10 rotate-12" />
          <div className="absolute top-[60%] left-[5%] w-20 h-20 rounded-lg bg-white/5 -rotate-12" />
        </div>
        <div className="relative z-10 text-center px-12 space-y-6">
          <img src={logo} alt="Smartest Solution" className="h-24 object-contain mx-auto brightness-0 invert" />
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Smartest Solution
          </h2>
          <p className="text-lg text-white/80 font-light">
            Solução inteligente para o seu negócio
          </p>
          <div className="w-16 h-1 bg-white/40 mx-auto rounded-full" />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center lg:hidden space-y-3">
            <img src={logo} alt="Smartest Solution" className="h-16 object-contain" />
            <p className="text-sm text-muted-foreground">Solução inteligente para o seu negócio</p>
          </div>

          {/* Login Card */}
          <Card className="border border-border/50 shadow-xl">
            <CardHeader className="space-y-1 text-center pb-2">
              <CardTitle className="text-2xl font-bold text-foreground">
                Área do Cliente
              </CardTitle>
              <CardDescription>
                Digite suas credenciais para acessar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Smartest Solution. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
