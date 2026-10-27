import { useState } from 'react';
import './styles/ProtectionMeansSaveModal.css';

interface ProtectionMean {
  categoryId?: number;
  category?: string;
  toolType?: string;
  name?: string;
  serialNumber?: string;
  invertarNumber?: string;
}

interface DuplicateLocation {
  source: string;
  objectName?: string;
  objectType?: string;
  subdivisionName?: string;
  premisesNumber?: string | number | null;
}

interface AdditionalObject {
  id: string | number;
  objectType: 'AS' | 'KRT';
  objectName?: string;
  subdivisionName?: string;
  premisesNumber?: string | number;
}

interface SharedProtectionMeanChange {
  protectionMeanId: number;
  mean: ProtectionMean | null;
  previousMean: ProtectionMean;
  targets: AdditionalObject[];
}

interface ProtectionMeansSaveModalProps {
  warnings: Array<{
    mean: ProtectionMean;
    locations: DuplicateLocation[];
  }>;
  means: ProtectionMean[];
  changes: SharedProtectionMeanChange[];
  targets: AdditionalObject[];
  sourceType?: 'AS' | 'KRT';
  sourceObjectId: string | number;
  onShare: (
    assignments: Array<{
      mean: ProtectionMean;
      targets: Array<{ objectType: 'AS' | 'KRT'; objectId: string | number }>;
    }>,
  ) => Promise<void>;
  onApplyChanges: (changes: SharedProtectionMeanChange[]) => Promise<void>;
  onClose: () => void;
}

const sourceNames: Record<string, string> = {
  AS: 'АС',
  SP: 'Службове приміщення',
  KRT: 'КРТ',
  IKS: 'ІКС',
  Inventory: 'Склад',
};

