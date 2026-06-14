import { useState } from 'react';
import axios from 'axios';
import { Star, CheckCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';

export default function Evaluation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score === 0) return alert('Por favor, selecione uma nota.');
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/ratings`, {
        appointmentId,
        score,
        comment
      });
      setSuccess(true);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao enviar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
          <p className="text-gray-600 mb-6">Sua avaliação foi enviada com sucesso. Isso nos ajuda a melhorar nossos serviços.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition"
          >
            Voltar para Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold">Avalie seu Atendimento</h1>
          <p className="text-gray-500">Conte-nos como foi sua experiência</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onClick={() => setScore(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star
                  size={40}
                  className={`${
                    star <= (hover || score) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comentário (opcional)</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Sua opinião é muito importante para nós..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || score === 0}
            className="w-full bg-black text-white p-4 rounded-lg font-bold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </form>
      </div>
    </div>
  );
}
