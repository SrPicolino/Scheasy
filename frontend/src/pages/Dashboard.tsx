import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Scissors, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Award,
  Star,
  MessageSquare,
  User,
  Phone,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, addDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import API_URL from '../config';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'reviews' | 'agenda'>('appointments');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<any[]>([]);
  const [ratingPage, setRatingPage] = useState(1);
  const [ratingTotalPages, setRatingTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Agenda View States
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(new Date());

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, duration: 30 });

  const [isManualBookingModalOpen, setIsManualBookingModalOpen] = useState(false);
  const [manualBookingForm, setManualBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: '',
    barberId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: ''
  });

  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchRatings();
    }
  }, [ratingPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, servRes, barbRes] = await Promise.all([
        axios.get(`${API_URL}/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/services`),
        axios.get(`${API_URL}/barbers`)
      ]);
      setAppointments(appRes.data);
      setServices(servRes.data);
      setBarbers(barbRes.data);
      
      // Auto-select first barber for manual booking if available
      if (barbRes.data.length > 0) {
        setManualBookingForm(prev => ({ ...prev, barberId: barbRes.data[0].id }));
      }
      if (servRes.data.length > 0) {
        setManualBookingForm(prev => ({ ...prev, serviceId: servRes.data[0].id }));
      }

      await fetchRatings();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      const [ratingsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/ratings?page=${ratingPage}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/ratings/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRatings(ratingsRes.data.ratings);
      setRatingTotalPages(ratingsRes.data.pages);
      setRatingStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      await axios.patch(`${API_URL}/appointments/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentService) {
        await axios.put(`${API_URL}/services/${currentService.id}`, serviceForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/services`, serviceForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsServiceModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Erro ao salvar serviço');
    }
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const startTime = new Date(`${manualBookingForm.date}T${manualBookingForm.time}:00`);
      await axios.post(`${API_URL}/appointments`, {
        customerName: manualBookingForm.customerName,
        customerPhone: manualBookingForm.customerPhone,
        serviceId: manualBookingForm.serviceId,
        barberId: manualBookingForm.barberId,
        startTime,
        customerId: null // Manual booking via admin
      });
      setIsManualBookingModalOpen(false);
      setManualBookingForm({ ...manualBookingForm, customerName: '', customerPhone: '', time: '' });
      alert('Agendamento realizado com sucesso!');
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao realizar agendamento manual');
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      await axios.delete(`${API_URL}/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Erro ao excluir serviço');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  // Agenda Grid Logic
  const getAgendaForDate = (date: Date) => {
    const dayApps = appointments.filter(app => 
      app.status !== 'CANCELLED' && isSameDay(parseISO(app.startTime), date)
    );

    return TIME_SLOTS.map(slot => {
      const app = dayApps.find(a => format(parseISO(a.startTime), 'HH:mm') === slot);
      return { time: slot, appointment: app };
    });
  };

  // Filter and Sort Logic
  const now = new Date();
  
  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = 
      app.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customerPhone.includes(searchTerm) ||
      app.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.barber.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const futureAppointments = filteredAppointments
    .filter(app => new Date(app.startTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastAppointments = filteredAppointments
    .filter(app => new Date(app.startTime) < now)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  // Indicators Logic
  const currentMonth = new Date();
  const monthAppointments = appointments.filter(app => 
    isWithinInterval(new Date(app.startTime), {
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    })
  );

  const totalRevenue = monthAppointments
    .filter(app => app.status === 'COMPLETED')
    .reduce((sum, app) => sum + app.service.price, 0);

  const pendingCount = appointments.filter(app => app.status === 'PENDING').length;

  if (loading) return <div className="p-8 text-center flex flex-col items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
    Carregando painel...
  </div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-6 hidden md:block shrink-0">
        <div className="text-2xl font-bold mb-12 flex items-center">
          <Scissors className="mr-2" /> BarberAdmin
        </div>
        <nav className="space-y-4">
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center space-x-3 p-3 w-full rounded-lg transition ${activeTab === 'appointments' ? 'bg-gray-800' : 'text-gray-400 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center space-x-3 p-3 w-full rounded-lg transition ${activeTab === 'agenda' ? 'bg-gray-800' : 'text-gray-400 hover:text-white'}`}
          >
            <CalendarIcon size={20} />
            <span>Agenda Diária</span>
          </button>
          <button 
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-3 p-3 w-full rounded-lg transition ${activeTab === 'services' ? 'bg-gray-800' : 'text-gray-400 hover:text-white'}`}
          >
            <Scissors size={20} />
            <span>Serviços</span>
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center space-x-3 p-3 w-full rounded-lg transition ${activeTab === 'reviews' ? 'bg-gray-800' : 'text-gray-400 hover:text-white'}`}
          >
            <Star size={20} />
            <span>Avaliações</span>
          </button>
          <div className="pt-10">
            <button onClick={logout} className="flex items-center space-x-3 p-3 w-full text-left text-gray-400 hover:text-red-400 transition">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Olá, Barbeiro!</h1>
            <p className="text-gray-500">Gestão profissional da sua barbearia.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsManualBookingModalOpen(true)}
              className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center hover:bg-gray-800 transition shadow-lg"
            >
              <Plus size={18} className="mr-2" />
              Novo Agendamento
            </button>
            <button 
              onClick={() => window.location.href = `${API_URL}/auth/google`}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-gray-50 transition shadow-sm"
            >
              <CalendarIcon size={16} className="mr-2 text-red-500" />
              Sincronizar Google
            </button>
            <span className="text-gray-500 font-medium hidden lg:block">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</span>
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold shadow-lg">A</div>
          </div>
        </header>

        {activeTab === 'appointments' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <StatCard icon={<DollarSign className="text-green-500" />} label="Receita (Pago)" value={`R$ ${totalRevenue.toFixed(2)}`} description="Apenas status Concluído" />
              <StatCard icon={<CalendarIcon className="text-blue-500" />} label="Agendamentos/Mês" value={monthAppointments.length.toString()} description="Total no período" />
              <StatCard icon={<Clock className="text-orange-500" />} label="Pendentes" value={pendingCount.toString()} description="Aguardando ação" />
              <StatCard icon={<TrendingUp className="text-purple-500" />} label="Estimativa Bruta" value={`R$ ${monthAppointments.filter(a => a.status !== 'CANCELLED').reduce((s, a) => s + a.service.price, 0).toFixed(2)}`} description="Confirmados + Pendentes" />
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <h2 className="text-xl font-bold">Últimos Agendamentos</h2>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                      type="text"
                      placeholder="Buscar cliente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 p-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black min-w-[200px]"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="ALL">Todos os Status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Serviço</th>
                      <th className="px-6 py-4">Barbeiro</th>
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {futureAppointments.slice(0, 10).map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="font-bold text-gray-900">{app.customerName}</div>
                            {app.customer?.isRegistered && (
                              <span className="ml-2 bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Clube</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{app.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">{app.service.name}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{app.barber.name}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold">{format(parseISO(app.startTime), "dd/MM/yyyy")}</div>
                          <div className="text-xs text-gray-500">{format(parseISO(app.startTime), 'HH:mm')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest ${
                            app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                            app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                            app.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center space-x-1">
                            {app.status === 'PENDING' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'CONFIRMED')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><CheckCircle size={18} /></button>
                            )}
                            {app.status === 'CONFIRMED' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'COMPLETED')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><TrendingUp size={18} /></button>
                            )}
                            {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'CANCELLED')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><XCircle size={18} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'agenda' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold flex items-center"><CalendarIcon className="mr-2" /> Agenda Diária</h2>
              <div className="flex items-center space-x-4">
                <button onClick={() => setSelectedAgendaDate(addDays(selectedAgendaDate, -1))} className="p-2 hover:bg-white rounded-full border transition"><ChevronLeft size={20} /></button>
                <div className="text-center min-w-[200px]">
                  <div className="font-black text-lg">{format(selectedAgendaDate, "dd 'de' MMMM", { locale: ptBR })}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">{format(selectedAgendaDate, "EEEE", { locale: ptBR })}</div>
                </div>
                <button onClick={() => setSelectedAgendaDate(addDays(selectedAgendaDate, 1))} className="p-2 hover:bg-white rounded-full border transition"><ChevronRight size={20} /></button>
              </div>
              <button onClick={() => setSelectedAgendaDate(new Date())} className="text-sm font-bold text-gray-500 hover:text-black transition">HOJE</button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-3">
                {getAgendaForDate(selectedAgendaDate).map(({ time, appointment }) => (
                  <div key={time} className={`flex items-center p-4 rounded-xl border-2 transition ${appointment ? 'border-black bg-gray-50' : 'border-dashed border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <div className="w-20 font-black text-xl text-gray-400 shrink-0">{time}</div>
                    <div className="flex-1">
                      {appointment ? (
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-black text-lg flex items-center">
                              {appointment.customerName}
                              <span className={`ml-3 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                appointment.status === 'CONFIRMED' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 font-medium">{appointment.service.name} • {appointment.barber.name}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                             <a href={`https://wa.me/${appointment.customerPhone.replace(/\D/g, '')}`} target="_blank" className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"><MessageSquare size={18} /></a>
                             <button onClick={() => updateAppointmentStatus(appointment.id, 'CANCELLED')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><XCircle size={18} /></button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setManualBookingForm({ ...manualBookingForm, date: format(selectedAgendaDate, 'yyyy-MM-dd'), time });
                            setIsManualBookingModalOpen(true);
                          }}
                          className="w-full text-left text-sm font-bold text-gray-300 hover:text-gray-500 flex items-center"
                        >
                          <Plus size={16} className="mr-2" /> HORÁRIO DISPONÍVEL - CLIQUE PARA AGENDAR
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">Catálogo de Serviços</h2>
              <button 
                onClick={() => { setCurrentService(null); setServiceForm({ name: '', description: '', price: 0, duration: 30 }); setIsServiceModalOpen(true); }}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm flex items-center"
              >
                <Plus size={16} className="mr-2" /> Novo Serviço
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <div key={service.id} className="border rounded-xl p-5 hover:border-black transition group relative">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{service.name}</h3>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => { setCurrentService(service); setServiceForm(service); setIsServiceModalOpen(true); }} className="p-1 text-gray-500 hover:text-black"><Edit2 size={16} /></button>
                      <button onClick={() => deleteService(service.id)} className="p-1 text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-bold text-xl">R$ {service.price.toFixed(2)}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{service.duration} min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ratingStats.map((stat: any) => (
                <div key={stat.barberId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{stat.barberName}</h3>
                    <div className="flex items-center text-yellow-500 font-bold">
                      <Star size={20} fill="currentColor" className="mr-1" />
                      {stat.average}
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">{stat.total} avaliações</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Comentários dos Clientes</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {ratings.length > 0 ? ratings.map((rating: any) => (
                  <div key={rating.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold">{rating.appointment.customerName}</div>
                        <div className="text-xs text-gray-400">
                          {format(parseISO(rating.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-sm font-bold">
                        <Star size={14} fill="currentColor" className="mr-1" />
                        {rating.score}
                      </div>
                    </div>
                    {rating.comment ? (
                      <p className="text-gray-700 text-sm italic mb-4 flex items-start bg-gray-50 p-4 rounded-xl">
                        <MessageSquare size={16} className="mr-3 text-gray-300 shrink-0 mt-1" />
                        "{rating.comment}"
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm italic mb-4">Sem comentário por extenso.</p>
                    )}
                    <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest">
                      <span className="text-gray-400">Barbeiro: <span className="text-black">{rating.appointment.barber.name}</span></span>
                      <span className="text-gray-400">Serviço: <span className="text-black">{rating.appointment.service.name}</span></span>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-gray-500">
                    Nenhuma avaliação detalhada encontrada.
                  </div>
                )}
              </div>
              {ratingTotalPages > 1 && (
                <div className="p-6 border-t border-gray-100 flex justify-center space-x-2">
                  {Array.from({ length: ratingTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setRatingPage(page)}
                      className={`px-3 py-1 rounded-md text-sm font-bold transition ${ratingPage === page ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Manual Booking Modal */}
      {isManualBookingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black">Novo Agendamento</h2>
              <button onClick={() => setIsManualBookingModalOpen(false)} className="text-gray-400 hover:text-black"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleManualBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input required placeholder="Nome do cliente" className="w-full pl-10 p-2.5 border rounded-xl" value={manualBookingForm.customerName} onChange={e => setManualBookingForm({...manualBookingForm, customerName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input required placeholder="Ex: 71999999999" className="w-full pl-10 p-2.5 border rounded-xl" value={manualBookingForm.customerPhone} onChange={e => setManualBookingForm({...manualBookingForm, customerPhone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Data</label>
                  <input type="date" required className="w-full p-2.5 border rounded-xl" value={manualBookingForm.date} onChange={e => setManualBookingForm({...manualBookingForm, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Hora</label>
                  <select required className="w-full p-2.5 border rounded-xl" value={manualBookingForm.time} onChange={e => setManualBookingForm({...manualBookingForm, time: e.target.value})}>
                    <option value="">Selecionar...</option>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Serviço</label>
                <select required className="w-full p-2.5 border rounded-xl" value={manualBookingForm.serviceId} onChange={e => setManualBookingForm({...manualBookingForm, serviceId: e.target.value})}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-black text-white p-4 rounded-2xl font-black text-lg hover:bg-gray-800 transition mt-6 shadow-xl">
                CONFIRMAR AGENDAMENTO
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Service Modal (keeping existing) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-6">{currentService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Nome</label>
                <input required className="w-full p-3 border rounded-2xl bg-gray-50 focus:ring-2 focus:ring-black outline-none transition" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Descrição</label>
                <textarea className="w-full p-3 border rounded-2xl bg-gray-50 focus:ring-2 focus:ring-black outline-none transition" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Preço (R$)</label>
                  <input type="number" step="0.01" required className="w-full p-3 border rounded-2xl bg-gray-50" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">Duração (min)</label>
                  <input type="number" required className="w-full p-3 border rounded-2xl bg-gray-50" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 text-gray-500 underline">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-black text-white rounded-2xl font-black shadow-lg">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, description }: { icon: any, label: string, value: string, description: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <TrendingUp size={14} className="text-gray-300" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-gray-900 text-sm font-bold">{label}</div>
        <div className="text-[10px] text-gray-400 uppercase mt-1 tracking-wider">{description}</div>
      </div>
    </div>
  );
}