const ProtectionMeansSaveModal = ({
  warnings,
  means,
  changes,
  targets,
  sourceType,
  sourceObjectId,
  onShare,
  onApplyChanges,
  onClose,
}: ProtectionMeansSaveModalProps) => {
  const [selectedTargets, setSelectedTargets] = useState<
    Record<number, string[]>
  >({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedChanges, setSelectedChanges] = useState<number[]>([]);

  const toggleTarget = (meanIndex: number, target: AdditionalObject) => {
    const key = `${target.objectType}:${target.id}`;
    setSelectedTargets((current) => {
      const selected = current[meanIndex] || [];
      return {
        ...current,
        [meanIndex]: selected.includes(key)
          ? selected.filter((item) => item !== key)
          : [...selected, key],
      };
    });
  };

  const handleConfirm = async () => {
    const assignments = means
      .map((mean, index) => ({
        mean,
        targets: targets
          .filter((target) =>
            (selectedTargets[index] || []).includes(
              `${target.objectType}:${target.id}`,
            ),
          )
          .map((target) => ({
            objectType: target.objectType,
            objectId: target.id,
          })),
      }))
      .filter((assignment) => assignment.targets.length > 0);

    const changesToApply = changes.filter((_, index) =>
      selectedChanges.includes(index),
    );

    if (!assignments.length && !changesToApply.length) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (assignments.length) await onShare(assignments);
      if (changesToApply.length) await onApplyChanges(changesToApply);
      onClose();
    } catch (shareError) {
      setError(
        shareError instanceof Error
          ? shareError.message
          : 'Не вдалося створити спільні призначення',
      );
    } finally {
      setSaving(false);
    }
  };

  const getLocationLabel = (location: DuplicateLocation) => {
    if (location.source === 'Inventory') return 'перебуває на складі';
    const objectType =
      sourceNames[location.objectType || location.source] ||
      location.objectType ||
      location.source;
    const context = [
      location.subdivisionName,
      location.premisesNumber ? `каб. ${location.premisesNumber}` : '',
      location.objectName,
    ]
      .filter(Boolean)
      .join(' — ');
    return `встановлений: ${objectType}${context ? `, ${context}` : ''}`;
  };

  const getTargetLabel = (target: AdditionalObject) =>
    [
      target.subdivisionName,
      target.premisesNumber ? `каб. ${target.premisesNumber}` : '',
      target.objectName || target.objectType,
    ]
      .filter(Boolean)
      .join(' — ');

  const hasShareOptions =
    sourceType &&
    String(sourceObjectId) &&
    means.length > 0 &&
    targets.length > 0;
  const hasChangeOptions = changes.length > 0;
  const hasActions = hasShareOptions || hasChangeOptions;

  return (
    <div className='modal-overlay'>
      <div
        className='modal-content protection-means-save-modal'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>Результат збереження засобів ТЗІ</h2>
        </div>
        <div className='modal-body'>
          {warnings.length > 0 && (
            <section>
              <h3>Не додано через наявний дублікат</h3>
              {warnings.map((warning, index) => (
                <div className='protection-mean-warning' key={index}>
                  <strong>
                    {warning.mean.toolType || warning.mean.category || 'Засіб ТЗІ'}
                    {' — '}
                    {warning.mean.name || 'без назви'}
                    {warning.mean.serialNumber
                      ? ` (S/N: ${warning.mean.serialNumber})`
                      : ''}
                  </strong>
                  <ul>
                    {warning.locations.map((location, locationIndex) => (
                      <li key={`${location.source}-${locationIndex}`}>
                        {getLocationLabel(location)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {hasShareOptions && (
            <section>
              <h3>Інші АС/КРТ у цьому КТЗІ</h3>
              <p>
                Оберіть об’єкти, до карток яких також прив’язати збережені
                засоби ТЗІ. Якщо нічого не обирати, засоби залишаться лише в
                поточній картці.
              </p>
              {means.map((mean, meanIndex) => (
                <fieldset
                  className='protection-mean-share-group'
                  key={`${mean.categoryId}-${mean.serialNumber}-${meanIndex}`}
                >
                  <legend>
                    {mean.toolType || mean.category || 'Засіб ТЗІ'} —{' '}
                    {mean.name || 'без назви'}
                    {mean.serialNumber ? ` (S/N: ${mean.serialNumber})` : ''}
                  </legend>
                  {targets.map((target) => (
                    <label
                      className='protection-mean-share-target'
                      key={`${meanIndex}-${target.objectType}:${target.id}`}
                    >
                      <input
                        type='checkbox'
                        checked={(selectedTargets[meanIndex] || []).includes(
                          `${target.objectType}:${target.id}`,
                        )}
                        onChange={() => toggleTarget(meanIndex, target)}
                      />
                      <span>
                        {sourceNames[target.objectType]} —{' '}
                        {getTargetLabel(target)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </section>
          )}
          {hasChangeOptions && (
            <section>
              <h3>Зміни спільних засобів ТЗІ</h3>
              <p>
                За потреби застосуйте зміни або видалення до всіх карток, де
                цей засіб був призначений раніше.
              </p>
              {changes.map((change, index) => {
                const mean = change.mean || change.previousMean;
                const targetLabels = change.targets.map((target) => (
                  <li key={`${target.objectType}:${target.id}`}>
                    {sourceNames[target.objectType]} — {getTargetLabel(target)}
                  </li>
                ));
                return (
                  <fieldset
                    className='protection-mean-share-group'
                    key={change.protectionMeanId}
                  >
                    <legend>
                      {mean.toolType || mean.category || 'Засіб ТЗІ'} —{' '}
                      {mean.name || 'без назви'}
                      {mean.serialNumber ? ` (S/N: ${mean.serialNumber})` : ''}
                    </legend>
                    <ul>{targetLabels}</ul>
                    <label className='protection-mean-share-target'>
                      <input
                        type='checkbox'
                        checked={selectedChanges.includes(index)}
                        onChange={() =>
                          setSelectedChanges((current) =>
                            current.includes(index)
                              ? current.filter((item) => item !== index)
                              : [...current, index],
                          )
                        }
                      />
                      <span>
                        {change.mean
                          ? 'Застосувати зміни до перелічених карток'
                          : 'Видалити засіб із перелічених карток'}
                      </span>
                    </label>
                  </fieldset>
                );
              })}
            </section>
          )}
          {error && <p className='protection-mean-save-error'>{error}</p>}
        </div>
        <div className='modal-actions'>
          {hasActions ? (
            <button
              className='btn-primary'
              onClick={handleConfirm}
              disabled={saving}
            >
              {saving ? 'Збереження...' : 'Підтвердити'}
            </button>
          ) : (
            <button className='btn-primary' onClick={onClose}>
              Зрозуміло
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProtectionMeansSaveModal;
