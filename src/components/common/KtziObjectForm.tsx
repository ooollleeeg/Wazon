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
  'informationCategory',
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
      .map((section) => ({
        ...section,
        fields: section.fields.map((field) => ({
          ...field,
          ...(field.name === 'informationCategory'
            ? { label: informationCategoryLabel }
            : {}),
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

  const handleSubmit = (data: Record<string, any>) => {
    const keepCategorization =
      preserveCategorizationForCategoryIv &&
      (data.informationCategory === 'IV' ||
        initialData?.informationCategory === 'IV');
    const result = removeSharedDocuments(data, keepCategorization);
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
      {...props}
    />
  );
}
