import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, Scissors, CheckCircle, Award, Mail, Lock, LogOut, Phone, UserX, Eye, EyeOff, ChevronDown, List, Star as StarIcon, MapPin, Edit2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

const applyPhoneMask = (value: string) => {
  const v = value.replace(/\D/g, '').substring(0, 11);
  if (v.length <= 2) return v ? `(${v}` : '';
  if (v.length <= 6) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
  return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
};

export default function BookingFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [barberSchedule, setBarberSchedule] = useState<{start: string, end: string} | null>(null);
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Auth States
  const { customer, login, logout, loading: authLoading } = useAuth();
  const [loginEmail, setEmail] = useState('');
  const [loginPassword, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Guest States
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, barbersRes] = await Promise.all([
          axios.get(`${API_URL}/services`),
          axios.get(`${API_URL}/barbers`),
        ]);
        setServices(servicesRes.data);
        setBarbers(barbersRes.data);
      } catch (error) {
        toast.error('Erro ao carregar dados dos barbeiros.');
      }
    };
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedDate && selectedBarber) {
      const fetchBusySlots = async () => {
        try {
          const res = await axios.get(`${API_URL}/appointments/busy-slots`, {
            params: { date: selectedDate, barberId: selectedBarber.id }
          });
          setBusySlots(res.data.bookedTimes);
          setBarberSchedule(res.data.schedule);
        } catch (error) {
          console.error('Error fetching busy slots:', error);
        }
      };
      fetchBusySlots();
    }
  }, [selectedDate, selectedBarber]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/customer/login`, { email: loginEmail, password: loginPassword });
      login(res.data.token, res.data.customer);
      toast.success('Login realizado com sucesso!');
      setIsGuest(false);
      setStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro no login.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    setLoading(true);
    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const payload = isGuest 
        ? {
            customerName: guestName,
            customerPhone: guestPhone,
            startTime,
            serviceId: selectedService.id,
            barberId: selectedBarber.id,
            customerId: null
          }
        : {
            customerName: customer.name,
            customerPhone: customer.phone,
            startTime,
            serviceId: selectedService.id,
            barberId: selectedBarber.id,
            customerId: customer.id
          };

      await axios.post(`${API_URL}/appointments`, payload);
      toast.success('Agendamento realizado com sucesso!');
      setSuccess(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao agendar. Verifique se o horário está disponível.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    if (!customer && !isGuest) {
      setStep(4); // Force login first
      return;
    }

    if (isGuest && (!guestName || !guestPhone || guestPhone.length < 14)) {
      toast.error('Por favor, preencha seu nome e WhatsApp (completo) para entrar na fila.');
      return;
    }

    setLoading(true);
    try {
      const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
      await axios.post(`${API_URL}/waiting-list`, {
        customerName: customer ? customer.name : guestName,
        customerPhone: customer ? customer.phone : guestPhone,
        startTime,
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        customerId: customer?.id || null
      });
      toast.success('Você entrou na fila de espera!');
      setWaitlistSuccess(true);
    } catch (error: any) {
      toast.error('Erro ao entrar na fila de espera.');
    } finally {
      setLoading(false);
    }
  };

  const isTimeInSchedule = (time: string) => {
    if (!barberSchedule) return false;
    return time >= barberSchedule.start && time < barberSchedule.end;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    toast.success('Você saiu da conta.');
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Agendamento Realizado!</h2>
          <p className="text-gray-600 mb-6">Seu horário foi reservado com sucesso. Você receberá um lembrete em breve.</p>
          <button onClick={() => window.location.reload()} className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition">Novo Agendamento</button>
        </div>
      </div>
    );
  }

  if (waitlistSuccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-2">Você está na fila!</h2>
          <p className="text-gray-600 mb-8">Nós te avisaremos por WhatsApp caso o horário das **{selectedTime}** no dia **{format(new Date(selectedDate), 'dd/MM')}** fique disponível.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-black text-white p-4 rounded-2xl font-bold">Voltar ao Início</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 relative text-gray-900">
      <div className="fixed top-4 right-4 z-50" ref={menuRef}>
        {customer ? (
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="bg-black text-white w-12 h-12 rounded-full flex items-center justify-center font-bold hover:bg-gray-800 transition shadow-2xl border-2 border-white"
            >
              {getInitials(customer.name)}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-sm font-black text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                </div>
                <div className="py-1">
                  <button onClick={() => navigate('/my-account')} className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <List size={16} className="mr-3 text-gray-400" /> Histórico de Agendamentos
                  </button>
                  <button onClick={() => navigate('/my-account?tab=evaluations')} className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <StarIcon size={16} className="mr-3 text-gray-400" /> Minhas Avaliações
                  </button>
                  <button onClick={() => navigate('/my-account?edit=true')} className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <User size={16} className="mr-3 text-gray-400" /> Alterar Meus Dados
                  </button>
                </div>
                <div className="border-t border-gray-50 pt-1">
                  <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-bold">
                    <LogOut size={16} className="mr-3" /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => navigate('/my-account?returnTo=booking')}
            className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold flex items-center hover:bg-gray-800 transition shadow-2xl"
          >
            <User size={18} className="mr-2" />
            Entrar / Cadastrar
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-black mb-2 tracking-tighter">SCHEASY v2.0</h1>
          <p className="text-gray-500">Agende seu estilo com os melhores profissionais.</p>
        </header>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b h-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex-1 ${step >= i ? 'bg-black' : 'bg-gray-100'}`} />
            ))}
          </div>

          <div className="p-8 md:p-12">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-black mb-8 flex items-center"><Scissors className="mr-3" /> Escolha o Serviço</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <button key={service.id} onClick={() => { setSelectedService(service); setStep(2); }} className={`p-6 border-2 rounded-2xl text-left transition group ${selectedService?.id === service.id ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}>
                      <div className="font-black text-xl mb-1">{service.name}</div>
                      <div className={`text-sm mb-4 ${selectedService?.id === service.id ? 'text-gray-400' : 'text-gray-500'}`}>{service.description}</div>
                      <div className="flex items-center font-bold">
                         <span className="text-lg">R$ {service.price.toFixed(2)}</span>
                         <span className="mx-2 opacity-30">•</span>
                         <span className="text-xs uppercase tracking-widest">{service.duration}min</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-black mb-8 flex items-center"><User className="mr-3" /> Profissional</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {barbers.map((barber) => (
                    <button key={barber.id} onClick={() => { setSelectedBarber(barber); setStep(3); }} className={`p-8 border-2 rounded-3xl text-center transition ${selectedBarber?.id === barber.id ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}>
                      <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black ${selectedBarber?.id === barber.id ? 'bg-white text-black' : 'bg-gray-100 text-gray-400'}`}>
                        {barber.name[0]}
                      </div>
                      <div className="font-black text-lg">{barber.name}</div>
                      <div className={`text-xs uppercase mt-1 ${selectedBarber?.id === barber.id ? 'text-gray-400' : 'text-gray-400'}`}>Disponível hoje</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="mt-12 text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest flex items-center transition"><ChevronDown className="rotate-90 mr-1" size={16} /> Voltar</button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-black mb-8 flex items-center"><Calendar className="mr-3" /> Data e Horário</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <label className="block text-xs font-black uppercase text-gray-400 tracking-widest">Selecione o Dia</label>
                     <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }} className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-black outline-none font-bold text-lg transition" />
                     
                     {selectedTime && busySlots.includes(selectedTime) && (
                        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
                           <div className="flex items-center text-purple-900 font-black mb-2"><AlertCircle size={20} className="mr-2" /> Horário Ocupado</div>
                           <p className="text-sm text-purple-700 mb-4">Este horário já foi reservado por outro cliente. Deseja entrar na fila de espera para ser avisado caso ocorra uma desistência?</p>
                           <button onClick={handleWaitlist} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black text-sm hover:bg-purple-700 transition">ENTRAR NA FILA DE ESPERA</button>
                        </div>
                     )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-4 text-center">Horários</label>
                    <div className="grid grid-cols-4 gap-3">
                      {TIME_SLOTS.map((time) => {
                        const isInSchedule = isTimeInSchedule(time);
                        const isBusy = busySlots.includes(time);
                        
                        if (!isInSchedule) return null;

                        return (
                          <button 
                            key={time} 
                            onClick={() => setSelectedTime(time)} 
                            className={`p-3 rounded-xl text-sm font-black border-2 transition ${
                              selectedTime === time ? 'bg-black border-black text-white' : 
                              isBusy ? 'bg-gray-50 border-gray-100 text-gray-300' : 'bg-white border-gray-100 hover:border-gray-300'
                            }`}
                          >
                            {time}
                            {isBusy && <div className="text-[8px] opacity-60">OCUPADO</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-12 border-t pt-8">
                  <button onClick={() => setStep(2)} className="text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest">Voltar</button>
                  <button disabled={!selectedDate || !selectedTime || busySlots.includes(selectedTime)} onClick={() => setStep(4)} className="bg-black text-white px-10 py-3 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-gray-800 transition disabled:opacity-20">Confirmar Seleção</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="max-w-4xl mx-auto">
                {(!customer && !isGuest) ? (
                  <div className="max-w-md mx-auto text-center py-6">
                    <Award className="w-16 h-16 text-purple-600 mx-auto mb-6" />
                    <h2 className="text-3xl font-black mb-2">Quase lá!</h2>
                    <p className="text-gray-500 mb-8">Entre na sua conta para confirmar e acumular pontos de fidelidade.</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4 text-left">
                      <div className="relative"><Mail className="absolute left-4 top-3.5 text-gray-400" size={18} /><input required type="email" value={loginEmail} onChange={e => setEmail(e.target.value)} className="w-full pl-12 p-3.5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black transition" placeholder="E-mail" /></div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                        <input required type={showPassword ? 'text' : 'password'} value={loginPassword} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-12 p-3.5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black transition" placeholder="Senha" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-black">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                      </div>
                      <button type="submit" disabled={loading} className="w-full bg-black text-white p-4 rounded-2xl font-black shadow-lg hover:bg-gray-800 transition disabled:opacity-50">ENTRAR E FINALIZAR</button>
                    </form>

                    <div className="mt-8 flex flex-col space-y-3">
                      <button onClick={() => window.location.href = `${API_URL}/auth/google/customer`} className="w-full border-2 border-gray-100 p-4 rounded-2xl flex items-center justify-center font-bold hover:bg-gray-50 transition"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="G" />Continuar com Google</button>
                      <button onClick={() => setIsGuest(true)} className="w-full text-xs font-black text-gray-400 uppercase tracking-widest py-4 hover:text-black">Prosseguir como Convidado</button>
                    </div>
                  </div>
                ) : (selectedService && selectedBarber) ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h3 className="text-xl font-black mb-6 flex items-center"><User size={20} className="mr-2" /> Seus Dados</h3>
                      {customer ? (
                        <div className="bg-gray-50 p-8 rounded-3xl space-y-4">
                          <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome</label><div className="font-bold text-lg">{customer.name}</div></div>
                          <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">WhatsApp</label><div className="font-bold text-lg">{customer.phone}</div></div>
                          <div className="pt-4 border-t border-gray-200 mt-6 flex items-center text-purple-600">
                             <Award size={20} className="mr-2" />
                             <span className="font-black text-sm">{customer.loyaltyPoints} pontos acumulados</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-xs font-bold text-orange-800 flex items-start">
                             <AlertCircle size={16} className="mr-2 shrink-0" /> Você está agendando sem uma conta. Não acumulará pontos neste modo.
                          </div>
                          <input required placeholder="Nome Completo" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black" value={guestName} onChange={e => setGuestName(e.target.value)} />
                          <input required placeholder="WhatsApp (DDD + Número)" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-black" value={guestPhone} onChange={e => setGuestPhone(applyPhoneMask(e.target.value))} maxLength={15} />
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-black text-white p-10 rounded-[40px] shadow-2xl flex flex-col justify-between relative overflow-hidden">
                      <Scissors className="absolute -top-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-8 border-b border-white/10 pb-6 uppercase tracking-tighter">Resumo Final</h3>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px]">Serviço</span><span className="font-black text-lg">{selectedService.name}</span></div>
                          <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px]">Profissional</span><span className="font-black text-lg">{selectedBarber.name}</span></div>
                          <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px]">Data</span><span className="font-black text-lg">{format(new Date(selectedDate), "dd 'de' MMMM", { locale: ptBR })}</span></div>
                          <div className="flex justify-between items-center"><span className="text-gray-400 font-bold uppercase text-[10px]">Horário</span><span className="font-black text-3xl">{selectedTime}</span></div>
                        </div>
                      </div>
                      <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-end relative z-10">
                        <div><span className="text-gray-400 text-[10px] uppercase font-bold block mb-1">Total</span><span className="text-4xl font-black">R$ {selectedService.price.toFixed(2)}</span></div>
                        <button onClick={handleBooking} disabled={loading || (isGuest && (!guestName || !guestPhone))} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-lg hover:bg-gray-200 transition transform active:scale-95 disabled:opacity-20 shadow-xl">CONFIRMAR</button>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="mt-12 border-t pt-8 flex justify-center"><button onClick={() => setStep(3)} className="text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest underline">Alterar horário</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
