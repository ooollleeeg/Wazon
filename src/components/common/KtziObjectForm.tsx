import GenericForm, { FormConfig } from './GenericForm';

const sharedNestedFields = new Set([
  'categorization',
  'technicalTask',
  'atestation',
]);
const sharedRootFields = [
  'passportNumber',
  'passportDate',
  'kspActNumber',
  'kspActDate',
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
        fields: section.fields.map((field) =>
          mainInfoLocked && ktziMainFields.has(field.name)
            ? {
                ...field,
                readOnly: true,
                helperText: 'Редагується на вкладці «КТЗІ»',
              }
            : field,
        ),
      })),
    nestedFields: config.nestedFields?.filter(
      (field) => !sharedNestedFields.has(field.name),
    ),
  };

  return (
    <GenericForm
      config={objectFormConfig}
      initialData={initialData ? removeSharedDocuments(initialData) : undefined}
      onSubmit={(data) => onSubmit(removeSharedDocuments(data))}
      {...props}
    />
  );
}
