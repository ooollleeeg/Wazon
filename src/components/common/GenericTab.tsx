import { useState, useEffect, useRef } from 'react';
import '../../styles/TabContent.css';

export interface TabConfig {
  apiEndpoint: string; // '/api/objects/personnel'
  displayName: string; // 'Персонал'
  searchPlaceholder: string; // 'Пошук по ПІБ, посаді, email...'
  addButtonLabel: string; // '+ Додати працівника'
  FormComponent: React.ComponentType<any>;
  ListComponent: React.ComponentType<any>;
}

interface GenericTabProps {
  config: TabConfig;
}

export default function GenericTab({ config }: GenericTabProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log(`${config.displayName} mounted, fetching items...`);
    fetchItems();
  }, [config.apiEndpoint]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      console.log(`Fetching from ${config.apiEndpoint}`);

      const response = await fetch(config.apiEndpoint);

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      setItems(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Помилка завантаження: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSaving(true);
      setError('');

      const url = editingId
        ? `${config.apiEndpoint}/${editingId}`
        : config.apiEndpoint;
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

      setIsSaving(false);
      await fetchItems();
      setShowForm(false);
      setEditingId(null);
      console.log('=== SUBMIT END (SUCCESS) ===');
    } catch (err) {
      console.error('=== SUBMIT ERROR ===', err);
      setError(`Помилка збереження: ${(err as Error).message}`);
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setIsLoading(true);
      setError('');

      console.log(`Deleting from ${config.apiEndpoint}/${id}`);

      const response = await fetch(`${config.apiEndpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Помилка видалення');
      }

      console.log('Item deleted successfully');
      await fetchItems();
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Помилка видалення: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    console.log('=== EDIT START ===');
    console.log('Item data:', item);
    setEditingId(item.id || null);
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
          placeholder={config.searchPlaceholder}
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
            {config.addButtonLabel}
          </button>
        )}
      </div>

      {showForm && (
        <div className='form-container' ref={formContainerRef}>
          <config.FormComponent
            onSubmit={handleFormSubmit}
            initialData={
              editingId ? items.find((i) => i.id === editingId) : undefined
            }
            isLoading={isSaving}
            onClose={handleCloseForm}
          />
        </div>
      )}

      <config.ListComponent
        items={items}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        isSaving={isSaving}
      />
    </div>
  );
}
