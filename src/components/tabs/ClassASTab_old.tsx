import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';
import ClassASCardCompact from '../class-as/ClassASCardCompact';

// ===== FORM CONFIG =====
const classASFormConfig: FormConfig = {
  title: 'АС класу 1, 2, 3',
  sections: [
    {
      title: '🏢 Основна інформація',
      fields: [
        {
          name: 'address',
          label: 'Адреса *',
          type: 'text',
          required: true,
          placeholder: "Наприклад: 252001, м. Одеса, вул. В'язів, 96",
          fullWidth: true,
        },
        {
          name: 'subdivisionName',
          label: 'Назва підрозділу *',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: СВ 55',
        },
        {
          name: 'subdivisionType',
          label: 'Тип підрозділу',
          type: 'text',
          placeholder: 'Територіальний підрозділ',
        },
        {
          name: 'serviceName',
          label: 'Назва служби',
          type: 'text',
          placeholder: 'Наприклад: СВ',
        },
        {
          name: 'systemClass',
          label: 'Клас системи *',
          type: 'select',
          required: true,
          options: [
            { value: 'АС класу 1', label: 'АС класу 1' },
            { value: 'АС класу 2', label: 'АС класу 2' },
            { value: 'АС класу 3', label: 'АС класу 3' },
          ],
        },
        {
          name: 'systemName',
          label: 'Назва системи',
          type: 'text',
          placeholder: 'Назва АС',
          fullWidth: true,
        },
      ],
    },
    {
      title: '📋 Документація та сертифікація',
      fields: [
        {
          name: 'categorizationActDate',
          label: 'Дата акту категоризації',
          type: 'date',
        },
        {
          name: 'categorizationActNumber',
          label: 'Номер акту категоризації',
          type: 'text',
        },
        {
          name: 'kzzName',
          label: 'Назва КЗЗ',
          type: 'text',
        },
        {
          name: 'kzzSerial',
          label: 'Серійний номер КЗЗ',
          type: 'text',
        },
        {
          name: 'antivirus',
          label: 'Антивірус',
          type: 'text',
        },
        {
          name: 'antivirusOpinionNumber',
          label: 'Номер висновку антивірусу',
          type: 'text',
        },
      ],
    },
    {
      title: '✅ Тестування та атестація',
      fields: [
        {
          name: 'ttCreateDate',
          label: 'Дата створення ТТ',
          type: 'date',
        },
        {
          name: 'ttCreateNumber',
          label: 'Номер ТТ',
          type: 'text',
        },
        {
          name: 'formulaDate',
          label: 'Дата формули',
          type: 'date',
        },
        {
          name: 'formulaNumber',
          label: 'Номер формули',
          type: 'text',
        },
        {
          name: 'passportDate',
          label: 'Дата паспорту',
          type: 'date',
        },
        {
          name: 'passportNumber',
          label: 'Номер паспорту',
          type: 'text',
        },
        {
          name: 'protocolDate',
          label: 'Дата протоколу',
          type: 'date',
        },
        {
          name: 'protocolNumber',
          label: 'Номер протоколу',
          type: 'text',
        },
        {
          name: 'protocolValidUntil',
          label: 'Дійсний до',
          type: 'date',
        },
        {
          name: 'kspActDate',
          label: 'Дата акту КСП',
          type: 'date',
        },
        {
          name: 'kspActNumber',
          label: 'Номер акту КСП',
          type: 'text',
        },
        {
          name: 'attestationRegDate',
          label: 'Дата реєстрації атестації',
          type: 'date',
        },
        {
          name: 'attestationRegNumber',
          label: 'Номер реєстрації атестації',
          type: 'text',
        },
        {
          name: 'attestationDsszziDate',
          label: 'Дата атестації ДССЗЗІ',
          type: 'date',
        },
        {
          name: 'attestationDsszziNumber',
          label: 'Номер атестації ДССЗЗІ',
          type: 'text',
        },
        {
          name: 'attestationValidUntil',
          label: 'Атестація дійсна до',
          type: 'date',
        },
      ],
    },
  ],
  nestedFields: [
    {
      name: 'documents',
      title: 'Документи',
      icon: '📄',
      defaultItem: { docType: '', date: '', number: '' },
      fields: [
        {
          name: 'docType',
          label: 'Тип документу *',
          type: 'text',
          required: true,
          fullWidth: true,
        },
        {
          name: 'date',
          label: 'Дата',
          type: 'date',
        },
        {
          name: 'number',
          label: 'Номер',
          type: 'text',
        },
      ],
    },
    {
      name: 'protectionMeans',
      title: 'Засоби захисту',
      icon: '🛡️',
      defaultItem: {
        name: '',
        serialNumber: '',
        releaseYear: '',
        certificateInfo: '',
      },
      fields: [
        {
          name: 'name',
          label: 'Назва *',
          type: 'text',
          required: true,
          fullWidth: true,
        },
        {
          name: 'serialNumber',
          label: 'Серійний номер',
          type: 'text',
        },
        {
          name: 'releaseYear',
          label: 'Рік випуску',
          type: 'number',
        },
        {
          name: 'certificateInfo',
          label: 'Інформація про сертифікат',
          type: 'text',
          fullWidth: true,
        },
      ],
    },
    {
      name: 'software',
      title: 'Програмне забезпечення',
      icon: '💾',
      defaultItem: { name: '', version: '' },
      fields: [
        {
          name: 'name',
          label: 'Назва ПЗ *',
          type: 'text',
          required: true,
          fullWidth: true,
        },
        {
          name: 'version',
          label: 'Версія',
          type: 'text',
        },
      ],
    },
    {
      name: 'orders',
      title: 'Накази',
      icon: '📑',
      defaultItem: { orderType: '', number: '', date: '', publisher: '' },
      fields: [
        {
          name: 'orderType',
          label: 'Тип наказу',
          type: 'text',
        },
        {
          name: 'number',
          label: 'Номер',
          type: 'text',
        },
        {
          name: 'date',
          label: 'Дата',
          type: 'date',
        },
        {
          name: 'publisher',
          label: 'Видавець',
          type: 'text',
        },
      ],
    },
  ],
  submitLabel: 'Зберегти АС',
};

