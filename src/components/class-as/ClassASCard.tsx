import { useState } from 'react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import './styles/ClassASCard.css';

interface ClassASCardProps {
  id: number;
  address: string;
  subdivisionName: string;
  subdivisionType: string;
  serviceName: string;
  systemClass: string;
  systemName: string;
  categorizationActDate?: string;
  categorizationActNumber?: string;
  kzzName?: string;
  kzzSerial?: string;
  antivirus?: string;
  antivirusOpinionNumber?: string;
  ttCreateDate?: string;
  ttCreateNumber?: string;
  formulaDate?: string;
  formulaNumber?: string;
  passportDate?: string;
  passportNumber?: string;
  protocolDate?: string;
  protocolNumber?: string;
  protocolValidUntil?: string;
  kspActDate?: string;
  kspActNumber?: string;
  attestationRegDate?: string;
  attestationRegNumber?: string;
  attestationDsszziDate?: string;
  attestationDsszziNumber?: string;
  attestationValidUntil?: string;
  showCloseButton?: boolean;
  documents?: any[];
  protectionMeans?: any[];
  software?: any[];
  specialResearch?: any[];
  orders?: any[];
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
}

export default function ClassASCard({
  id: _id,
  address,
  subdivisionName,
  subdivisionType,
  serviceName,
  systemClass,
  systemName,
  categorizationActDate = '',
  categorizationActNumber = '',
  kzzName = '',
  kzzSerial = '',
  antivirus = '',
  antivirusOpinionNumber = '',
  ttCreateDate = '',
  ttCreateNumber = '',
  formulaDate = '',
  formulaNumber = '',
  passportDate = '',
  passportNumber = '',
  protocolDate = '',
  protocolNumber = '',
  protocolValidUntil = '',
  kspActDate = '',
  kspActNumber = '',
  attestationRegDate = '',
  attestationRegNumber = '',
  attestationDsszziDate = '',
  attestationDsszziNumber = '',
  attestationValidUntil = '',
  documents = [],
  protectionMeans = [],
  software = [],
  specialResearch = [],
  orders = [],
  onEdit,
  onDelete,
  onClose,
  showCloseButton = true,
}: ClassASCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expandedProtectionMeans, setExpandedProtectionMeans] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  // const formatDocument = (doc: any) => {
  //   if (!doc) return '';
  //   return [
  //     doc.date && new Date(doc.date).toLocaleDateString('uk-UA'),
  //     doc.number,
  //   ]
  //     .filter(Boolean)
  //     .join(' - ');
  // };

  const renderDocumentPair = (
    label: string,
    date?: string,
    number?: string,
  ) => {
    if (!date && !number) return null;
    return (
      <div className='info-item'>
        <span className='label'>{label}:</span>
        <span className='value'>
          {[date && new Date(date).toLocaleDateString('uk-UA'), number]
            .filter(Boolean)
            .join(' / ')}
        </span>
      </div>
    );
  };

  return (
    <>
      <div className='class-as-card'>
        <div className='card-header'>
          <div className='card-title'>
            <h3>{subdivisionName}</h3>
            <p className='system-info'>
              {systemClass} • {systemName}
            </p>
          </div>
          <div className='card-actions'>
            <button
              className='btn-icon btn-edit'
              onClick={onEdit}
              title='Редагувати'
            >
              ✎
            </button>
            {/* ✅ ПОКАЗУЄМО КНОПКУ ТІЛЬКИ ЯКЩО showCloseButton = true */}
            {showCloseButton && onClose && (
              <button
                className='btn-close'
                onClick={onClose}
                title='Закрити картку'
              >
                ✕
              </button>
            )}

            {/* <button
              className='btn-icon btn-close'
              onClick={onClose}
              title='Закрити'
            >
              ✕
            </button> */}
          </div>
        </div>

        <div className='card-content'>
          {/* ОСНОВНА ІНФОРМАЦІЯ */}
          <section className='card-section'>
            <h4 className='section-title'>Основна інформація</h4>
            <div className='info-grid'>
              <div className='info-item full-width'>
                <span className='label'>Адреса:</span>
                <span className='value'>{address}</span>
              </div>
              <div className='info-item'>
                <span className='label'>Назва підрозділу:</span>
                <span className='value'>{subdivisionName}</span>
              </div>
              <div className='info-item'>
                <span className='label'>Тип:</span>
                <span className='value'>{subdivisionType}</span>
              </div>
              {serviceName && (
                <div className='info-item'>
                  <span className='label'>Служба:</span>
                  <span className='value'>{serviceName}</span>
                </div>
              )}
              <div className='info-item'>
                <span className='label'>Клас АС:</span>
                <span className='value badge'>{systemClass}</span>
              </div>
              <div className='info-item full-width'>
                <span className='label'>Назва АС:</span>
                <span className='value'>{systemName}</span>
              </div>
            </div>
          </section>

          {/* ДОКУМЕНТИ КАТЕГОРІЮВАННЯ */}
          <section className='card-section'>
            <h4 className='section-title'>Акти та протоколи</h4>
            <div className='info-grid'>
              {renderDocumentPair(
                'Акт категоріювання',
                categorizationActDate,
                categorizationActNumber,
              )}
              {renderDocumentPair('Протокол ІК', protocolDate, protocolNumber)}
              {protocolValidUntil && (
                <div className='info-item'>
                  <span className='label'>Протокол дійсний до:</span>
                  <span className='value'>
                    {new Date(protocolValidUntil).toLocaleDateString('uk-UA')}
                  </span>
                </div>
              )}
              {renderDocumentPair('Акт КСП', kspActDate, kspActNumber)}
              {renderDocumentPair(
                'Технічне завдання',
                ttCreateDate,
                ttCreateNumber,
              )}
              {renderDocumentPair('Формуляр на АС', formulaDate, formulaNumber)}
              {renderDocumentPair('Паспорт КТЗІ', passportDate, passportNumber)}
            </div>
          </section>

          {/* АТЕСТАЦІЯ */}
          {(attestationRegDate ||
            attestationRegNumber ||
            attestationDsszziDate ||
            attestationDsszziNumber ||
            attestationValidUntil) && (
            <section className='card-section'>
              <h4 className='section-title'>Акт атестації</h4>
              <div className='info-grid'>
                {renderDocumentPair(
                  'Реєстрація',
                  attestationRegDate,
                  attestationRegNumber,
                )}
                {renderDocumentPair(
                  'Реєстрація ДССЗЗІ',
                  attestationDsszziDate,
                  attestationDsszziNumber,
                )}
                {attestationValidUntil && (
                  <div className='info-item'>
                    <span className='label'>Дійсний до:</span>
                    <span className='value'>
                      {new Date(attestationValidUntil).toLocaleDateString(
                        'uk-UA',
                      )}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* КЗЗ І АНТИВІРУСА */}
          <section className='card-section'>
            <h4 className='section-title'>Засоби захисту (встановлені)</h4>
            <div className='info-grid'>
              {kzzName && (
                <>
                  <div className='info-item'>
                    <span className='label'>КЗЗ НСД:</span>
                    <span className='value'>{kzzName}</span>
                  </div>
                  {kzzSerial && (
                    <div className='info-item'>
                      <span className='label'>Серійний номер:</span>
                      <span className='value'>{kzzSerial}</span>
                    </div>
                  )}
                </>
              )}
              {antivirus && (
                <>
                  <div className='info-item full-width'>
                    <span className='label'>Антивіруса:</span>
                    <span className='value'>{antivirus}</span>
                  </div>
                  {antivirusOpinionNumber && (
                    <div className='info-item'>
                      <span className='label'>Експертний висновок:</span>
                      <span className='value'>{antivirusOpinionNumber}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* ПРОТОКОЛ СПЕЦІАЛЬНИХ ДОСЛІДЖЕНЬ */}
          {specialResearch && specialResearch.length > 0 && (
            <section className='card-section'>
              <h4 className='section-title'>
                📋 Протокол спеціальних досліджень ({specialResearch.length})
              </h4>
              <div className='nested-list'>
                {specialResearch.map((research, index) => (
                  <div key={index} className='nested-item'>
                    <div className='nested-item-header'>
                      <span className='item-number'>{index + 1}.</span>
                      <span className='item-title'>
                        {research.registrationNumber || `Протокол ${index + 1}`}
                      </span>
                    </div>
                    <div className='nested-item-content'>
                      {research.registrationDate && (
                        <p>
                          <strong>Дата реєстрації:</strong>{' '}
                          {new Date(
                            research.registrationDate,
                          ).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                      {research.performer && (
                        <p>
                          <strong>Виконавець:</strong> {research.performer}
                        </p>
                      )}
                      {research.eventDate && (
                        <p>
                          <strong>Дата проведення заходу:</strong>{' '}
                          {new Date(research.eventDate).toLocaleDateString(
                            'uk-UA',
                          )}
                        </p>
                      )}
                      {research.permissionDetails && (
                        <p>
                          <strong>Реквізити Дозволу (ліцензії):</strong>{' '}
                          {research.permissionDetails}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ДХОВЕДЕМЕ ДССЗЗІ */}
          {documents && documents.length > 0 && (
            <section className='card-section'>
              <h4 className='section-title'>
                📄 Документи ДССЗЗІ ({documents.length})
              </h4>
              <div className='nested-list'>
                {documents.map((doc, index) => (
                  <div key={index} className='nested-item'>
                    <div className='nested-item-header'>
                      <span className='item-number'>{index + 1}.</span>
                      <span className='item-title'>{doc.docType}</span>
                    </div>
                    <div className='nested-item-content'>
                      {doc.date && (
                        <p>
                          <strong>Дата:</strong>{' '}
                          {new Date(doc.date).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                      {doc.number && (
                        <p>
                          <strong>Номер:</strong> {doc.number}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ЗАСОБИ ЗАХИСТУ */}
          {protectionMeans && protectionMeans.length > 0 && (
            <section className='card-section'>
              <h4 className='section-title'>
                🛡️ Застосовані засоби технічного захисту інформації (
                {protectionMeans.length})
              </h4>
              <div className='nested-list'>
                {(protectionMeans.length <= 2 || expandedProtectionMeans
                  ? protectionMeans
                  : []
                ).map((mean, index) => (
                  <div key={index} className='nested-item'>
                    <div className='nested-item-header'>
                      <span className='item-number'>{index + 1}.</span>
                      <span className='item-title'>{mean.name}</span>
                    </div>
                    <div className='nested-item-content'>
                      {mean.serialNumber && (
                        <p>
                          <strong>Серійний номер:</strong> {mean.serialNumber}
                        </p>
                      )}
                      {mean.releaseYear && (
                        <p>
                          <strong>Рік випуску:</strong> {mean.releaseYear}
                        </p>
                      )}
                      {mean.certificateInfo && (
                        <p>
                          <strong>Сертифікат:</strong> {mean.certificateInfo}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {protectionMeans.length > 2 && (
                <button
                  className='btn-toggle-previous'
                  onClick={() =>
                    setExpandedProtectionMeans(!expandedProtectionMeans)
                  }
                >
                  {expandedProtectionMeans
                    ? '← Згорнути'
                    : `↓ Переглянути (${protectionMeans.length})`}
                </button>
              )}
            </section>
          )}

          {/* ПРОГРАМНЕ ЗАБЕЗПЕЧЕННЯ */}
          {software && software.length > 0 && (
            <section className='card-section'>
              <h4 className='section-title'>
                💾 Програмне забезпечення ({software.length})
              </h4>
              <div className='nested-list'>
                {software.map((sw, index) => (
                  <div key={index} className='nested-item'>
                    <div className='nested-item-header'>
                      <span className='item-number'>{index + 1}.</span>
                      <span className='item-title'>{sw.name}</span>
                    </div>
                    {sw.version && (
                      <div className='nested-item-content'>
                        <p>
                          <strong>Версія:</strong> {sw.version}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* НАКАЗИ */}
          {orders && orders.length > 0 && (
            <section className='card-section'>
              <h4 className='section-title'>📋 Накази ({orders.length})</h4>
              <div className='nested-list'>
                {orders.map((order, index) => (
                  <div key={index} className='nested-item'>
                    <div className='nested-item-header'>
                      <span className='item-number'>{index + 1}.</span>
                      <span className='item-title'>{order.orderType}</span>
                    </div>
                    <div className='nested-item-content'>
                      {order.number && (
                        <p>
                          <strong>Номер:</strong> {order.number}
                        </p>
                      )}
                      {order.date && (
                        <p>
                          <strong>Дата:</strong>{' '}
                          {new Date(order.date).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                      {order.publisher && (
                        <p>
                          <strong>Видавник:</strong> {order.publisher}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* FOOTER */}
        <div className='card-footer'>
          <button className='btn-delete-record' onClick={handleDeleteClick}>
            🗑️ Видалити запис про АС
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showDeleteModal && (
        <DeleteConfirmModal
          fullName={`${systemClass} - ${systemName}`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
