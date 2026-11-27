import { useEffect, useState } from 'react';
import GenericForm, { FormConfig } from './GenericForm';

const normalizeKtziPart = (value: unknown) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('uk-UA');

const buildKtziKey = (data: Record<string, any>) =>
  [data.address, data.premisesNumber, data.subdivisionName]
    .map(normalizeKtziPart)
    .join('|');

const sharedNestedFields = new Set([
  'categorization',
  'technicalTask',
  'atestation',
  'specialCheck',
]);
const sharedRootFields = [
  'passportNumber',
  'passportDate',
  'kspActNumber',
  'kspActDate',
  'checkNumber',
  'checkDate',
  'checkPerformer',
  'checkEventDate',
  'checkPermissionPerformer',
  'categorizationActDate',
  'categorizationActNumber',
  'attestationRegDate',
  'attestationRegNumber',
  'ktziDocuments',
];

const ktziMainFields = new Set([
  'address',
  'premisesNumber',
  'subdivisionName',
  'subdivisionType',
  'serviceName',
  'informationCategory',
  'objectType',
]);

const categoryIvHiddenNestedFields = new Set([
  'instrumentalControl',
  'specialCheck',
  'specialResearch',
  'governmentalCommunicationMeans',
]);
const categoryIvCondition = { field: 'informationCategory', values: ['IV'] };

const removeSharedDocuments = (
  data: Record<string, any>,
  keepCategorization = false,
) => {
  const result = { ...data };
  sharedRootFields.forEach((field) => {
    if (
      !keepCategorization ||
      !['categorizationActDate', 'categorizationActNumber'].includes(field)
    ) {
      delete result[field];
    }
  });
  sharedNestedFields.forEach((field) => {
    if (field !== 'categorization' || !keepCategorization) {
      delete result[field];
    }
  });
  return result;
};

interface KtziObjectFormProps {
  config: FormConfig;
  initialData?: Record<string, any>;
  onSubmit: (data: any) => void;
  preserveCategorizationForCategoryIv?: boolean;
  [key: string]: any;
}

export default function KtziObjectForm({
  config,
  initialData,
  onSubmit,
  preserveCategorizationForCategoryIv = false,
  ...props
}: KtziObjectFormProps) {
  // Основна інформація об'єкта з КТЗІ редагується на вкладці «КТЗІ»
  const mainInfoLocked =
    Boolean(initialData?.ktziId) &&
    ['II', 'III'].includes(initialData?.informationCategory);
  const informationCategoryLabel =
    !initialData || initialData.informationCategory === 'IV'
      ? 'Вищий гриф ІзОД'
      : 'Вищий гриф ІзОД, яка обробляється в КТЗІ';
  const objectFormConfig: FormConfig = {
    ...config,
    sections: config.sections
      .filter(
        (section) =>
          !section.title.toLocaleLowerCase('uk-UA').includes('паспорт на'),
      )
      .map((section, sectionIndex) => ({
        ...section,
        fields: [...section.fields]
          // У формі створення вищий гриф ІзОД заповнюється першим
          .sort((a, b) =>
            initialData || sectionIndex !== 0
              ? 0
              : Number(b.name === 'informationCategory') -
                Number(a.name === 'informationCategory'),
          )
          .map((field) => ({
          ...field,
          ...(field.name === 'informationCategory'
            ? { label: informationCategoryLabel, required: true }
            : {}),
          ...(mainInfoLocked && ktziMainFields.has(field.name)
            ? {
                readOnly: true,
                helperText: 'Редагується на вкладці «КТЗІ»',
              }
            : {}),
          ...(field.name === 'objectType'
            ? { hiddenWhen: categoryIvCondition }
            : {}),
        })),
      })),
    nestedFields: config.nestedFields
      ?.filter(
        (field) =>
          !sharedNestedFields.has(field.name) ||
          (preserveCategorizationForCategoryIv &&
            field.name === 'categorization'),
      )
      .map((field) => {
        if (
          preserveCategorizationForCategoryIv &&
          field.name === 'categorization'
        ) {
          return {
            ...field,
            hiddenWhen: {
              field: 'informationCategory',
              values: ['', 'I', 'II', 'III'],
            },
          };
        }
        return !initialData && categoryIvHiddenNestedFields.has(field.name)
          ? { ...field, hiddenWhen: categoryIvCondition }
          : field;
      }),
  };

  const [existingKtzi, setExistingKtzi] = useState<any[]>([]);
  useEffect(() => {
    if (initialData) return;
    let cancelled = false;
    fetch('/api/ktzi')
      .then((response) => (response.ok ? response.json() : []))
      .then((list) => {
        if (!cancelled && Array.isArray(list)) setExistingKtzi(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialData]);

  const formFieldNames = new Set(
    config.sections.flatMap((section) => section.fields.map((f) => f.name)),
  );

  // Для нового об'єкта в приміщенні з уже існуючим КТЗІ спільні поля успадковуються від КТЗІ
  const deriveLinkedFields = (data: Record<string, any>) => {
    if (initialData || !existingKtzi.length) return null;
    if (!['I', 'II', 'III'].includes(data.informationCategory)) return null;
    const key = buildKtziKey(data);
    if (!key.replace(/\|/g, '')) return null;
    const ktzi = existingKtzi.find((item) => buildKtziKey(item) === key);
    if (!ktzi) return null;

    const patch: Record<string, any> = {};
    ['subdivisionType', 'serviceName', 'objectType']
      .filter((name) => formFieldNames.has(name) && ktzi[name])
      .forEach((name) => {
        patch[name] = ktzi[name];
      });
    const lockedFields = Object.keys(patch);
    const categoryWarning =
      ktzi.informationCategory &&
      ktzi.informationCategory !== data.informationCategory
        ? ` Для цього КТЗІ вказано вищий гриф ${ktzi.informationCategory}; він залишиться без змін, змінити його можна в картці КТЗІ.`
        : '';

    return {
      patch,
      lockedFields,
      notice: `Цей об'єкт належатиме до вже існуючого КТЗІ (${[
        ktzi.subdivisionName,
        ktzi.premisesNumber ? `каб. ${ktzi.premisesNumber}` : '',
        ktzi.address,
      ]
        .filter(Boolean)
        .join(', ')}). Позначені поля успадковуються від КТЗІ й не редагуються тут.${categoryWarning}`,
    };
  };

  const handleSubmit = (data: Record<string, any>) => {
    const keepCategorization =
      preserveCategorizationForCategoryIv &&
      (data.informationCategory === 'IV' ||
        initialData?.informationCategory === 'IV');
    const result = removeSharedDocuments(data, keepCategorization);
    if (result.informationCategory === 'IV') {
      if (initialData) {
        result.objectType = '';
      } else {
        delete result.objectType;
      }
      categoryIvHiddenNestedFields.forEach((field) => delete result[field]);
    }
    onSubmit(result);
  };

  return (
    <GenericForm
      config={objectFormConfig}
      initialData={
        initialData
          ? removeSharedDocuments(
              initialData,
              preserveCategorizationForCategoryIv &&
                initialData.informationCategory === 'IV',
            )
          : undefined
      }
      onSubmit={handleSubmit}
      deriveLinkedFields={deriveLinkedFields}
      {...props}
    />
  );
}
