import React, { useState } from 'react';
import '../../styles/PersonnelForm.css';

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

interface PersonnelFormData {
  position: string;
  officialRank: string;
  actualRank: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  mobilePhone: string;
  education: Education[];
  certificates: Certificate[];
}

interface PersonnelFormProps {
  onSubmit: (data: PersonnelFormData) => void;
  initialData?: PersonnelFormData;
  isLoading?: boolean;
}

export default function PersonnelForm({
  onSubmit,
  initialData,
  isLoading,
}: PersonnelFormProps) {
  const [formData, setFormData] = useState<PersonnelFormData>(() => {
    console.log('Initializing form with:', initialData);

    if (initialData) {
      return {
        position: initialData.position || '',
        officialRank: initialData.officialRank || '',
        actualRank: initialData.actualRank || '',
        fullName: initialData.fullName || '',
        dateOfBirth: initialData.dateOfBirth || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        mobilePhone: initialData.mobilePhone || '',
        education: initialData.education || [],
        certificates: initialData.certificates || [],
      };
    }

    return {
      position: '',
      officialRank: '',
      actualRank: '',
      fullName: '',
      dateOfBirth: '',
      email: '',
      phone: '',
      mobilePhone: '',
      education: [],
      certificates: [],
    };
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      console.log('Input changed:', name, value);
      return updated;
    });
  };

  // ===== ОСВІТА =====
  const addEducation = () => {
    console.log('Adding education');
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          institution: '',
          yearCompleted: new Date().getFullYear(),
          specialties: '',
        },
      ],
    }));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    console.log('Updating education:', index, field, value);
    setFormData((prev) => {
      const newEducation = [...prev.education];
      newEducation[index] = { ...newEducation[index], [field]: value };
      return { ...prev, education: newEducation };
    });
  };

  const removeEducation = (index: number) => {
    console.log('Removing education:', index);
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // ===== СВІДОЦТВА =====
  const addCertificate = () => {
    console.log('Adding certificate');
    setFormData((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        {
          certificateNumber: '',
          trainingName: '',
          location: '',
          year: new Date().getFullYear(),
        },
      ],
    }));
  };

  const updateCertificate = (index: number, field: string, value: any) => {
    console.log('Updating certificate:', index, field, value);
    setFormData((prev) => {
      const newCerts = [...prev.certificates];
      newCerts[index] = { ...newCerts[index], [field]: value };
      return { ...prev, certificates: newCerts };
    });
  };

  const removeCertificate = (index: number) => {
    console.log('Removing certificate:', index);
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitting with data:', formData);
    onSubmit(formData);
  };

  return (
    <form className='personnel-form' onSubmit={handleSubmit}>
      {/* ОСНОВНА ІНФОРМАЦІЯ */}
      <section className='form-section'>
        <h3>Основна інформація</h3>

        <div className='form-grid'>
          <div className='form-group'>
            <label>Посада *</label>
            <input
              type='text'
              name='position'
              value={formData.position}
              onChange={handleInputChange}
              required
              placeholder='Введіть посаду'
            />
          </div>

          <div className='form-group'>
            <label>Спец. звання за посадою</label>
            <input
              type='text'
              name='officialRank'
              value={formData.officialRank}
              onChange={handleInputChange}
              placeholder='Введіть звання'
            />
          </div>

          <div className='form-group'>
            <label>Спец. звання фактичне</label>
            <input
              type='text'
              name='actualRank'
              value={formData.actualRank}
              onChange={handleInputChange}
              placeholder='Введіть звання'
            />
          </div>

          <div className='form-group full-width'>
            <label>Прізвище, ім'я, по-батькові *</label>
            <input
              type='text'
              name='fullName'
              value={formData.fullName}
              onChange={handleInputChange}
              required
              placeholder='Введіть ПІБ'
            />
          </div>

          <div className='form-group'>
            <label>Дата народження *</label>
            <input
              type='date'
              name='dateOfBirth'
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      </section>

      {/* ОСВІТА */}
      <section className='form-section education-section'>
        <div className='section-header'>
          <h3>📚 ОСВІТА</h3>
          <button type='button' className='btn-add' onClick={addEducation}>
            + Додати навчальний заклад
          </button>
        </div>

        <div className='nested-items'>
          {formData.education &&
            formData.education.map((edu, index) => (
              <div key={index} className='nested-item education-item'>
                <div className='nested-header'>
                  <span className='item-number'>Освіта {index + 1}</span>
                  <button
                    type='button'
                    className='btn-remove'
                    onClick={() => removeEducation(index)}
                    title='Видалити'
                  >
                    ✕
                  </button>
                </div>

                <div className='form-grid'>
                  <div className='form-group full-width'>
                    <label>Навчальний заклад *</label>
                    <input
                      type='text'
                      value={edu.institution || ''}
                      onChange={(e) =>
                        updateEducation(index, 'institution', e.target.value)
                      }
                      required
                      placeholder='НАУ, НТУУ КПІ, тощо'
                    />
                  </div>

                  <div className='form-group'>
                    <label>Рік закінчення *</label>
                    <input
                      type='number'
                      value={edu.yearCompleted || new Date().getFullYear()}
                      onChange={(e) =>
                        updateEducation(
                          index,
                          'yearCompleted',
                          parseInt(e.target.value),
                        )
                      }
                      required
                      min='1950'
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div className='form-group full-width'>
                    <label>Спеціальність і кваліфікація</label>
                    <input
                      type='text'
                      value={edu.specialties || ''}
                      onChange={(e) =>
                        updateEducation(index, 'specialties', e.target.value)
                      }
                      placeholder='Інженер, Магістр, тощо'
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* СВІДОЦТВА */}
      <section className='form-section certificates-section'>
        <div className='section-header'>
          <h3>🏆 Свідоцтва про перепідготовку/підвищення кваліфікації</h3>
          <button type='button' className='btn-add' onClick={addCertificate}>
            + Додати свідоцтво
          </button>
        </div>

        <div className='nested-items'>
          {formData.certificates &&
            formData.certificates.map((cert, index) => (
              <div key={index} className='nested-item certificate-item'>
                <div className='nested-header'>
                  <span className='item-number'>Свідоцтво {index + 1}</span>
                  <button
                    type='button'
                    className='btn-remove'
                    onClick={() => removeCertificate(index)}
                    title='Видалити'
                  >
                    ✕
                  </button>
                </div>

                <div className='form-grid'>
                  <div className='form-group'>
                    <label>Номер свідоцтва</label>
                    <input
                      type='text'
                      value={cert.certificateNumber || ''}
                      onChange={(e) =>
                        updateCertificate(
                          index,
                          'certificateNumber',
                          e.target.value,
                        )
                      }
                      placeholder='№ 12345'
                    />
                  </div>

                  <div className='form-group full-width'>
                    <label>Назва курсу/семінару *</label>
                    <input
                      type='text'
                      value={cert.trainingName || ''}
                      onChange={(e) =>
                        updateCertificate(index, 'trainingName', e.target.value)
                      }
                      required
                      placeholder='Курс ТЗІ, Семінар, тощо'
                    />
                  </div>

                  <div className='form-group'>
                    <label>Місце проведення</label>
                    <input
                      type='text'
                      value={cert.location || ''}
                      onChange={(e) =>
                        updateCertificate(index, 'location', e.target.value)
                      }
                      placeholder='Київ, НТУУ КПІ'
                    />
                  </div>

                  <div className='form-group'>
                    <label>Рік проведення *</label>
                    <input
                      type='number'
                      value={cert.year || new Date().getFullYear()}
                      onChange={(e) =>
                        updateCertificate(
                          index,
                          'year',
                          parseInt(e.target.value),
                        )
                      }
                      required
                      min='1950'
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* КОНТАКТИ */}
      <section className='form-section'>
        <h3>Контактна інформація</h3>

        <div className='form-grid'>
          <div className='form-group full-width'>
            <label>Службовий EMAIL *</label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder='email@example.com'
            />
          </div>

          <div className='form-group'>
            <label>Номер службового телефону</label>
            <input
              type='tel'
              name='phone'
              value={formData.phone}
              onChange={handleInputChange}
              placeholder='+380XX XXX XXXX'
            />
          </div>

          <div className='form-group'>
            <label>Номер мобільного телефону</label>
            <input
              type='tel'
              name='mobilePhone'
              value={formData.mobilePhone}
              onChange={handleInputChange}
              placeholder='+380XX XXX XXXX'
            />
          </div>
        </div>
      </section>

      {/* КНОПКИ */}
      <div className='form-actions'>
        <button type='submit' className='btn-submit' disabled={isLoading}>
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
      </div>
    </form>
  );
}
