import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';
import PersonnelCardCompact from '../personnel/PersonnelCardCompact';

// ===== FORM CONFIG =====
const personnelFormConfig: FormConfig = {
  title: 'працівники',
  sections: [
    {
      title: '👤 Особисті дані',
      fields: [
        {
          name: 'fullName',
          label: 'ПІБ *',
          type: 'text',
          required: true,
          placeholder: "Введіть прізвище, ім'я та побатькові",
          fullWidth: true,
        },
        {
          name: 'dateOfBirth',
          label: 'Дата народження',
          type: 'date',
        },
      ],
    },
    {
      title: '💼 Посадова інформація',
      fields: [
        {
          name: 'position',
          label: 'Посада',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: Старший інспектор',
          fullWidth: true,
        },

        {
          name: 'officialRank',
          label: 'Спеціальне звання за посадою',
          type: 'text',
          placeholder: 'Наприклад: капітан поліції',
        },
        {
          name: 'actualRank',
          label: 'Фактичне спеціальне звання',
          type: 'text',
          placeholder: 'Наприклад: лейтенант поліції',
        },
        {
          name: 'department',
          label: 'Підрозділ',
          type: 'text',
          placeholder: 'Наприклад: Щ-1',
        },
      ],
    },
    {
      title: '📞 Контактні дані',
      fields: [
        {
          name: 'email',
          label: 'E-mail',
          type: 'email',
          placeholder: 'example@domain.com',
        },
        {
          name: 'phone',
          label: 'Робочий телефон',
          type: 'tel',
          placeholder: '+380 (ХХ) XXX-XXXX',
        },
        {
          name: 'mobilePhone',
          label: 'Мобільний телефон',
          type: 'tel',
          placeholder: '+380 XX XXX XXXX',
        },
      ],
    },
  ],
  nestedFields: [
    {
      name: 'education',
      title: 'Освіта',
      icon: '📚',
      defaultItem: { institution: '', yearCompleted: '', specialties: '' },
      fields: [
        {
          name: 'institution',
          label: 'Навчальний заклад *',
          type: 'text',
          required: true,
          placeholder: 'Назва ВНЗ',
          fullWidth: true,
        },
        {
          name: 'specialties',
          label: 'Спеціальність',
          type: 'text',
          placeholder: "Наприклад: Комп'ютерні науки, бакалавр",
          fullWidth: true,
        },
        {
          name: 'yearCompleted',
          label: 'Рік завершення',
          type: 'number',
          placeholder: '2020',
          min: 1996,
          max: new Date().getFullYear(),
        },
      ],
    },
    {
      name: 'certificates',
      title: 'Сертифікати та підготовка',
      icon: '📜',
      defaultItem: {
        certificateNumber: '',
        trainingName: '',
        location: '',
        year: '',
      },
      fields: [
        {
          name: 'trainingName',
          label: 'Назва навчання *',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: Курс кібербезпеки',
          fullWidth: true,
        },
        {
          name: 'certificateNumber',
          label: 'Номер сертифіката',
          type: 'text',
          placeholder: 'Наприклад: СЕР-2023-001',
        },
        {
          name: 'location',
          label: 'Місце проведення',
          type: 'text',
          placeholder: 'Наприклад: Київ, НТУУ «КПІ»',
        },
        {
          name: 'year',
          label: 'Рік',
          type: 'number',
          placeholder: '2023',
          min: 2006,
          max: new Date().getFullYear(),
        },
      ],
    },
  ],
  submitLabel: 'Зберегти внесену інформацію про працівника',
};

// ===== CARD CONFIG =====
const personnelCardConfig: CardConfig = {
  title: 'fullName',
  subtitle: 'position',
  sections: [
    {
      title: '👤 Особисті дані',
      fields: [
        { label: 'ПІБ', value: 'fullName' },
        { label: 'Дата народження', value: 'dateOfBirth', format: 'date' },
      ],
    },
    {
      title: '💼 Посадова інформація',
      fields: [
        { label: 'Посада', value: 'position', format: 'badge' },
        { label: 'Офіційне звання', value: 'officialRank' },
        { label: 'Фактичне звання', value: 'actualRank' },
        { label: 'Підрозділ', value: 'department' },
      ],
    },
    {
      title: '📞 Контактні дані',
      fields: [
        { label: 'E-mail', value: 'email', format: 'link' },
        { label: 'Робочий телефон', value: 'phone', format: 'link' },
        { label: 'Мобільний телефон', value: 'mobilePhone', format: 'link' },
      ],
    },
  ],
  nestedSections: [
    {
      name: 'education',
      title: 'Освіта',
      icon: '📚',
      itemTitle: 'institution',
      fields: [
        { label: 'Спеціальність', value: 'specialties' },
        { label: 'Рік закінчення', value: 'yearCompleted' },
      ],
    },
    {
      name: 'certificates',
      title: 'Сертифікати та підготовка',
      icon: '📜',
      itemTitle: 'trainingName',
      fields: [
        { label: 'Номер сертифіката', value: 'certificateNumber' },
        { label: 'Місце проведення', value: 'location' },
        { label: 'Рік', value: 'year' },
      ],
    },
  ],
  deleteLabel: 'Видалити запис про працівника',
  deleteConfirmName: (data) => `${data.fullName} (${data.position})`,
};

// ===== LIST CONFIG =====
const personnelListConfig: ListConfig = {
  searchFields: ['fullName', 'position', 'department', 'email', 'phone'],
  compactThreshold: 2,
  CardComponent: (props) => (
    <GenericCard config={personnelCardConfig} data={props} {...props} />
  ),
  CompactCardComponent: PersonnelCardCompact,
  emptyMessage: 'Немає записів про персонал. Додайте першого працівника.',
  noResultsMessage: 'Результатів не знайдено за заданими критеріями пошуку',
};

