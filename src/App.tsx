import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  Heart, 
  Scale, 
  Clock, 
  Activity,
  PawPrint,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Settings,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Pet, HealthEvent, DailyLog } from './types';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('petconnect_auth') === 'true';
  });

  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('petconnect_pets');
    return saved ? JSON.parse(saved) : [{ 
      id: '1', 
      name: 'Luna', 
      age: 3, 
      weight: 12.5, 
      species: 'dog', 
      breed: 'Golden Retriever' 
    }];
  });

  const [events, setEvents] = useState<HealthEvent[]>(() => {
    const saved = localStorage.getItem('petconnect_events');
    return saved ? JSON.parse(saved) : [
      { id: 'e1', petId: '1', type: 'vaccine', title: 'Refuerzo de Rabia', date: new Date().toISOString(), completed: false },
      { id: 'e2', petId: '1', type: 'deworming', title: 'Pastilla Mensual', date: addMonths(new Date(), 1).toISOString(), completed: false }
    ];
  });

  const [logs, setLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('petconnect_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'l1', petId: '1', date: new Date().toISOString(), symptoms: 'Ninguno', behavior: 'Normal', mood: 'happy' }
    ];
  });

  const [activePetId, setActivePetId] = useState<string>(pets[0]?.id || '');
  const [view, setView] = useState<'overview' | 'calendar' | 'logs'>('overview');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('petconnect_pets', JSON.stringify(pets));
    localStorage.setItem('petconnect_events', JSON.stringify(events));
    localStorage.setItem('petconnect_logs', JSON.stringify(logs));
    localStorage.setItem('petconnect_auth', isAuthenticated.toString());
  }, [pets, events, logs, isAuthenticated]);

  const activePet = pets.find(p => p.id === activePetId);

  const addEvent = (event: Omit<HealthEvent, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setEvents([...events, { ...event, id }]);
    setShowEventModal(false);
  };

  const updatePet = (updatedPet: Pet) => {
    setPets(pets.map(p => p.id === updatedPet.id ? updatedPet : p));
    setShowPetModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('petconnect_auth');
  };

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <AnimatePresence>
        {showEventModal && (
          <EventModal 
            petId={activePetId} 
            onClose={() => setShowEventModal(false)} 
            onSubmit={addEvent} 
          />
        )}
        {showPetModal && activePet && (
          <PetModal 
            pet={activePet} 
            onClose={() => setShowPetModal(false)} 
            onSubmit={updatePet} 
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-brand w-10 h-10 rounded-xl flex items-center justify-center text-white">
              <PawPrint size={24} />
            </div>
            <h1 className="text-xl font-display font-bold text-slate-800">PetConnect</h1>
          </div>

          <nav className="space-y-1">
            <NavItem 
              icon={<Activity size={20} />} 
              label="Resumen" 
              active={view === 'overview'} 
              onClick={() => setView('overview')} 
            />
            <NavItem 
              icon={<CalendarIcon size={20} />} 
              label="Calendario" 
              active={view === 'calendar'} 
              onClick={() => setView('calendar')} 
            />
            <NavItem 
              icon={<ClipboardList size={20} />} 
              label="Bitácora" 
              active={view === 'logs'} 
              onClick={() => setView('logs')} 
            />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activePet?.name || 'default'}`} alt="Owner" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-slate-700">Panel del Dueño</p>
              <p className="text-xs text-slate-500">Plan Premium</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-danger hover:bg-danger/5 rounded-xl transition-all group"
          >
            <LogOut size={20} className="group-hover:text-danger" />
            <span className="font-medium group-hover:text-danger">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900 capitalize">
              {view === 'overview' ? 'Resumen' : view === 'calendar' ? 'Calendario' : 'Bitácora'} de {activePet?.name || 'mi mascota'}
            </h2>
            <p className="text-slate-500">Cuidando la salud de tu mascota con amor.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20"
              value={activePetId}
              onChange={(e) => {
                if (e.target.value === 'new') {
                  const name = prompt('¿Nombre de la mascota?');
                  if (name) {
                    const id = Math.random().toString(36).substr(2, 9);
                    setPets([...pets, { id, name, age: 0, weight: 0, species: 'dog' }]);
                    setActivePetId(id);
                  }
                } else {
                  setActivePetId(e.target.value);
                }
              }}
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="new">+ Agregar Mascota</option>
            </select>

            <button 
              onClick={() => setShowEventModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
            >
              <Plus size={18} />
              <span>Nuevo Evento</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={view + activePetId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'overview' && (
              <Overview 
                pet={activePet} 
                events={events.filter(e => e.petId === activePetId)} 
                logs={logs.filter(l => l.petId === activePetId)}
                onCheckEvent={(id) => {
                  setEvents(events.map(e => e.id === id ? { ...e, completed: true } : e));
                }}
                onEditPet={() => setShowPetModal(true)}
              />
            )}
            {view === 'calendar' && (
              <CalendarView events={events.filter(e => e.petId === activePetId)} />
            )}
            {view === 'logs' && (
              <DailyLogView petId={activePetId} logs={logs} setLogs={setLogs} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [authMode, setAuthMode] = useState<'hero' | 'login' | 'register'>('hero');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const services = [
    {
      title: "Ficha Técnica",
      desc: "Centraliza el historial de tu mascota: peso, edad y características clave en un solo lugar.",
      icon: <Scale className="text-brand" size={32} />,
      color: "bg-brand/10"
    },
    {
      title: "Calendario de Salud",
      desc: "No olvides nunca una vacuna o desparasitación con nuestro sistema de recordatorios inteligentes.",
      icon: <CalendarIcon className="text-accent" size={32} />,
      color: "bg-accent/10"
    },
    {
      title: "Bitácora Diaria",
      desc: "Registra síntomas, cambios de comportamiento y estados de ánimo para un mejor seguimiento médico.",
      icon: <ClipboardList className="text-success" size={32} />,
      color: "bg-success/10"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Minimalista */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setAuthMode('hero')}>
          <div className="bg-brand w-8 h-8 rounded-lg flex items-center justify-center text-white">
            <PawPrint size={20} />
          </div>
          <span className="text-xl font-display font-bold text-slate-800">PetConnect</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setAuthMode('login')}
            className="text-slate-600 font-bold hover:text-brand transition-all"
          >
            Entrar
          </button>
          <button 
            onClick={() => setAuthMode('register')}
            className="px-6 py-2 bg-brand text-white rounded-full font-bold hover:bg-brand/90 transition-all shadow-lg shadow-brand/20"
          >
            Registrarse
          </button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {authMode === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <span className="px-4 py-1.5 bg-brand-light text-brand text-sm font-black rounded-full uppercase tracking-widest mb-6 inline-block">
                  Todo para tu mascota
                </span>
                <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 leading-[1.1] mb-6">
                  Cuidado centralizado para tu mejor amigo.
                </h1>
                <p className="text-xl text-slate-500 mb-10 leading-relaxed max-w-lg">
                  PetConnect te ayuda a organizar la salud y el bienestar de tus mascotas sin complicaciones. Todo en un solo dashboard profesional.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setAuthMode('register')}
                    className="px-10 py-5 bg-brand text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand/30 transition-all active:scale-95 hover:bg-brand/90"
                  >
                    Comenzar Ahora
                  </button>
                  <button className="px-10 py-5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
                    Saber más
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square bg-slate-100 rounded-[4rem] overflow-hidden shadow-2xl relative z-10 border-8 border-slate-50">
                  <img 
                    src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=1469&auto=format&fit=crop" 
                    alt="Mascotas felices"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-brand/20 rounded-full blur-3xl" />
                
                {/* Card Flotante
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -right-6 top-1/4 z-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3"
                >
                  <div className="bg-success/10 p-2 rounded-lg text-success"><Activity size={24}/></div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase">Próxima Vacuna</p>
                    <p className="text-sm font-bold text-slate-800">¡Mañana a las 10:00 AM!</p>
                  </div>
                </motion.div> */}
              </div>
            </section>

            {/* Servicios Section */}
            {/* <section className="bg-slate-50 py-32 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="max-w-2xl text-left mb-20">
                  <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">Servicios diseñados para dueños responsables</h2>
                  <p className="text-lg text-slate-500">Todo lo que necesitas para que tu mascota viva más y mejor.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {services.map((s, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -10 }}
                      className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 text-left transition-all hover:shadow-xl group"
                    >
                      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-300", s.color)}>
                        {s.icon}
                      </div>
                      <h3 className="text-2xl font-display font-bold text-slate-900 mb-4">{s.title}</h3>
                      <p className="text-slate-500 leading-relaxed">{s.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section> */}
          </motion.div>
        )}

        {(authMode === 'login' || authMode === 'register') && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-md mx-auto py-20 px-6"
          >
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-2 text-left">
                {authMode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h2>
              <p className="text-slate-500 text-left mb-8">
                {authMode === 'login' ? 'Ingresa tus credenciales para continuar.' : 'Únete a miles de dueños que ya cuidan mejor a sus mascotas.'}
              </p>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                {authMode === 'register' && (
                  <div className="text-left space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre Completo</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                      placeholder="Tu nombre"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                )}
                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                  <input 
                    required
                    type="email"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                    placeholder="email@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="text-left space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
                  <input 
                    required
                    type="password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all mt-4">
                  {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-500">
                  {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="ml-1 text-brand font-bold hover:underline"
                  >
                    {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="bg-brand w-8 h-8 rounded-lg flex items-center justify-center text-white">
              <PawPrint size={20} />
            </div>
            <span className="text-xl font-display font-bold text-slate-800">PetConnect</span>
          </div>
          <p className="text-slate-400 text-sm">© 2024 PetConnect. Creado con amor para los animales.</p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-brand transition-colors font-medium">Privacidad</a>
            <a href="#" className="text-slate-400 hover:text-brand transition-colors font-medium">Términos</a>
            <a href="#" className="text-slate-400 hover:text-brand transition-colors font-medium">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-brand text-white shadow-lg shadow-brand/20" 
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      )}
    >
      <span className={cn("transition-colors", active ? "text-white" : "group-hover:text-brand")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

function Overview({ pet, events, logs, onCheckEvent, onEditPet }: { pet?: Pet, events: HealthEvent[], logs: DailyLog[], onCheckEvent: (id: string) => void, onEditPet: () => void }) {
  if (!pet) return <div className="text-center py-10">No hay mascota seleccionada</div>;

  const upcomingEvents = events
    .filter(e => !e.completed && new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const lastLog = logs.filter(l => l.petId === pet.id).at(-1);

  const getMoodLabel = (mood: string) => {
    switch(mood) {
      case 'happy': return 'Feliz';
      case 'calm': return 'Tranquilo';
      case 'anxious': return 'Ansioso';
      case 'tired': return 'Cansado';
      case 'unwell': return 'Malestar';
      default: return mood;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Pet Profile Card */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-32 h-32 rounded-3xl bg-brand-light flex items-center justify-center text-brand overflow-hidden shrink-0">
            {pet.photo ? (
              <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              < PawPrint size={48} />
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 mb-4">
              <div className="flex flex-col md:flex-row md:items-end gap-2">
                <h3 className="text-2xl font-display font-bold text-slate-900">{pet.name}</h3>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full uppercase tracking-wider">
                  {pet.species === 'dog' ? 'Perro' : pet.species === 'cat' ? 'Gato' : pet.species === 'bird' ? 'Ave' : 'Otro'} {pet.breed ? `• ${pet.breed}` : ''}
                </span>
              </div>
              <button 
                onClick={onEditPet}
                className="text-brand hover:text-brand/80 p-2 hover:bg-brand/5 rounded-full transition-colors"
              >
                <Settings size={20}/>
              </button>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoBox icon={<Clock className="text-brand" size={18} />} label="Edad" value={`${pet.age} años`} />
              <InfoBox icon={<Scale className="text-accent" size={18} />} label="Peso" value={`${pet.weight} kg`} />
              <InfoBox icon={<Heart className="text-danger" size={18} />} label="Salud" value="Buena" />
            </div>
          </div>
        </div>

        {/* Daily Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grayscale-hover transition-all duration-300">
            <h4 className="flex items-center gap-2 font-display font-bold text-slate-800 mb-4">
              <ClipboardList size={20} className="text-brand" />
              Último Registro
            </h4>
            {lastLog ? (
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>{format(parseISO(lastLog.date), 'dd MMM, yyyy', { locale: es })}</span>
                  <span className="capitalize px-2 py-0.5 bg-success/10 text-success rounded-full font-bold">{getMoodLabel(lastLog.mood)}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">Síntomas</p>
                  <p className="text-sm text-slate-700">{lastLog.symptoms}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 text-[10px]">Comportamiento</p>
                  <p className="text-sm text-slate-700">{lastLog.behavior}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm text-left">Sin registros todavía.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h4 className="flex items-center gap-2 font-display font-bold text-slate-800 mb-4">
              <Activity size={20} className="text-accent" />
              Actividad Reciente
            </h4>
            <div className="space-y-4">
              {logs.filter(l => l.petId === pet.id).slice(-2).reverse().map(l => (
                <div key={l.id} className="flex gap-4 text-left">
                  <div className="w-1 bg-slate-100 rounded-full shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Registro: {getMoodLabel(l.mood)}</p>
                    <p className="text-xs text-slate-400">{format(parseISO(l.date), 'dd MMM', { locale: es })}</p>
                  </div>
                </div>
              ))}
              {logs.filter(l => l.petId === pet.id).length === 0 && (
                <p className="text-slate-400 text-sm text-left">No hay actividad reciente.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Upcoming Events */}
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-display font-bold text-slate-800">Recordatorios</h4>
            <button className="text-brand text-sm font-semibold hover:underline">Ver todo</button>
          </div>
          
          <div className="space-y-4 text-left">
            {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
              <div key={event.id} className="group p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    event.type === 'vaccine' ? 'bg-brand-light text-brand' : 'bg-success/10 text-success'
                  )}>
                    {event.type === 'vaccine' ? <Activity size={20} /> : <Heart size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{event.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{format(parseISO(event.date), 'dd MMM, p', { locale: es })}</p>
                  </div>
                  <button 
                    onClick={() => onCheckEvent(event.id)}
                    className="text-slate-300 group-hover:text-success transition-colors"
                  >
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                  <CalendarIcon size={32} />
                </div>
                <p className="text-slate-400 text-sm">¡Todo al día!</p>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-brand rounded-2xl text-white relative overflow-hidden text-left">
            <div className="relative z-10">
              <p className="text-sm font-bold mb-1">Consejo de Salud</p>
              <p className="text-xs opacity-90 leading-relaxed">
                Asegúrate de que {pet.name} tenga agua fresca en todo momento, especialmente después de jugar.
              </p>
            </div>
            <PawPrint className="absolute -bottom-4 -right-4 size-24 opacity-10 rotate-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div className="text-left">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function EventModal({ petId, onClose, onSubmit }: { petId: string, onClose: () => void, onSubmit: (e: Omit<HealthEvent, 'id'>) => void }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'vaccine' as const,
    date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    notes: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-brand text-white">
          <h3 className="text-xl font-display font-bold">Nuevo Recordatorio</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ ...formData, petId, completed: false });
        }}>
          <div className="text-left space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Título del Evento</label>
            <input 
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none transition-all"
              placeholder="Ej: Refuerzo de Rabia"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="text-left space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none transition-all"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as any })}
            >
              <option value="vaccine">Vacuna</option>
              <option value="deworming">Desparasitación</option>
              <option value="checkup">Chequeo General</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div className="text-left space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha y Hora</label>
            <input 
              required
              type="datetime-local"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none transition-all text-sm"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 hover:bg-brand/90 transition-all mt-4">
            Crear Recordatorio
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function PetModal({ pet, onClose, onSubmit }: { pet: Pet, onClose: () => void, onSubmit: (p: Pet) => void }) {
  const [formData, setFormData] = useState<Pet>({ ...pet });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-left">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-accent text-white">
          <h3 className="text-xl font-display font-bold">Editar Perfil</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Plus className="rotate-45" size={24} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }}>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
              <input 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Especie</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.species}
                onChange={e => setFormData({ ...formData, species: e.target.value as any })}
              >
                <option value="dog">Perro</option>
                <option value="cat">Gato</option>
                <option value="bird">Ave</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Edad (Años)</label>
              <input 
                required
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peso (kg)</label>
              <input 
                required
                type="number"
                step="0.1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                value={formData.weight}
                onChange={e => setFormData({ ...formData, weight: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Raza / Descripción</label>
            <input 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              value={formData.breed || ''}
              onChange={e => setFormData({ ...formData, breed: e.target.value })}
            />
          </div>
          <button type="submit" className="w-full py-4 bg-accent text-white rounded-2xl font-bold shadow-lg shadow-accent/20 hover:opacity-90 transition-all mt-4">
            Actualizar Perfil
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function CalendarView({ events }: { events: HealthEvent[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-left">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h4 className="text-xl font-display font-bold text-slate-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h4>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 active:scale-95 transition-all">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 active:scale-95 transition-all">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-slate-100 overflow-auto">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="bg-white p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
        {daysInMonth.map((day) => {
          const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
          return (
            <div 
              key={day.toString()} 
              className={cn(
                "bg-white min-h-35 p-2 hover:bg-slate-50/50 transition-colors",
                !isSameMonth(day, currentDate) && "opacity-30",
                format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') && "ring-2 ring-inset ring-brand/10 bg-brand/5"
              )}
            >
              <div className="flex justify-between items-center mb-2 p-1">
                <span className={cn(
                  "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full",
                  format(new Date(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') ? "bg-brand text-white" : "text-slate-600"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div key={event.id} className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold truncate border",
                    event.type === 'vaccine' ? "bg-brand-light text-brand border-brand/10" : "bg-success/10 text-success border-success/10"
                  )}>
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyLogView({ petId, logs, setLogs }: { petId: string, logs: DailyLog[], setLogs: (logs: DailyLog[]) => void }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLog, setNewLog] = useState<{ symptoms: string; behavior: string; mood: 'happy' | 'calm' | 'anxious' | 'tired' | 'unwell' }>({ symptoms: '', behavior: '', mood: 'happy' });

  const activeLogs = logs
    .filter(l => l.petId === petId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const addLog = (e: React.FormEvent) => {
    e.preventDefault();
    const log: DailyLog = {
      id: Math.random().toString(36).substr(2, 9),
      petId,
      date: new Date().toISOString(),
      ...newLog
    };
    setLogs([...logs, log]);
    setNewLog({ symptoms: '', behavior: '', mood: 'happy' });
    setShowAdd(false);
  };

  const getMoodLabel = (mood: string) => {
    switch(mood) {
      case 'happy': return 'Feliz';
      case 'calm': return 'Tranquilo';
      case 'anxious': return 'Ansioso';
      case 'tired': return 'Cansado';
      case 'unwell': return 'Malestar';
      default: return mood;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-xl text-slate-800 text-left">Bitácora Diaria</h3>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-all font-semibold shadow-sm"
        >
          {showAdd ? 'Cancelar' : <><Plus size={18} /> Nuevo Registro</>}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={addLog}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Síntomas / Cambios de Salud</label>
                <textarea 
                  value={newLog.symptoms}
                  onChange={e => setNewLog({ ...newLog, symptoms: e.target.value })}
                  placeholder="Ej: Sin signos anormales, tos leve..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none h-24 resize-none text-sm"
                  required
                />
              </div>
              <div className="text-left">
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Notas de Comportamiento</label>
                <textarea 
                  value={newLog.behavior}
                  onChange={e => setNewLog({ ...newLog, behavior: e.target.value })}
                  placeholder="Ej: Muy activo, algo territorial hoy..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand/20 outline-none h-24 resize-none text-sm"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase block mr-2">Estado de ánimo</label>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  {(['happy', 'calm', 'anxious', 'tired', 'unwell'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewLog({ ...newLog, mood: m })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all whitespace-nowrap",
                        newLog.mood === m ? "bg-brand text-white scale-110 shadow-md" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      {getMoodLabel(m)}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="px-8 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 active:scale-95 transition-all">
                Guardar Registro
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {activeLogs.length > 0 ? activeLogs.map((log, idx) => (
          <div key={log.id} className="relative group">
            {idx !== activeLogs.length - 1 && (
              <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-slate-100 group-last:hidden" />
            )}
            <div className="flex gap-6">
              <div className="relative z-10 shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-white border-2 border-brand flex items-center justify-center text-brand font-bold shadow-sm">
                  {format(parseISO(log.date), 'dd')}
                </div>
              </div>
              <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow text-left">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800 capitalize">{format(parseISO(log.date), 'EEEE, dd MMMM', { locale: es })}</p>
                    <p className="text-xs text-slate-400">Registrado a las {format(parseISO(log.date), 'p', { locale: es })}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    log.mood === 'happy' && "bg-success/10 text-success",
                    log.mood === 'calm' && "bg-brand-light text-brand",
                    log.mood === 'anxious' && "bg-accent/10 text-accent",
                    log.mood === 'tired' && "bg-slate-100 text-slate-400",
                    log.mood === 'unwell' && "bg-danger/10 text-danger",
                  )}>
                    {getMoodLabel(log.mood)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50/50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Síntomas de Salud</p>
                    <p className="text-sm text-slate-600 italic leading-relaxed">"{log.symptoms}"</p>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Comportamiento Diario</p>
                    <p className="text-sm text-slate-600 italic leading-relaxed">"{log.behavior}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <Activity className="mx-auto text-slate-100 mb-4" size={64} />
            <p className="text-slate-400 font-medium">No hay registros para esta mascota todavía.</p>
          </div>
        )}
      </div>
    </div>
  );
}
