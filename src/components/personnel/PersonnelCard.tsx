import { useState } from 'react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';
import './styles/PersonnelCard.css';

interface Education {
  id?: number;
  institution: string;
  yearCompleted: number;
  specialties: string;
}

interface Certificate {
  id?: number;
  certificateNumber: string;
  trainingName: string;
  location: string;
  year: number;
}

interface PersonnelCardProps {
  id: number;
  position: string;
  officialRank?: string;
  actualRank?: string;
  fullName: string;
  dateOfBirth?: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  education?: Education[];
  certificates?: Certificate[];
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function PersonnelCard({
  id: _id,
  position,
  officialRank = '',
  actualRank = '',
  fullName,
  dateOfBirth = '',
  email,
  phone = '',
  mobilePhone = '',
  education = [],
  certificates = [],
  onEdit,
  onDelete,
  onClose,
  showCloseButton = true,
}: PersonnelCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  return (
    <>
      <div className='personnel-card'>
        <div className='card-header'>
          <div className='card-title'>
            <h3>{fullName}</h3>
            <p className='position'>{position}</p>
          </div>
          <div className='card-actions'>
            <button
              className='btn-icon btn-edit'
              onClick={onEdit}
              title='Редагувати'
            >
              ✎
            </button>
            {/* ПОКАЗУЄМО КНОПКУ ТІЛЬКИ ЯКЩО showCloseButton = true */}
            {showCloseButton && onClose && (
              <button
                className='btn-close'
                onClick={onClose}
                title='Закрити картку'
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className='card-content'>
          {/* ОСНОВНА ІНФОРМАЦІЯ */}
          <section className='card-section'>
            <h4 className='section-title'>Основна інформація</h4>
            <div className='info-grid'>
              <div className='info-item'>
                <span className='label'>Посада:</span>
                <span className='value'>{position}</span>
              </div>
              {officialRank && (
                <div className='info-item'>
                  <span className='label'>Звання за посадою:</span>
                  <span className='value'>{officialRank}</span>
                </div>
              )}
              {actualRank && (
                <div className='info-item'>
                  <span className='label'>Фактичне звання:</span>
                  <span className='value'>{actualRank}</span>
                </div>
              )}
              {dateOfBirth && (
                <div className='info-item'>
                  <span className='label'>Дата народження:</span>
                  <span className='value'>
                    {new Date(dateOfBirth).toLocaleDateString('uk-UA')} (
                    {calculateAge(dateOfBirth)} р.)
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* КОНТАКТИ */}
          <section className='card-section'>
            <h4 className='section-title'>Контакти</h4>
            <div className='info-grid'>
              <div className='info-item full-width'>
                <span className='label'>Email:</span>
                <a href={`mailto:${email}`} className='value link'>
                  {email}
                </a>
              </div>
              {phone && (
                <div className='info-item'>
                  <span className='label'>Службовий телефон:</span>
                  <a href={`tel:${phone}`} className='value link'>
                    {phone}
                  </a>
                </div>
              )}
              {mobilePhone && (
                <div className='info-item'>
                  <span className='label'>Мобільний телефон:</span>
                  <a href={`tel:${mobilePhone}`} className='value link'>
                    {mobilePhone}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* ОСВІТА */}
          {education && education.length > 0 && (
            <section className='card-section education-section'>
              <h4 className='section-title'>📚 Освіта ({education.length})</h4>
              <div className='nested-list'>
                {education.map((edu, index) => (
                  <div key={index} className='nested-item'>
                    <div className='nested-item-header'>
                      <span className='item-number'>{index + 1}.</span>
                      <span className='item-title'>{edu.institution}</span>
                    </div>
                    <div className='nested-item-content'>
                      <p>
                        <strong>Рік закінчення:</strong> {edu.yearCompleted}
                      </p>
                      {edu.specialties && (
                        <p>
                          <strong>Спеціальність:</strong> {edu.specialties}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* СВІДОЦТВА */}
          {certificates && certificates.length > 0 && (
            <section className='card-section certificates-section'>
              <h4 className='section-title'>
                🏆 Сертифікати ({certificates.length})
              </h4>
              <div className='nested-list'>
                {certificates.map((cert, index) => (
                  <div key={index} className='nested-item'>
                    <div className='nested-item-header'>
                      <span className='item-number'>{index + 1}.</span>
                      <span className='item-title'>{cert.trainingName}</span>
                    </div>
                    <div className='nested-item-content'>
                      {cert.certificateNumber && (
                        <p>
                          <strong>Номер:</strong> {cert.certificateNumber}
                        </p>
                      )}
                      {cert.location && (
                        <p>
                          <strong>Місце:</strong> {cert.location}
                        </p>
                      )}
                      <p>
                        <strong>Рік:</strong> {cert.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ДЕЙСТВИЯ */}
        <div className='card-footer'>
          <button className='btn-delete-record' onClick={handleDeleteClick}>
            🗑️ Видалити запис про працівника
          </button>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО УДАЛЕНИЯ */}
      {showDeleteModal && (
        <DeleteConfirmModal
          fullName={`працівника ${fullName}`} // ✅ ПЕРЕДАЄМО ПОВНЕ ІМ'Я
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
