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
  MessageSquare
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'http://localhost:3001/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'reviews'>('appointments');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState<any[]>([]);
  const [ratingPage, setRatingPage] = useState(1);
  const [ratingTotalPages, setRatingTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Service Modal State
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, duration: 30 });

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
      const [appRes, servRes] = await Promise.all([
        axios.get(`${API_URL}/appointments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/services`)
      ]);
      setAppointments(appRes.data);
      setServices(servRes.data);
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
      <aside className="w-64 bg-black text-white p-6 hidden md:block">
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
            <p className="text-gray-500">Aqui está o que está acontecendo hoje.</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.location.href = `${API_URL}/auth/google`}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-gray-50 transition shadow-sm"
            >
              <CalendarIcon size={16} className="mr-2 text-red-500" />
              Conectar Google Agenda
            </button>
            <span className="text-gray-500 font-medium">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</span>
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold shadow-lg">A</div>
          </div>
        </header>

        {activeTab === 'appointments' ? (
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
                <h2 className="text-xl font-bold">Gestão de Agendamentos</h2>
                
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                  <input 
                    type="text"
                    placeholder="Buscar cliente, serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-black min-w-[200px]"
                  />
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

                <div className="flex space-x-2">
                   <span className="flex items-center text-xs text-gray-400"><div className="w-2 h-2 bg-orange-400 rounded-full mr-1"></div> Pendente</span>
                   <span className="flex items-center text-xs text-gray-400"><div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div> Confirmado</span>
                   <span className="flex items-center text-xs text-gray-400"><div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div> Concluído</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-sm uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Serviço</th>
                      <th className="px-6 py-4">Barbeiro</th>
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Fidelidade</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Próximos Agendamentos */}
                    {futureAppointments.length > 0 && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={7} className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Próximos Agendamentos
                        </td>
                      </tr>
                    )}
                    {futureAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition border-l-4 border-l-black">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="font-bold">{app.customerName}</div>
                            {app.customer?.isRegistered && (
                              <span className="ml-2 bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter" title="Membro do Clube de Fidelidade">Clube</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{app.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{app.service.name}</div>
                          <div className="text-xs font-mono font-bold text-gray-500">R$ {app.service.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{app.barber.name}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold">{format(new Date(app.startTime), "dd 'de' MMM")}</div>
                          <div className="text-xs text-gray-500">{format(new Date(app.startTime), 'HH:mm')} - {format(new Date(app.endTime), 'HH:mm')}</div>
                        </td>
                        <td className="px-6 py-4">
                          {app.customer?.isRegistered ? (
                            <div className="flex items-center text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                              <Award size={12} className="mr-1" /> {app.customer.loyaltyPoints} pontos
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs italic">Não membro</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                            app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                            app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                            app.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {app.status === 'PENDING' ? 'PENDENTE' : 
                             app.status === 'CONFIRMED' ? 'CONFIRMADO' : 
                             app.status === 'COMPLETED' ? 'CONCLUÍDO' : 'CANCELADO'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-1">
                            {app.status === 'PENDING' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'CONFIRMED')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Confirmar"><CheckCircle size={18} /></button>
                            )}
                            {app.status === 'CONFIRMED' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'COMPLETED')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Marcar como Concluído"><TrendingUp size={18} /></button>
                            )}
                            {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'CANCELLED')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancelar"><XCircle size={18} /></button>
                            )}
                            {(app.status === 'CANCELLED' || app.status === 'COMPLETED') && <span className="text-gray-300">-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Histórico */}
                    {pastAppointments.length > 0 && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={7} className="px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Histórico de Atendimentos
                        </td>
                      </tr>
                    )}
                    {pastAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition opacity-75">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="font-bold">{app.customerName}</div>
                            {app.customer?.isRegistered && (
                              <span className="ml-2 bg-purple-100 text-purple-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter" title="Membro do Clube de Fidelidade">Clube</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{app.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{app.service.name}</div>
                          <div className="text-xs font-mono font-bold text-gray-500">R$ {app.service.price.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 font-medium">{app.barber.name}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold">{format(new Date(app.startTime), "dd 'de' MMM")}</div>
                          <div className="text-xs text-gray-500">{format(new Date(app.startTime), 'HH:mm')} - {format(new Date(app.endTime), 'HH:mm')}</div>
                        </td>
                        <td className="px-6 py-4">
                          {app.customer?.isRegistered ? (
                            <div className="flex items-center text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full w-fit">
                              <Award size={12} className="mr-1" /> {app.customer.loyaltyPoints} pontos
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs italic">Não membro</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider ${
                            app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                            app.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                            app.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {app.status === 'PENDING' ? 'PENDENTE' : 
                             app.status === 'CONFIRMED' ? 'CONFIRMADO' : 
                             app.status === 'COMPLETED' ? 'CONCLUÍDO' : 'CANCELADO'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-1">
                            {app.status === 'PENDING' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'CONFIRMED')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Confirmar"><CheckCircle size={18} /></button>
                            )}
                            {app.status === 'CONFIRMED' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'COMPLETED')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Marcar como Concluído"><TrendingUp size={18} /></button>
                            )}
                            {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                              <button onClick={() => updateAppointmentStatus(app.id, 'CANCELLED')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Cancelar"><XCircle size={18} /></button>
                            )}
                            {(app.status === 'CANCELLED' || app.status === 'COMPLETED') && <span className="text-gray-300">-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredAppointments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                          Nenhum agendamento encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === 'services' ? (
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
        ) : (
          <div className="space-y-8">
            {/* Rating Stats */}
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
                  <div className="text-gray-500 text-sm">
                    {stat.total} avaliações no total
                  </div>
                </div>
              ))}
            </div>

            {/* Ratings List */}
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
                          {format(new Date(rating.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-sm font-bold">
                        <Star size={14} fill="currentColor" className="mr-1" />
                        {rating.score}
                      </div>
                    </div>
                    {rating.comment ? (
                      <p className="text-gray-700 text-sm italic mb-4 flex items-start">
                        <MessageSquare size={16} className="mr-2 text-gray-300 shrink-0 mt-1" />
                        "{rating.comment}"
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm italic mb-4">Sem comentário</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-gray-500">Barbeiro: <span className="font-bold">{rating.appointment.barber.name}</span></span>
                      <span className="text-gray-500">Serviço: <span className="font-bold">{rating.appointment.service.name}</span></span>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-gray-500">
                    Nenhuma avaliação encontrada.
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

      {/* Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">{currentService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input required className="w-full p-2 border rounded-lg" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea className="w-full p-2 border rounded-lg" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preço (R$)</label>
                  <input type="number" step="0.01" required className="w-full p-2 border rounded-lg" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duração (min)</label>
                  <input type="number" required className="w-full p-2 border rounded-lg" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-6">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 text-gray-500 underline">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-black text-white rounded-lg font-bold">Salvar</button>
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