// ===== CARD CONFIG =====
const classASCardConfig: CardConfig = {
  title: 'systemName',
  subtitle: 'address',
  sections: [
    {
      title: '🏢 Основна інформація',
      fields: [
        { label: 'Адреса', value: 'address' },
        { label: 'Підрозділ', value: 'subdivisionName', format: 'badge' },
        { label: 'Тип підрозділу', value: 'subdivisionType' },
        { label: 'Служба', value: 'serviceName' },
        { label: 'Клас системи', value: 'systemClass', format: 'badge' },
      ],
    },
    {
      title: '📋 Документація',
      fields: [
        { label: 'Акт категоризації', value: 'categorizationActNumber' },
        { label: 'КЗЗ', value: 'kzzName' },
        { label: 'Серійний номер КЗЗ', value: 'kzzSerial' },
        { label: 'Антивірус', value: 'antivirus' },
      ],
    },
    {
      title: '✅ Атестація',
      fields: [
        {
          label: 'Атестація дійсна до',
          value: 'attestationValidUntil',
          format: 'date',
        },
        {
          label: 'Протокол дійсний до',
          value: 'protocolValidUntil',
          format: 'date',
        },
      ],
    },
  ],
  nestedSections: [
    {
      name: 'documents',
      title: 'Документи',
      icon: '📄',
      itemTitle: 'docType',
      fields: [
        { label: 'Дата', value: 'date', format: 'date' },
        { label: 'Номер', value: 'number' },
      ],
    },
    {
      name: 'protectionMeans',
      title: 'Засоби захисту',
      icon: '🛡️',
      itemTitle: 'name',
      fields: [
        { label: 'Серійний номер', value: 'serialNumber' },
        { label: 'Рік випуску', value: 'releaseYear' },
      ],
    },
    {
      name: 'software',
      title: 'ПЗ',
      icon: '💾',
      itemTitle: 'name',
      fields: [{ label: 'Версія', value: 'version' }],
    },
    {
      name: 'orders',
      title: 'Накази',
      icon: '📑',
      itemTitle: 'orderType',
      fields: [
        { label: 'Номер', value: 'number' },
        { label: 'Дата', value: 'date', format: 'date' },
        { label: 'Видавець', value: 'publisher' },
      ],
    },
  ],
  deleteLabel: 'Видалити систему',
  deleteConfirmName: (data) => `АС ${data.systemName} (${data.systemClass})`,
};

// ===== LIST CONFIG =====
const classASListConfig: ListConfig = {
  searchFields: [
    'address',
    'subdivisionName',
    'serviceName',
    'systemName',
    'systemClass',
  ],
  CardComponent: (props) => (
    <GenericCard config={classASCardConfig} data={props} {...props} />
  ),
  CompactCardComponent: ClassASCardCompact,
  emptyMessage:
    'Немає записів про автоматизовані системи. Додайте першу систему.',
  noResultsMessage: 'Результатів не знайдено за заданими критеріями пошуку',
};

