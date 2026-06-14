import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, LogOut, Calendar, Award, Scissors, Clock, Mail, Lock, Phone, ArrowLeft, Star, XCircle, ChevronRight, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'appointments' | 'evaluations'>('appointments');
  const [showPassword, setShowPassword] = useState(false);
  
  // Login/Register States
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const token = localStorage.getItem('customerToken');

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/customer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomer(res.data);
    } catch (err) {
      localStorage.removeItem('customerToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/customer/login`, { email, password });
      localStorage.setItem('customerToken', res.data.token);
      setCustomer(res.data.customer);
      const params = new URLSearchParams(window.location.search);
      if (params.get('returnTo') === 'booking') window.location.href = '/';
      else fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro no login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/customer/register`, { name, email, password, phone });
      localStorage.setItem('customerToken', res.data.token);
      setCustomer(res.data.customer);
      const params = new URLSearchParams(window.location.search);
      if (params.get('returnTo') === 'booking') window.location.href = '/';
      else fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro no cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      await axios.post(`${API_URL}/customer/appointments/${appId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Agendamento cancelado com sucesso. Você recebeu uma confirmação no WhatsApp.');
      fetchProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao cancelar agendamento.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/customer`;
  };

  const logout = () => {
    localStorage.removeItem('customerToken');
    setCustomer(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  if (customer) {
    const upcoming = customer.appointments.filter((a: any) => new Date(a.startTime) > new Date() && a.status !== 'CANCELLED');
    const past = customer.appointments.filter((a: any) => new Date(a.startTime) <= new Date() || a.status === 'CANCELLED');
    const ratings = customer.appointments.filter((a: any) => a.rating).map((a: any) => ({ ...a.rating, service: a.service, barber: a.barber, startTime: a.startTime }));

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-black mb-8 transition group">
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition" /> Voltar para o Início
          </button>

          <header className="bg-black text-white p-8 rounded-3xl shadow-2xl mb-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-black mb-1">Olá, {customer.name}!</h1>
                <p className="text-gray-400 flex items-center"><Mail size={14} className="mr-2" /> {customer.email}</p>
              </div>
              <div className="mt-6 md:mt-0 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[140px]">
                <div className="text-[10px] uppercase font-bold text-purple-300 tracking-widest mb-1">Cartão Fidelidade</div>
                <div className="text-4xl font-black">{customer.loyaltyPoints}</div>
                <div className="text-[9px] text-gray-400 mt-1">PONTOS ACUMULADOS</div>
              </div>
            </div>
            {/* Background Decoration */}
            <Award className="absolute -bottom-6 -right-6 text-white/5 w-48 h-48 rotate-12" />
          </header>

          {/* Sub-tabs Navigation */}
          <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setActiveSubTab('appointments')}
              className={`flex-1 flex items-center justify-center py-3 rounded-lg text-sm font-bold transition ${activeSubTab === 'appointments' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Calendar size={16} className="mr-2" /> Agendamentos
            </button>
            <button 
              onClick={() => setActiveSubTab('evaluations')}
              className={`flex-1 flex items-center justify-center py-3 rounded-lg text-sm font-bold transition ${activeSubTab === 'evaluations' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Star size={16} className="mr-2" /> Minhas Avaliações
            </button>
          </div>

          <div className="space-y-8">
            {activeSubTab === 'appointments' ? (
              <>
                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold mb-4 flex items-center">Próximos atendimentos <span className="ml-2 bg-black text-white text-[10px] px-2 py-0.5 rounded-full">{upcoming.length}</span></h3>
                    <div className="grid gap-4">
                      {upcoming.map((app: any) => (
                        <div key={app.id} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-l-black group hover:shadow-md transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-black text-xl">{app.service.name}</div>
                              <div className="text-gray-500 flex items-center mt-1">
                                <User size={14} className="mr-1 text-gray-400" /> {app.barber.name}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleCancel(app.id)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition flex items-center text-xs font-bold"
                            >
                              <XCircle size={16} className="mr-1" /> CANCELAR
                            </button>
                          </div>
                          <div className="flex items-center space-x-6 mt-6 pt-4 border-t border-gray-50 text-sm">
                            <div className="flex items-center font-bold"><Calendar size={16} className="mr-2 text-gray-400" /> {format(new Date(app.startTime), "dd 'de' MMMM", { locale: ptBR })}</div>
                            <div className="flex items-center font-bold"><Clock size={16} className="mr-2 text-gray-400" /> {format(new Date(app.startTime), "HH:mm")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Past History */}
                <section>
                  <h3 className="text-lg font-bold mb-4 text-gray-400 uppercase tracking-tighter">Histórico completo</h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                    {past.length > 0 ? past.map((app: any) => (
                      <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${app.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {app.status === 'COMPLETED' ? <Award size={20} /> : <Clock size={20} />}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{app.service.name}</div>
                            <div className="text-[10px] text-gray-400 uppercase font-medium">{format(new Date(app.startTime), "dd/MM/yyyy")} com {app.barber.name}</div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                          app.status === 'COMPLETED' ? 'text-green-600' : 
                          app.status === 'CANCELLED' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {app.status === 'COMPLETED' ? 'CONCLUÍDO' : app.status === 'CANCELLED' ? 'CANCELADO' : app.status}
                        </span>
                      </div>
                    )) : (
                      <div className="p-12 text-center text-gray-400 text-sm italic">Nenhum registro anterior.</div>
                    )}
                  </div>
                </section>
              </>
            ) : (
              /* Evaluations History */
              <section className="space-y-4">
                {ratings.length > 0 ? ratings.map((r: any) => (
                  <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="font-bold">{r.service.name}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{format(new Date(r.startTime), "dd 'de' MMMM", { locale: ptBR })}</div>
                      </div>
                      <div className="flex items-center bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-black text-sm">
                        <Star size={14} className="mr-1" fill="currentColor" /> {r.score}
                      </div>
                    </div>
                    {r.comment && (
                      <div className="bg-gray-50 p-4 rounded-xl text-sm italic text-gray-600 flex items-start">
                        <MessageSquare size={16} className="mr-3 text-gray-300 shrink-0 mt-1" />
                        "{r.comment}"
                      </div>
                    )}
                    <div className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Profissional: {r.barber.name}</div>
                  </div>
                )) : (
                  <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-gray-200">
                    <Star className="mx-auto text-gray-200 mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Você ainda não avaliou nenhum serviço.</p>
                  </div>
                )}
              </section>
            )}
            
            <button 
              onClick={logout}
              className="w-full text-red-500 flex items-center justify-center font-bold py-6 hover:bg-red-50 rounded-3xl transition border-2 border-transparent hover:border-red-100"
            >
              <LogOut size={20} className="mr-2" /> Sair da Minha Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
            <Award className="text-white w-10 h-10 -rotate-3" />
          </div>
          <h1 className="text-3xl font-black">{isRegistering ? 'Criar Conta' : 'Acessar Clube'}</h1>
          <p className="text-gray-500 mt-2">
            {isRegistering ? 'Cadastre-se para acumular pontos' : 'Veja seus pontos e gerencie seus horários'}
          </p>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition outline-none" placeholder="João Silva" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition outline-none" placeholder="71 99999-9999" />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition outline-none" placeholder="seu@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input 
                required 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full pl-12 pr-12 p-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-black transition outline-none" 
                placeholder="••••••••" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-black transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-xs text-center font-bold p-3 rounded-xl">{error}</div>}

          <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-black text-lg hover:bg-gray-800 transform active:scale-[0.98] transition shadow-lg">
            {isRegistering ? 'CADASTRAR' : 'ENTRAR'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="px-3 bg-white text-gray-400">Ou use sua conta</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full border border-gray-200 p-4 rounded-2xl flex items-center justify-center font-bold hover:bg-gray-50 transition shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
            Continuar com Google
          </button>
        </div>

        <button 
          onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
          className="w-full text-xs font-bold text-gray-400 mt-8 hover:text-black uppercase tracking-widest transition"
        >
          {isRegistering ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se aqui'}
        </button>
      </div>
    </div>
  );
}
