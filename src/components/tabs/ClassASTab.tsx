import { useState, useEffect, useRef } from 'react';
import ClassASForm from '../class-as/ClassASForm';
import ClassASList from '../class-as/ClassASList';
import '../../styles/TabContent.css';

interface ClassASData {
  id: number;
  address: string;
  subdivisionName: string;
  subdivisionType: string;
  serviceName: string;
  systemClass: string;
  systemName: string;
  categorizationActDate: string;
  categorizationActNumber: string;
  kzzName: string;
  kzzSerial: string;
  antivirus: string;
  antivirusOpinionNumber: string;
  ttCreateDate: string;
  ttCreateNumber: string;
  formulaDate: string;
  formulaNumber: string;
  passportDate: string;
  passportNumber: string;
  protocolDate: string;
  protocolNumber: string;
  protocolValidUntil: string;
  kspActDate: string;
  kspActNumber: string;
  attestationRegDate: string;
  attestationRegNumber: string;
  attestationDsszziDate: string;
  attestationDsszziNumber: string;
  attestationValidUntil: string;
  documents: any[];
  protectionMeans: any[];
  software: any[];
  orders: any[];
}

export default function ClassASTab() {
  const [systems, setSystems] = useState<ClassASData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('ClassASTab mounted, fetching systems...');
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Fetching from /api/objects/class_a_systems');

      const response = await fetch('/api/objects/class_a_systems');

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      setSystems(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Помилка завантаження: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: ClassASData) => {
    try {
      setIsLoading(true);
      setError('');

      const url = editingId
        ? `/api/objects/class_a_systems/${editingId}`
        : '/api/objects/class_a_systems';
      const method = editingId ? 'PUT' : 'POST';

      console.log('=== SUBMIT START ===');
      console.log('URL:', url);
      console.log('Method:', method);
      console.log('Data:', data);

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();
      console.log('Success response:', result);

      await fetchSystems();
      setShowForm(false);
      setEditingId(null);
      console.log('=== SUBMIT END (SUCCESS) ===');
    } catch (err) {
      console.error('=== SUBMIT ERROR ===', err);
      setError(`Помилка збереження: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      setError('');

      console.log('Deleting system:', id);

      const response = await fetch(`/api/objects/class_a_systems/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Помилка видалення');
      }

      console.log('System deleted successfully');
      await fetchSystems();
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Помилка видалення: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (system: ClassASData) => {
    console.log('=== EDIT START ===');
    console.log('System data:', system);
    setEditingId(system.id || null);
    setShowForm(true);

    setTimeout(() => {
      if (formContainerRef.current) {
        formContainerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 100);

    console.log('=== EDIT END ===');
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleFormSubmit = (data: any) => {
    handleSubmit({ ...data, id: editingId || 0 });
  };

  return (
    <div className='tab-content-wrapper'>
      {error && (
        <div className='error-message'>
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className='content-controls'>
        <input
          type='text'
          className='search-input'
          placeholder='Пошук по адресі, назві підрозділу, назві АС...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {!showForm && (
          <button
            className='btn-primary'
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
              setTimeout(() => {
                if (formContainerRef.current) {
                  formContainerRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }
              }, 100);
            }}
          >
            + Додати АС
          </button>
        )}
      </div>

      {showForm && (
        <div className='form-container' ref={formContainerRef}>
          <ClassASForm
            onSubmit={handleFormSubmit}
            initialData={
              editingId ? systems.find((s) => s.id === editingId) : undefined
            }
            isLoading={isLoading}
            onClose={handleCloseForm}
          />
        </div>
      )}

      <ClassASList
        systems={systems}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