// ===== TAB CONFIG =====
const classASTabConfig: TabConfig = {
  apiEndpoint: '/api/objects/class_a_systems',
  displayName: 'АС класу 1, 2, 3',
  searchPlaceholder: 'Пошук по адресі, назві підрозділу, назві АС...',
  addButtonLabel: '+ Додати АС',
  FormComponent: (props) => (
    <GenericForm config={classASFormConfig} {...props} />
  ),
  ListComponent: (props) => (
    <GenericList config={classASListConfig} {...props} />
  ),
};

// ===== COMPONENT =====
export default function ClassASTab() {
  return <GenericTab config={classASTabConfig} />;
}

// import { useState, useEffect, useRef } from 'react';
// import ClassASForm from '../class-as/ClassASForm';
// import ClassASList from '../class-as/ClassASList';
// import '../../styles/TabContent.css';

// interface ClassASData {
//   id: number;
//   address: string;
//   subdivisionName: string;
//   subdivisionType: string;
//   serviceName: string;
//   systemClass: string;
//   systemName: string;
//   categorizationActDate: string;
//   categorizationActNumber: string;
//   kzzName: string;
//   kzzSerial: string;
//   antivirus: string;
//   antivirusOpinionNumber: string;
//   ttCreateDate: string;
//   ttCreateNumber: string;
//   formulaDate: string;
//   formulaNumber: string;
//   passportDate: string;
//   passportNumber: string;
//   protocolDate: string;
//   protocolNumber: string;
//   protocolValidUntil: string;
//   kspActDate: string;
//   kspActNumber: string;
//   attestationRegDate: string;
//   attestationRegNumber: string;
//   attestationDsszziDate: string;
//   attestationDsszziNumber: string;
//   attestationValidUntil: string;
//   documents: any[];
//   protectionMeans: any[];
//   software: any[];
//   orders: any[];
// }

// export default function ClassASTab() {
//   const [systems, setSystems] = useState<ClassASData[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [showForm, setShowForm] = useState(false);
//   const [editingId, setEditingId] = useState<number | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');

//   const formContainerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     console.log('ClassASTab mounted, fetching systems...');
//     fetchSystems();
//   }, []);

//   const fetchSystems = async () => {
//     try {
//       setIsLoading(true);
//       setError('');
//       console.log('Fetching from /api/objects/class_a_systems');

//       const response = await fetch('/api/objects/class_a_systems');

//       console.log('Response status:', response.status);

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log('Received data:', data);
//       setSystems(data);
//     } catch (err) {
//       console.error('Fetch error:', err);
//       setError(`Помилка завантаження: ${(err as Error).message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSubmit = async (data: ClassASData) => {
//     try {
//       setIsLoading(true);
//       setError('');

//       const url = editingId
//         ? `/api/objects/class_a_systems/${editingId}`
//         : '/api/objects/class_a_systems';
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

//       await fetchSystems();
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

//   const handleDelete = async (id: number) => {
//     try {
//       setIsLoading(true);
//       setError('');

//       console.log('Deleting system:', id);

//       const response = await fetch(`/api/objects/class_a_systems/${id}`, {
//         method: 'DELETE',
//       });

//       if (!response.ok) {
//         throw new Error('Помилка видалення');
//       }

//       console.log('System deleted successfully');
//       await fetchSystems();
//     } catch (err) {
//       console.error('Delete error:', err);
//       setError(`Помилка видалення: ${(err as Error).message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEdit = (system: ClassASData) => {
//     console.log('=== EDIT START ===');
//     console.log('System data:', system);
//     setEditingId(system.id || null);
//     setShowForm(true);

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

//   const handleFormSubmit = (data: any) => {
//     handleSubmit({ ...data, id: editingId || 0 });
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
//           placeholder='Пошук по адресі, назві підрозділу, назві АС...'
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
//             + Додати АС
//           </button>
//         )}
//       </div>

//       {showForm && (
//         <div className='form-container' ref={formContainerRef}>
//           <ClassASForm
//             onSubmit={handleFormSubmit}
//             initialData={
//               editingId ? systems.find((s) => s.id === editingId) : undefined
//             }
//             isLoading={isLoading}
//             onClose={handleCloseForm}
//           />
//         </div>
//       )}

//       <ClassASList
//         systems={systems}
//         searchTerm={searchTerm}
//         onEdit={handleEdit}
//         onDelete={handleDelete}
//         isLoading={isLoading}
//       />
//     </div>
//   );
// }
