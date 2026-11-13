import GenericForm, { FormConfig } from './GenericForm';

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
]);

const categoryIvHiddenNestedFields = new Set([
  'instrumentalControl',
  'specialCheck',
  'specialResearch',
  'governmentalCommunicationMeans',
]);
const categoryIvCondition = { field: 'informationCategory', values: ['IV'] };

const removeSharedDocuments = (data: Record<string, any>) => {
  const result = { ...data };
  sharedRootFields.forEach((field) => delete result[field]);
  sharedNestedFields.forEach((field) => delete result[field]);
  return result;
};

interface KtziObjectFormProps {
  config: FormConfig;
  initialData?: Record<string, any>;
  onSubmit: (data: any) => void;
  [key: string]: any;
}

export default function KtziObjectForm({
  config,
  initialData,
  onSubmit,
  ...props
}: KtziObjectFormProps) {
  // Основна інформація об'єкта з КТЗІ редагується на вкладці «КТЗІ»
  const mainInfoLocked =
    Boolean(initialData?.ktziId) &&
    ['II', 'III'].includes(initialData?.informationCategory);
  const objectFormConfig: FormConfig = {
    ...config,
    sections: config.sections
      .filter(
        (section) =>
          !section.title.toLocaleLowerCase('uk-UA').includes('паспорт на'),
      )
      .map((section) => ({
        ...section,
        fields: section.fields.map((field) => ({
          ...field,
          ...(mainInfoLocked && ktziMainFields.has(field.name)
            ? {
                readOnly: true,
                helperText: 'Редагується на вкладці «КТЗІ»',
              }
            : {}),
          ...(!initialData && field.name === 'objectType'
            ? { hiddenWhen: categoryIvCondition }
            : {}),
        })),
      })),
    nestedFields: config.nestedFields
      ?.filter((field) => !sharedNestedFields.has(field.name))
      .map((field) =>
        !initialData && categoryIvHiddenNestedFields.has(field.name)
          ? { ...field, hiddenWhen: categoryIvCondition }
          : field,
      ),
  };

  const handleSubmit = (data: Record<string, any>) => {
    const result = removeSharedDocuments(data);
    if (!initialData && result.informationCategory === 'IV') {
      if (config.sections.some((section) =>
        section.fields.some((field) => field.name === 'objectType'),
      )) {
        result.objectType = "об'єкт ЕОТ";
      }
      categoryIvHiddenNestedFields.forEach((field) => delete result[field]);
    }
    onSubmit(result);
  };

  return (
    <GenericForm
      config={objectFormConfig}
      initialData={initialData ? removeSharedDocuments(initialData) : undefined}
      onSubmit={handleSubmit}
      {...props}
    />
  );
}
