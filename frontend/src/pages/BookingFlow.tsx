import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, User, Scissors, CheckCircle, Award, Mail, Lock, LogOut, Phone, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

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
  const [token, setToken] = useState(localStorage.getItem('customerToken'));
  const [customer, setCustomer] = useState<any>(null);
  const [loginEmail, setEmail] = useState('');
  const [loginPassword, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Guest States
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
        console.error('Error fetching data:', error);
      }
    };
    fetchData();

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/customer/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomer(res.data);
    } catch (err) {
      setToken(null);
      localStorage.removeItem('customerToken');
    }
  };

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
    setAuthError('');
    try {
      const res = await axios.post(`${API_URL}/customer/login`, { email: loginEmail, password: loginPassword });
      localStorage.setItem('customerToken', res.data.token);
      setToken(res.data.token);
      setCustomer(res.data.customer);
      setIsGuest(false);
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Erro no login.');
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
      setSuccess(true);
    } catch (error) {
      alert('Erro ao agendar. Verifique se o horário está disponível.');
    } finally {
      setLoading(false);
    }
  };

  const isTimeInSchedule = (time: string) => {
    if (!barberSchedule) return false;
    return time >= barberSchedule.start && time < barberSchedule.end;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Agendamento Realizado!</h2>
          <p className="text-gray-600 mb-6">Seu horário foi reservado com sucesso. Você receberá um lembrete em breve.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
          >
            Novo Agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 relative">
      <button 
        onClick={() => navigate('/my-account')}
        className="fixed top-4 right-4 z-50 bg-black text-white px-6 py-3 rounded-full text-sm font-bold flex items-center hover:bg-gray-800 transition shadow-2xl"
      >
        <User size={18} className="mr-2" />
        {customer ? 'Minha Conta' : 'Entrar / Cadastrar'}
      </button>

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Barbearia Premium</h1>
          <p className="text-gray-600">Reserve seu horário e acumule pontos no clube</p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex border-b">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex-1 h-2 ${step >= i ? 'bg-black' : 'bg-gray-200'}`} />
            ))}
          </div>

          <div className="p-8">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center"><Scissors className="mr-2" /> Selecione o Serviço</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <button key={service.id} onClick={() => { setSelectedService(service); setStep(2); }} className={`p-4 border-2 rounded-xl text-left hover:border-black transition ${selectedService?.id === service.id ? 'border-black bg-gray-50' : 'border-gray-100'}`}>
                      <div className="font-bold text-lg">{service.name}</div>
                      <div className="text-gray-500 text-sm">{service.description}</div>
                      <div className="mt-2 font-mono text-black">R$ {service.price.toFixed(2)} • {service.duration}min</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center"><User className="mr-2" /> Escolha o Barbeiro</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {barbers.map((barber) => (
                    <button key={barber.id} onClick={() => { setSelectedBarber(barber); setStep(3); }} className={`p-6 border-2 rounded-xl text-center hover:border-black transition ${selectedBarber?.id === barber.id ? 'border-black bg-gray-50' : 'border-gray-100'}`}>
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center"><User className="text-gray-500" /></div>
                      <div className="font-bold">{barber.name}</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(1)} className="mt-8 text-gray-500 underline">Voltar</button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center"><Calendar className="mr-2" /> Data e Horário</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((time) => (isTimeInSchedule(time) && <button key={time} disabled={busySlots.includes(time)} onClick={() => setSelectedTime(time)} className={`p-2 border rounded-lg text-sm transition ${selectedTime === time ? 'bg-black text-white' : busySlots.includes(time) ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100' : 'hover:bg-gray-50 hover:border-black'}`}>{time}</button>))}
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <button onClick={() => setStep(2)} className="text-gray-500 underline">Voltar</button>
                  <button disabled={!selectedDate || !selectedTime} onClick={() => setStep(4)} className="bg-black text-white px-8 py-3 rounded-lg disabled:opacity-50">Próximo</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                {(!customer && !isGuest) ? (
                  <div className="max-w-md mx-auto text-center">
                    <Award className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Identifique-se</h2>
                    <p className="text-gray-500 mb-8">Para agendar e garantir seus pontos de fidelidade, entre na sua conta ou crie uma nova.</p>
                    
                    <form onSubmit={handleLogin} className="space-y-4 text-left">
                      <div>
                        <label className="block text-sm font-medium mb-1">E-mail</label>
                        <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18} /><input required type="email" value={loginEmail} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-2.5 border rounded-lg" placeholder="seu@email.com" /></div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Senha</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                          <input 
                            required 
                            type={showPassword ? 'text' : 'password'} 
                            value={loginPassword} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full pl-10 pr-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-black outline-none" 
                            placeholder="••••••••" 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-black transition"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
                      <button type="submit" className="w-full bg-black text-white p-3 rounded-lg font-bold">Entrar e Continuar</button>
                    </form>

                    <div className="mt-6 flex flex-col space-y-3">
                      <button onClick={() => window.location.href = `${API_URL}/auth/google/customer`} className="w-full border border-gray-300 p-3 rounded-lg flex items-center justify-center font-medium hover:bg-gray-50"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="G" />Continuar com Google</button>
                      <button onClick={() => setIsGuest(true)} className="w-full border border-gray-800 text-black p-3 rounded-lg font-bold flex items-center justify-center hover:bg-gray-50 transition"><UserX size={18} className="mr-2" />Prosseguir como Convidado</button>
                      <button onClick={() => navigate('/my-account?returnTo=booking')} className="text-sm text-gray-500 hover:underline">Não tem conta? Cadastre-se aqui</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {customer ? (
                        <>
                          <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex items-center justify-between">
                            <div className="flex items-center"><Award className="text-purple-600 mr-3" size={32} /><div><div className="text-xs font-bold text-purple-400 uppercase tracking-widest">Saldo Atual</div><div className="text-2xl font-black text-purple-900">{customer.loyaltyPoints} Pontos</div></div></div>
                            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-[10px] font-black">{10 - (customer.loyaltyPoints % 10)} para o próximo!</div>
                          </div>
                          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <h3 className="font-bold mb-4 flex items-center"><User size={18} className="mr-2" /> Seus Dados</h3>
                            <p className="text-sm text-gray-600"><strong>Nome:</strong> {customer.name}</p>
                            <p className="text-sm text-gray-600"><strong>E-mail:</strong> {customer.email}</p>
                            <p className="text-sm text-gray-600"><strong>WhatsApp:</strong> {customer.phone}</p>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start">
                            <UserX className="text-orange-500 mr-3 mt-1 shrink-0" size={20} />
                            <div>
                              <div className="text-sm font-bold text-orange-900">Modo Convidado Ativo</div>
                              <p className="text-xs text-orange-700">Neste modo você não acumula pontos de fidelidade e não poderá avaliar o serviço ou receber ofertas de antecipação.</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18} /><input required type="text" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Ex: João Silva" /></div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                            <div className="relative"><Phone className="absolute left-3 top-3 text-gray-400" size={18} /><input required type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Ex: 71999999999" /></div>
                          </div>
                          <button onClick={() => setIsGuest(false)} className="text-sm text-gray-500 underline">Voltar para Login</button>
                        </div>
                      )}
                    </div>
                    <div className="bg-black text-white p-8 rounded-2xl shadow-2xl flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-6 border-b border-gray-800 pb-4">Resumo do Agendamento</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center"><span>Serviço:</span><span className="font-bold">{selectedService.name}</span></div>
                          <div className="flex justify-between items-center"><span>Barbeiro:</span><span className="font-bold">{selectedBarber.name}</span></div>
                          <div className="flex justify-between items-center"><span>Data:</span><span className="font-bold">{format(new Date(selectedDate), "dd 'de' MMM")}</span></div>
                          <div className="flex justify-between items-center"><span>Horário:</span><span className="font-bold">{selectedTime}</span></div>
                        </div>
                      </div>
                      <div className="mt-10 pt-6 border-t border-gray-800 flex justify-between items-end">
                        <div><span className="text-gray-400 text-xs uppercase block mb-1">Total a pagar</span><span className="text-3xl font-black">R$ {selectedService.price.toFixed(2)}</span></div>
                        <button 
                          onClick={handleBooking} 
                          disabled={loading || (isGuest && (!guestName || !guestPhone))} 
                          className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-8 border-t pt-6"><button onClick={() => setStep(3)} className="text-gray-500 underline">Voltar</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
