import './styles/SearchControlEquipmentTable.css';

interface EquipmentItem {
  id: number;
  category: string;
  name: string;
  serialNumber: string;
  invertarNumber: string;
  releaseYear: number;
  technicalCondition: string;
  pricePerUnit: number;
  notes: string;
  verifications?: Array<{
    id: number;
    certificateRegNumber: string;
    verificationDate: string;
    validUntil: string;
    verificationCost: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface SearchControlEquipmentTableProps {
  equipment: EquipmentItem[];
  onEdit: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
}

const SearchControlEquipmentTable = ({
  equipment,
  onEdit,
  onDelete,
}: SearchControlEquipmentTableProps) => {
  return (
    <div className='search-control-table-wrapper'>
      <table className='search-control-table'>
        <thead>
          <tr>
            <th>Категорія</th>
            <th>Назва</th>
            <th>Серійний номер</th>
            <th>Рік випуску</th>
            <th>Технічний стан</th>
            <th>Ціна за одиницю</th>
            <th>Дія</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item.id}>
              <td className='category'>
                <span className='category-badge'>
                  {item.category === 'Спеціальна пошукова техніка'
                    ? '🔍 Пошукова'
                    : '📏 Вимірювальна'}
                </span>
              </td>
              <td className='name-cell'>
                <div className='name'>{item.name}</div>
                {item.notes && <small className='notes'>{item.notes}</small>}
              </td>
              <td className='serial-number'>{item.serialNumber || '—'}</td>
              <td className='release-year'>{item.releaseYear || '—'}</td>
              <td className='condition'>
                <span
                  className={`condition-badge ${item.technicalCondition.toLowerCase()}`}
                >
                  {item.technicalCondition === 'справна'
                    ? '✓ Справна'
                    : '✗ Несправна'}
                </span>
              </td>
              <td className='price'>
                {item.pricePerUnit
                  ? `${item.pricePerUnit.toLocaleString('uk-UA')} грн.`
                  : '—'}
              </td>
              <td className='actions'>
                <button
                  className='btn-edit'
                  onClick={() => onEdit(item)}
                  title='Редагувати'
                  aria-label={`Редагувати ${item.name}`}
                >
                  ✏️
                </button>
                <button
                  className='btn-delete'
                  onClick={() => onDelete(item)}
                  title='Видалити'
                  aria-label={`Видалити ${item.name}`}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SearchControlEquipmentTable;
