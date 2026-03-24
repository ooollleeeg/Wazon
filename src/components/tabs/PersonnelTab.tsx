import GenericTab, { TabConfig } from '../common/GenericTab';
import GenericForm, { FormConfig } from '../common/GenericForm';
import GenericList, { ListConfig } from '../common/GenericList';
import GenericCard, { CardConfig } from '../common/GenericCard';
import PersonnelCardCompact from '../personnel/PersonnelCardCompact';

// ===== FORM CONFIG =====
const personnelFormConfig: FormConfig = {
  title: 'працівника',
  sections: [
    {
      title: '👤 Особисті дані',
      fields: [
        {
          name: 'fullName',
          label: 'ПІБ',
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
          name: 'dateOfOvs',
          label: 'З якого часу в ОВС',
          type: 'date',
        },
        {
          name: 'dateOfNpu',
          label: 'З якого часу в НПУ',
          type: 'date',
        },
        {
          name: 'position',
          label: 'Посада',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: Старший інспектор',
          fullWidth: true,
        },
        {
          name: 'dateOfPosition',
          label: 'З якого часу на посаді',
          type: 'date',
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
          placeholder: 'Наприклад: відділ технічного захисту інформації',
        },
        {
          name: 'dateOfDepartment',
          label: 'З якого часу в підрозділі',
          type: 'date',
        },
      ],
    },
    {
      title: '📞 Контактні дані',
      fields: [
        {
          name: 'email',
          label: 'Службовий E-mail',
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
      defaultItem: {
        institution: '',
        yearCompleted: '',
        specialties: '',
        educationRank: '',
      },
      fields: [
        {
          name: 'institution',
          label: 'Навчальний заклад',
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
          name: 'educationRank',
          label: 'Здобутий освітній ступінь',
          type: 'text',
          placeholder: 'Наприклад: бакалавр',
          fullWidth: true,
        },
        {
          name: 'yearCompleted',
          label: 'Рік закінчення',
          type: 'number',
          placeholder: '2001',
          min: 1996,
          max: new Date().getFullYear(),
        },
      ],
    },
    {
      name: 'certificates',
      title: 'Підвищення кваліфікації та перепідготовка',
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
          label: 'Назва курсу навчання',
          type: 'text',
          required: true,
          placeholder: 'Наприклад: Курс підвищення кваліфікації у галузі ТЗІ',
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
  submitLabel: 'Зберегти внесену інформацію',
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
        { label: 'З якого часу в ОВС', value: 'dateOfOvs', format: 'date' },
        { label: 'З якого часу в НПУ', value: 'dateOfNpu', format: 'date' },
        { label: 'Посада', value: 'position', format: 'badge' },
        {
          label: 'З якого часу в посаді',
          value: 'dateOfPosition',
          format: 'date',
        },
        { label: 'Спеціальне звання за посадою', value: 'officialRank' },
        { label: 'Фактичне спеціальне звання', value: 'actualRank' },
        { label: 'Підрозділ', value: 'department' },
        {
          label: 'З якого часу в підрозділі',
          value: 'dateOfDepartment',
          format: 'date',
        },
      ],
    },
    {
      title: '📞 Контактні дані',
      fields: [
        { label: 'Службовий E-mail', value: 'email', format: 'link' },
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
        { label: 'Здобутий освітній ступінь', value: 'educationRank' },
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
  searchFields: [
    'fullName',
    'position',
    'actualRank',
    'department',
    'email',
    'phone',
  ],
  sortFunction: (items: any[]) => {
    return items.sort((a, b) => {
      const positionA = a.position?.toLowerCase() || '';
      const positionB = b.position?.toLowerCase() || '';

      // Пріоритет 1: "начальник"
      const aHasChief = positionA.includes('начальник');
      const bHasChief = positionB.includes('начальник');

      if (aHasChief && !bHasChief) return -1;
      if (!aHasChief && bHasChief) return 1;

      // Пріоритет 2: "заступник"
      const aHasDeputy = positionA.includes('заступник');
      const bHasDeputy = positionB.includes('заступник');

      if (aHasDeputy && !bHasDeputy) return -1;
      if (!aHasDeputy && bHasDeputy) return 1;

      // Пріоритет 3: довжина названия посади (довше = вище)
      return positionB.length - positionA.length;
    });
  },
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
