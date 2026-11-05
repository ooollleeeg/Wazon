import { useState, useEffect, useRef } from 'react';
import '../../styles/TabContent.css';
import ObjectDeleteProtectionMeansModal from '../modals/ObjectDeleteProtectionMeansModal';

type ProtectionMeanDeleteOption = {
  categoryId?: number;
  toolType?: string;
  name?: string;
  serialNumber?: string;
  invertarNumber?: string;
  isSharedKtzi?: number;
  assignmentCount?: number;
};

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
  expandedItemId?: number | null;
  onDataChanged?: () => void;
  preFilteredItems?: any[];
}

export default function GenericTab({
  config,
  expandedItemId,
  onDataChanged,
  preFilteredItems,
}: GenericTabProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    name: string;
    means: ProtectionMeanDeleteOption[];
  } | null>(null);

  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
  }, [config.apiEndpoint]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(config.apiEndpoint);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const result = await response.json();

      setIsSaving(false);
      await fetchItems();
      setShowForm(false);
      setEditingId(null);
      onDataChanged?.();
      if (result.protectionMeanWarnings?.length) {
        const skipped = result.protectionMeanWarnings
          .map((warning: any) => warning.mean?.name || 'Засіб ТЗІ')
          .join(', ');
        setError(
          `Збережено, але не додано засоби, що вже обліковуються в системі: ${skipped}`,
        );
      }
    } catch (err) {
      console.error('=== SUBMIT ERROR ===', err);
      setError(`Помилка збереження: ${(err as Error).message}`);
      setIsSaving(false);
    }
  };

  const performDelete = async (
    id: number,
    protectionMeansAction?: 'return' | 'remove',
    removeSharedAssignments = false,
  ) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${config.apiEndpoint}/${id}`, {
        method: 'DELETE',
        ...(protectionMeansAction
          ? {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                protectionMeansAction,
                removeSharedAssignments,
              }),
            }
          : {}),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Помилка видалення');
      }

      setPendingDelete(null);
      await fetchItems();
      onDataChanged?.();
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Помилка видалення: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    const item = items.find((record) => Number(record.id) === Number(id));
    if (!item) {
      setError('Не вдалося знайти об’єкт для видалення');
      return;
    }

    const means = [
      ...(Array.isArray(item.protectionMeans) ? item.protectionMeans : []),
      ...(Array.isArray(item.sharedProtectionMeans)
        ? item.sharedProtectionMeans
        : []),
    ];
    const uniqueMeans = new Map<string, ProtectionMeanDeleteOption>();
    means.forEach((mean) => {
      const key = [
        mean.categoryId || mean.toolType || '',
        mean.serialNumber || '',
        mean.invertarNumber || '',
        mean.name || '',
      ].join('|');
      const existing = uniqueMeans.get(key);
      if (!existing || mean.isSharedKtzi) {
        uniqueMeans.set(key, mean);
      }
    });

    if (uniqueMeans.size) {
      setPendingDelete({
        id,
        name:
          item.systemName ||
          item.serviceName ||
          item.subdivisionName ||
          item.name ||
          config.displayName,
        means: [...uniqueMeans.values()],
      });
      return;
    }
    void performDelete(id);
  };

  const handleEdit = (item: any) => {
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

      {pendingDelete && (
        <ObjectDeleteProtectionMeansModal
          objectName={pendingDelete.name}
          means={pendingDelete.means}
          isLoading={isLoading}
          onCancel={() => setPendingDelete(null)}
          onConfirm={(action, removeSharedAssignments) =>
            void performDelete(
              pendingDelete.id,
              action,
              removeSharedAssignments,
            )
          }
        />
      )}

      <config.ListComponent
        items={preFilteredItems || items}
        searchTerm={searchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        isSaving={isSaving}
        expandedItemId={expandedItemId}
        onRefreshData={fetchItems}
      />
    </div>
  );
}