// ===== TAB CONFIG =====
const personnelTabConfig: TabConfig = {
  apiEndpoint: '/api/objects/personnel',
  displayName: 'Персонал',
  searchPlaceholder: 'Пошук по ПІБ, посаді, підрозділу, телефону...',
  addButtonLabel: '+ Додати працівника',
  FormComponent: (props) => (
    <GenericForm config={personnelFormConfig} {...props} />
  ),
  ListComponent: (props) => (
    <GenericList config={personnelListConfig} {...props} />
  ),
};

// ===== COMPONENT =====
export default function PersonnelTab() {
  return <GenericTab config={personnelTabConfig} />;
}

// import { useState, useEffect, useRef } from 'react';
// import PersonnelForm from '../personnel/PersonnelForm';
// import PersonnelList from '../personnel/PersonnelList';
// import '../../styles/TabContent.css';

// interface PersonnelData {
//   id: number;
//   position: string;
//   officialRank: string;
//   actualRank: string;
//   fullName: string;
//   dateOfBirth: string;
//   email: string;
//   phone: string;
//   mobilePhone: string;
//   education: any[];
//   certificates: any[];
// }

// export default function PersonnelTab() {
//   const [personnel, setPersonnel] = useState<PersonnelData[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Ref для прокрутки в начало формы
//   const formContainerRef = useRef<HTMLDivElement>(null);

//   // Загрузить список персонала
//   useEffect(() => {
//     console.log('PersonnelTab mounted, fetching personnel...');
//     fetchPersonnel();
//   }, []);

//   const fetchPersonnel = async () => {
//     try {
//       setIsLoading(true);
//       setError('');
//       console.log('Fetching from /api/objects/personnel');

//       const response = await fetch('/api/objects/personnel');

//       console.log('Response status:', response.status);

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log('Received data:', data);
//       setPersonnel(data);
//     } catch (err) {
//       console.error('Fetch error:', err);
//       setError(`Помилка завантаження: ${(err as Error).message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Сохранить новый или обновить
//   const handleSubmit = async (data: Omit<PersonnelData, 'id'>) => {
//     try {
//       setIsLoading(true);
//       setError('');

//       const url = editingId
//         ? `/api/objects/personnel/${editingId}`
//         : '/api/objects/personnel';
//       const method = editingId ? 'PUT' : 'POST';

//       console.log('=== SUBMIT START ===');
//       console.log('URL:', url);
//       console.log('Method:', method);
//       console.log('Data:', data);

//       const response = await fetch(url, {
//         method,
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data),
//       });

//       console.log('Response status:', response.status);

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error('Error response:', errorData);
//         throw new Error(
//           errorData.error || `HTTP error! status: ${response.status}`,
//         );
//       }

//       const result = await response.json();
//       console.log('Success response:', result);

//       await fetchPersonnel();
//       setShowForm(false);
//       setEditingId(null);
//       console.log('=== SUBMIT END (SUCCESS) ===');
//     } catch (err) {
//       console.error('=== SUBMIT ERROR ===', err);
//       setError(`Помилка збереження: ${(err as Error).message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Удалить
//   const handleDelete = async (id: number) => {
//     try {
//       setIsLoading(true);
//       setError('');

//       console.log('Deleting personnel:', id);

//       const response = await fetch(`/api/objects/personnel/${id}`, {
//         method: 'DELETE',
//       });

//       if (!response.ok) {
//         throw new Error('Помилка видалення');
//       }

//       console.log('Personnel deleted successfully');
//       await fetchPersonnel();
//     } catch (err) {
//       console.error('Delete error:', err);
//       setError(`Помилка видалення: ${(err as Error).message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEdit = (p: PersonnelData) => {
//     console.log('=== EDIT START ===');
//     console.log('Personnel data:', p);
//     setEditingId(p.id || null);
//     setShowForm(true);

//     // Прокрутка к форме с небольшой задержкой
//     setTimeout(() => {
//       if (formContainerRef.current) {
//         formContainerRef.current.scrollIntoView({
//           behavior: 'smooth',
//           block: 'start',
//         });
//       }
//     }, 100);

//     console.log('=== EDIT END ===');
//   };

//   const handleCloseForm = () => {
//     setShowForm(false);
//     setEditingId(null);
//   };

//   return (
//     <div className='tab-content-wrapper'>
//       {error && (
//         <div className='error-message'>
//           <span>{error}</span>
//           <button onClick={() => setError('')}>✕</button>
//         </div>
//       )}

//       <div className='content-controls'>
//         <input
//           type='text'
//           className='search-input'
//           placeholder='Пошук по ПІБ, посаді, email...'
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         {!showForm && (
//           <button
//             className='btn-primary'
//             onClick={() => {
//               setEditingId(null);
//               setShowForm(true);
//               setTimeout(() => {
//                 if (formContainerRef.current) {
//                   formContainerRef.current.scrollIntoView({
//                     behavior: 'smooth',
//                     block: 'start',
//                   });
//                 }
//               }, 100);
//             }}
//           >
//             + Додати працівника
//           </button>
//         )}
//       </div>

//       {showForm && (
//         <div className='form-container' ref={formContainerRef}>
//           <PersonnelForm
//             onSubmit={handleSubmit}
//             initialData={
//               editingId ? personnel.find((p) => p.id === editingId) : undefined
//             }
//             isLoading={isLoading}
//             onClose={handleCloseForm}
//           />
//         </div>
//       )}

//       <PersonnelList
//         personnel={personnel}
//         searchTerm={searchTerm}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         isLoading={isLoading}
//       />
//     </div>
//   );
// }
