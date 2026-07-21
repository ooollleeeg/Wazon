import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';

// ===== FORM CONFIG =====
const measurementDevicesFormConfig: FormConfig = {
  title: 'Приймально-контрольні і вимірювальні прилади',
  sections: [
    {
      title: '📏 Основна інформація',
      fields: [
        {
          name: 'deviceName',
          label: 'Назва приладу',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: Генератор сигналів',
          fullWidth: true,
        },
        {
          name: 'deviceType',
          label: 'Тип приладу',
          type: 'text',
          placeholder: 'Наприклад: Електровимірювальний',
          fullWidth: true,
        },
        {
          name: 'serialNumber',
          label: 'Серійний номер',
          type: 'text',
          placeholder: 'Наприклад: SN-2024-001',
        },
        {
          name: 'inventoryNumber',
          label: 'Інвентарний номер',
          type: 'text',
        },
        {
          name: 'manufacturer',
          label: 'Виробник',
          type: 'text',
          placeholder: 'Наприклад: Rohde & Schwarz',
        },
        {
          name: 'yearOfManufacture',
          label: 'Рік виготовлення',
          type: 'number',
        },
      ],
    },
    {
      title: '📋 Сертифікація',
      fields: [
        {
          name: 'certificationNumber',
          label: 'Номер сертифіката',
          type: 'text',
          placeholder: 'Наприклад: УКР.С.00185694',
        },
        {
          name: 'certificationDate',
          label: 'Дата видачі сертифіката',
          type: 'date',
        },
        {
          name: 'certificationValidUntil',
          label: 'Сертифікат дійсний до',
          type: 'date',
        },
      ],
    },
    {
      title: '📝 Допуск',
      fields: [
        {
          name: 'permissionNumber',
          label: 'Номер допуску',
          type: 'text',
          placeholder: 'Наприклад: Д-14/123',
        },
        {
          name: 'permissionDate',
          label: 'Дата видачі допуску',
          type: 'date',
        },
        {
          name: 'permissionOrganization',
          label: 'Організація, що видала допуск',
          type: 'text',
          fullWidth: true,
        },
      ],
    },
  ],
  submitLabel: 'Зберегти інформацію',
};

// ===== CARD CONFIG =====
const measurementDevicesCardConfig: CardConfig = {
  title: 'deviceName',
  subtitle: 'deviceType',
  sections: [
    {
      title: '📏 Основна інформація',
      fields: [
        { label: 'Назва приладу', value: 'deviceName' },
        { label: 'Тип приладу', value: 'deviceType' },
        { label: 'Серійний номер', value: 'serialNumber' },
        { label: 'Інвентарний номер', value: 'inventoryNumber' },
        { label: 'Виробник', value: 'manufacturer' },
        { label: 'Рік виготовлення', value: 'yearOfManufacture' },
      ],
    },
    {
      title: '📋 Сертифікація',
      fields: [
        { label: 'Номер сертифіката', value: 'certificationNumber' },
        {
          label: 'Дата видачі сертифіката',
          value: 'certificationDate',
          format: 'date',
        },
        {
          label: 'Дійсний до',
          value: 'certificationValidUntil',
          format: 'date',
        },
      ],
    },
    {
      title: '📝 Допуск',
      fields: [
        { label: 'Номер допуску', value: 'permissionNumber' },
        {
          label: 'Дата видачі допуску',
          value: 'permissionDate',
          format: 'date',
        },
        { label: 'Організація', value: 'permissionOrganization' },
      ],
    },
  ],
  deleteLabel: 'Видалити запис про прилад',
  deleteConfirmName: (data) => `${data.deviceName}`,
};

// ===== LIST CONFIG =====
const measurementDevicesListConfig: ListConfig = {
  searchFields: ['deviceName', 'deviceType', 'serialNumber', 'manufacturer'],
  compactThreshold: 2,
  CardComponent: (props) => (
    <GenericCard
      config={measurementDevicesCardConfig}
      data={props}
      {...props}
    />
  ),
  CompactCardComponent: (props) => (
    <div
      style={{
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        cursor: 'pointer',
      }}
    >
      <strong>{props.deviceName}</strong>
      <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
        {props.deviceType}
      </p>
    </div>
  ),
  emptyMessage:
    'Немає записів про приймально-контрольні прилади. Додайте перший прилад.',
  noResultsMessage: 'Результатів не знайдено',
};

// ===== TAB CONFIG =====
const measurementDevicesTabConfig: TabConfig = {
  apiEndpoint: '/api/objects/measurement-devices',
  displayName: 'Приймально-контрольні прилади',
  searchPlaceholder: 'Пошук по назві, типу, серійному номеру...',
  addButtonLabel: '+ Додати прилад',
  FormComponent: (props) => (
    <GenericForm config={measurementDevicesFormConfig} {...props} />
  ),
  ListComponent: (props) => (
    <GenericList config={measurementDevicesListConfig} {...props} />
  ),
};

export default function MeasurementDevicesTab({
  expandedItemId,
}: {
  expandedItemId?: number | null;
}) {
  return (
    <GenericTab
      config={measurementDevicesTabConfig}
      expandedItemId={expandedItemId}
    />
  );
}
