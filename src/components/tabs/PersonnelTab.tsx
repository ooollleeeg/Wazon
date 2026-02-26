import { useState, useEffect, useRef } from 'react';
import PersonnelForm from '../personnel/PersonnelForm';
import PersonnelList from '../personnel/PersonnelList';
import '../../styles/TabContent.css';

interface PersonnelData {
  id: number;
  position: string;
  officialRank: string;
  actualRank: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  mobilePhone: string;
  education: any[];
  certificates: any[];
}

export default function PersonnelTab() {
  const [personnel, setPersonnel] = useState<PersonnelData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Ref для прокрутки в начало формы
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Загрузить список персонала
  useEffect(() => {
    console.log('PersonnelTab mounted, fetching personnel...');
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Fetching from /api/objects/personnel');

      const response = await fetch('/api/objects/personnel');

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      setPersonnel(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Помилка завантаження: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Сохранить новый или обновить
  const handleSubmit = async (data: Omit<PersonnelData, 'id'>) => {
    try {
      setIsLoading(true);
      setError('');

      const url = editingId
        ? `/api/objects/personnel/${editingId}`
        : '/api/objects/personnel';
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

      await fetchPersonnel();
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

  // Удалить
  const handleDelete = async (id: number) => {
    if (!confirm('Ви впевнені?')) return;

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(`/api/objects/personnel/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Помилка видалення');
      }

      await fetchPersonnel();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (p: PersonnelData) => {
    console.log('=== EDIT START ===');
    console.log('Personnel data:', p);
    setEditingId(p.id || null);
    setShowForm(true);

    // Прокрутка к форме с небольшой задержкой
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

  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(!showForm);

    // Если открываем форму для новой карточки, тоже скроллим вверх
    if (!showForm) {
      setTimeout(() => {
        if (formContainerRef.current) {
          formContainerRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    }
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
          placeholder='Пошук по ПІБ, посаді, email...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className='btn-primary' onClick={handleAddNew}>
          {showForm ? '✕ Закрити' : '+ Додати сотрудника'}
        </button>
      </div>

      {showForm && (
        <div className='form-container' ref={formContainerRef}>
          <PersonnelForm
            onSubmit={handleSubmit}
            initialData={
              editingId ? personnel.find((p) => p.id === editingId) : undefined
            }
            isLoading={isLoading}
          />
        </div>
      )}

      <PersonnelList
        personnel={personnel}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
