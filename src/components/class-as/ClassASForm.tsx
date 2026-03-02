import React, { useState } from 'react';
import './styles/ClassASForm.css';

interface Document {
  id?: number;
  docType: string;
  date: string;
  number: string;
}

interface ProtectionMean {
  id?: number;
  name: string;
  serialNumber: string;
  releaseYear: number;
  certificateInfo: string;
}

interface Software {
  id?: number;
  name: string;
  version: string;
}

interface Order {
  id?: number;
  orderType: string;
  number: string;
  date: string;
  publisher: string;
}

interface ClassASFormData {
  address: string;
  subdivisionName: string;
  subdivisionType: string;
  serviceName: string;
  systemClass: string;
  systemName: string;
  categorizationActDate: string;
  categorizationActNumber: string;
  kzzName: string;
  kzzSerial: string;
  antivirus: string;
  antivirusOpinionNumber: string;
  ttCreateDate: string;
  ttCreateNumber: string;
  formulaDate: string;
  formulaNumber: string;
  passportDate: string;
  passportNumber: string;
  protocolDate: string;
  protocolNumber: string;
  protocolValidUntil: string;
  kspActDate: string;
  kspActNumber: string;
  attestationRegDate: string;
  attestationRegNumber: string;
  attestationDsszziDate: string;
  attestationDsszziNumber: string;
  attestationValidUntil: string;
  documents: Document[];
  protectionMeans: ProtectionMean[];
  software: Software[];
  orders: Order[];
}

interface ClassASFormProps {
  onSubmit: (data: ClassASFormData) => void;
  initialData?: ClassASFormData;
  isLoading?: boolean;
  onClose?: () => void;
}

export default function ClassASForm({
  onSubmit,
  initialData,
  isLoading,
  onClose,
}: ClassASFormProps) {
  const [formData, setFormData] = useState<ClassASFormData>(() => {
    console.log('Initializing form with:', initialData);

    if (initialData) {
      return {
        address: initialData.address || '',
        subdivisionName: initialData.subdivisionName || '',
        subdivisionType: initialData.subdivisionType || '',
        serviceName: initialData.serviceName || '',
        systemClass: initialData.systemClass || 'АС класу 1',
        systemName: initialData.systemName || '',
        categorizationActDate: initialData.categorizationActDate || '',
        categorizationActNumber: initialData.categorizationActNumber || '',
        kzzName: initialData.kzzName || '',
        kzzSerial: initialData.kzzSerial || '',
        antivirus: initialData.antivirus || '',
        antivirusOpinionNumber: initialData.antivirusOpinionNumber || '',
        ttCreateDate: initialData.ttCreateDate || '',
        ttCreateNumber: initialData.ttCreateNumber || '',
        formulaDate: initialData.formulaDate || '',
        formulaNumber: initialData.formulaNumber || '',
        passportDate: initialData.passportDate || '',
        passportNumber: initialData.passportNumber || '',
        protocolDate: initialData.protocolDate || '',
        protocolNumber: initialData.protocolNumber || '',
        protocolValidUntil: initialData.protocolValidUntil || '',
        kspActDate: initialData.kspActDate || '',
        kspActNumber: initialData.kspActNumber || '',
        attestationRegDate: initialData.attestationRegDate || '',
        attestationRegNumber: initialData.attestationRegNumber || '',
        attestationDsszziDate: initialData.attestationDsszziDate || '',
        attestationDsszziNumber: initialData.attestationDsszziNumber || '',
        attestationValidUntil: initialData.attestationValidUntil || '',
        documents: initialData.documents || [],
        protectionMeans: initialData.protectionMeans || [],
        software: initialData.software || [],
        orders: initialData.orders || [],
      };
    }

    return {
      address: '',
      subdivisionName: '',
      subdivisionType: '',
      serviceName: '',
      systemClass: 'АС класу 1',
      systemName: '',
      categorizationActDate: '',
      categorizationActNumber: '',
      kzzName: '',
      kzzSerial: '',
      antivirus: '',
      antivirusOpinionNumber: '',
      ttCreateDate: '',
      ttCreateNumber: '',
      formulaDate: '',
      formulaNumber: '',
      passportDate: '',
      passportNumber: '',
      protocolDate: '',
      protocolNumber: '',
      protocolValidUntil: '',
      kspActDate: '',
      kspActNumber: '',
      attestationRegDate: '',
      attestationRegNumber: '',
      attestationDsszziDate: '',
      attestationDsszziNumber: '',
      attestationValidUntil: '',
      documents: [],
      protectionMeans: [],
      software: [],
      orders: [],
    };
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ===== ДОКУМЕНТИ ДССЗЗІ =====
  const addDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        { docType: 'Атестат відповідності', date: '', number: '' },
      ],
    }));
  };

  const updateDocument = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newDocs = [...prev.documents];
      newDocs[index] = { ...newDocs[index], [field]: value };
      return { ...prev, documents: newDocs };
    });
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  // ===== ЗАСОБИ ЗАХИСТУ =====
  const addProtectionMean = () => {
    setFormData((prev) => ({
      ...prev,
      protectionMeans: [
        ...prev.protectionMeans,
        {
          name: '',
          serialNumber: '',
          releaseYear: new Date().getFullYear(),
          certificateInfo: '',
        },
      ],
    }));
  };

  const updateProtectionMean = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newMeans = [...prev.protectionMeans];
      newMeans[index] = { ...newMeans[index], [field]: value };
      return { ...prev, protectionMeans: newMeans };
    });
  };

  const removeProtectionMean = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      protectionMeans: prev.protectionMeans.filter((_, i) => i !== index),
    }));
  };

  // ===== ПРОГРАМНЕ ЗАБЕЗПЕЧЕННЯ =====
  const addSoftware = () => {
    setFormData((prev) => ({
      ...prev,
      software: [...prev.software, { name: '', version: '' }],
    }));
  };

  const updateSoftware = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newSw = [...prev.software];
      newSw[index] = { ...newSw[index], [field]: value };
      return { ...prev, software: newSw };
    });
  };

  const removeSoftware = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      software: prev.software.filter((_, i) => i !== index),
    }));
  };

  // ===== НАКАЗИ =====
  const addOrder = () => {
    setFormData((prev) => ({
      ...prev,
      orders: [
        ...prev.orders,
        {
          orderType: 'Введення в експлуатацію',
          number: '',
          date: '',
          publisher: 'ГУНП',
        },
      ],
    }));
  };

  const updateOrder = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newOrders = [...prev.orders];
      newOrders[index] = { ...newOrders[index], [field]: value };
      return { ...prev, orders: newOrders };
    });
  };

  const removeOrder = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      orders: prev.orders.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formDataToSubmit = { ...formData };

      // ❌ ВИДАЛІТЬ id з основних даних при новому запису
      if (!initialData?.id) {
        delete formDataToSubmit.id;
      }

      console.log('📝 Form data to submit:', formDataToSubmit);

      onSubmit(formDataToSubmit);
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setSubmitError(`Помилка: ${(error as Error).message}`);
    }
  };

  return (
    <form className='class-as-form' onSubmit={handleSubmit}>
      {/* FORM HEADER */}
      <div className='form-header'>
        <h2 className='form-title'>
          {initialData ? '✎ Редагування АС' : '+ Нова АС'}
        </h2>
        <button
          type='button'
          className='form-close-btn'
          onClick={onClose}
          title='Закрити форму'
          aria-label='Закрити'
        >
          ✕
        </button>
      </div>

      {/* ОСНОВНА ІНФОРМАЦІЯ */}
      <section className='form-section'>
        <h3>Основна інформація</h3>

        <div className='form-grid'>
          <div className='form-group full-width'>
            <label>Адреса (індекс, місто, вулиця, будинок) *</label>
            <input
              type='text'
              name='address'
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder='01001, м. Київ, вул. Хрещатик, буд. 26'
            />
          </div>

          <div className='form-group full-width'>
            <label>Назва підрозділу / номер приміщення *</label>
            <input
              type='text'
              name='subdivisionName'
              value={formData.subdivisionName}
              onChange={handleInputChange}
              required
              placeholder='СКП, каб. 101'
            />
          </div>

          <div className='form-group'>
            <label>Належність підрозділу *</label>
            <select
              name='subdivisionType'
              value={formData.subdivisionType}
              onChange={handleInputChange}
              required
            >
              <option value=''>Виберіть тип</option>
              <option value='Територіальний підрозділ'>
                Територіальний підрозділ
              </option>
              <option value='Підрозділ апарату'>Підрозділ апарату</option>
            </select>
          </div>

          <div className='form-group'>
            <label>Назва служби</label>
            <input
              type='text'
              name='serviceName'
              value={formData.serviceName}
              onChange={handleInputChange}
              placeholder='СКП'
            />
          </div>

          <div className='form-group'>
            <label>Клас АС *</label>
            <select
              name='systemClass'
              value={formData.systemClass}
              onChange={handleInputChange}
              required
            >
              <option value='АС класу 1'>АС класу 1</option>
              <option value='АС класу 2'>АС класу 2</option>
              <option value='АС класу 3'>АС класу 3</option>
            </select>
          </div>

          <div className='form-group full-width'>
            <label>Назва АС *</label>
            <input
              type='text'
              name='systemName'
              value={formData.systemName}
              onChange={handleInputChange}
              required
              placeholder='Умовна назва АС'
            />
          </div>
        </div>
      </section>

      {/* АКТ КАТЕГОРІЮВАННЯ */}
      <section className='form-section'>
        <h3>Акт категоріювання приміщення</h3>
        <div className='form-grid two-column'>
          <div className='form-group'>
            <label>Дата</label>
            <input
              type='date'
              name='categorizationActDate'
              value={formData.categorizationActDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер</label>
            <input
              type='text'
              name='categorizationActNumber'
              value={formData.categorizationActNumber}
              onChange={handleInputChange}
              placeholder='№ акту'
            />
          </div>
        </div>
      </section>

      {/* КЗЗ НСД */}
      <section className='form-section'>
        <h3>Встановлений КЗЗ від НСД</h3>
        <div className='form-grid two-column'>
          <div className='form-group'>
            <label>Назва</label>
            <input
              type='text'
              name='kzzName'
              value={formData.kzzName}
              onChange={handleInputChange}
              placeholder='Назва КЗЗ від НСД'
            />
          </div>
          <div className='form-group'>
            <label>Серійний номер</label>
            <input
              type='text'
              name='kzzSerial'
              value={formData.kzzSerial}
              onChange={handleInputChange}
              placeholder='Серійний номер'
            />
          </div>
        </div>
      </section>

      {/* АНТИВІРУСА */}
      <section className='form-section'>
        <h3>Встановлений засіб антивірусного захисту</h3>
        <div className='form-grid two-column'>
          <div className='form-group'>
            <label>Назва</label>
            <input
              type='text'
              name='antivirus'
              value={formData.antivirus}
              onChange={handleInputChange}
              placeholder='Назва антивірусного програмного продукту'
            />
          </div>
          <div className='form-group'>
            <label>Номер експертного висновку</label>
            <input
              type='text'
              name='antivirusOpinionNumber'
              value={formData.antivirusOpinionNumber}
              onChange={handleInputChange}
              placeholder='№ висновку'
            />
          </div>
        </div>
      </section>

      {/* ТЕХНІЧНЕ ЗАВДАННЯ */}
      <section className='form-section'>
        <h3>Технічне завдання на створення КТЗІ</h3>
        <div className='form-grid two-column'>
          <div className='form-group'>
            <label>Дата</label>
            <input
              type='date'
              name='ttCreateDate'
              value={formData.ttCreateDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер</label>
            <input
              type='text'
              name='ttCreateNumber'
              value={formData.ttCreateNumber}
              onChange={handleInputChange}
              placeholder='№'
            />
          </div>
        </div>
      </section>

      {/* ФОРМУЛЯР НА АС */}
      <section className='form-section'>
        <h3>Формуляр на АС</h3>
        <div className='form-grid two-column'>
          <div className='form-group'>
            <label>Дата</label>
            <input
              type='date'
              name='formulaDate'
              value={formData.formulaDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер</label>
            <input
              type='text'
              name='formulaNumber'
              value={formData.formulaNumber}
              onChange={handleInputChange}
              placeholder='№'
            />
          </div>
        </div>
      </section>

      {/* ПАСПОРТ КТЗІ */}
      <section className='form-section'>
        <h3>Паспорт на КТЗІ</h3>
        <div className='form-grid two-column'>
          <div className='form-group'>
            <label>Дата</label>
            <input
              type='date'
              name='passportDate'
              value={formData.passportDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер</label>
            <input
              type='text'
              name='passportNumber'
              value={formData.passportNumber}
              onChange={handleInputChange}
              placeholder='№'
            />
          </div>
        </div>
      </section>

      {/* ПРОТОКОЛ ІК ЗАХИЩЕНОСТІ */}
      <section className='form-section'>
        <h3>Протокол ІК захищеності інформації</h3>
        <div className='form-grid'>
          <div className='form-group'>
            <label>Дата</label>
            <input
              type='date'
              name='protocolDate'
              value={formData.protocolDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер</label>
            <input
              type='text'
              name='protocolNumber'
              value={formData.protocolNumber}
              onChange={handleInputChange}
              placeholder='№'
            />
          </div>
          <div className='form-group'>
            <label>Дійсний до</label>
            <input
              type='date'
              name='protocolValidUntil'
              value={formData.protocolValidUntil}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </section>

      {/* АКТ КСП */}
      <section className='form-section'>
        <h3>Акт КСП</h3>
        <div className='form-grid two-column'>
          <div className='form-group'>
            <label>Дата</label>
            <input
              type='date'
              name='kspActDate'
              value={formData.kspActDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер</label>
            <input
              type='text'
              name='kspActNumber'
              value={formData.kspActNumber}
              onChange={handleInputChange}
              placeholder='№'
            />
          </div>
        </div>
      </section>

      {/* АКТ АТЕСТАЦІЇ */}
      <section className='form-section'>
        <h3>Акт атестації</h3>
        <div className='form-grid'>
          <div className='form-group'>
            <label>Дата реєстрації</label>
            <input
              type='date'
              name='attestationRegDate'
              value={formData.attestationRegDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер реєстрації</label>
            <input
              type='text'
              name='attestationRegNumber'
              value={formData.attestationRegNumber}
              onChange={handleInputChange}
              placeholder='№'
            />
          </div>
          <div className='form-group'>
            <label>Дата реєстрації в ДССЗЗІ</label>
            <input
              type='date'
              name='attestationDsszziDate'
              value={formData.attestationDsszziDate}
              onChange={handleInputChange}
            />
          </div>
          <div className='form-group'>
            <label>Номер реєстрації в ДССЗЗІ</label>
            <input
              type='text'
              name='attestationDsszziNumber'
              value={formData.attestationDsszziNumber}
              onChange={handleInputChange}
              placeholder='№'
            />
          </div>
          <div className='form-group'>
            <label>Дійсний до</label>
            <input
              type='date'
              name='attestationValidUntil'
              value={formData.attestationValidUntil}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </section>

      {/* ДОКУМЕНТИ ДССЗЗІ */}
      <section className='form-section'>
        <div className='section-header'>
          <h3>📄 Документи, зареєстровані в ДССЗЗІ</h3>
          <button type='button' className='btn-add' onClick={addDocument}>
            + Додати документ
          </button>
        </div>

        <div className='nested-items'>
          {formData.documents &&
            formData.documents.map((doc, index) => (
              <div key={index} className='nested-item'>
                <div className='nested-header'>
                  <span className='item-number'>Документ {index + 1}</span>
                  <button
                    type='button'
                    className='btn-remove'
                    onClick={() => removeDocument(index)}
                    title='Видалити'
                  >
                    ✕
                  </button>
                </div>

                <div className='form-grid'>
                  <div className='form-group'>
                    <label>Вид документа *</label>
                    <select
                      value={doc.docType || ''}
                      onChange={(e) =>
                        updateDocument(index, 'docType', e.target.value)
                      }
                      required
                    >
                      <option value='Атестат відповідності'>
                        Атестат відповідності
                      </option>
                      <option value='Акт завершення робіт'>
                        Акт завершення робіт
                      </option>
                      <option value='Декларація про відповідність'>
                        Декларація про відповідність
                      </option>
                    </select>
                  </div>
                  <div className='form-group'>
                    <label>Дата</label>
                    <input
                      type='date'
                      value={doc.date || ''}
                      onChange={(e) =>
                        updateDocument(index, 'date', e.target.value)
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>Номер</label>
                    <input
                      type='text'
                      value={doc.number || ''}
                      onChange={(e) =>
                        updateDocument(index, 'number', e.target.value)
                      }
                      placeholder='№'
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* ЗАСОБИ ЗАХИСТУ */}
      <section className='form-section'>
        <div className='section-header'>
          <h3>🛡️ Застосовані засоби захисту</h3>
          <button type='button' className='btn-add' onClick={addProtectionMean}>
            + Додати засіб
          </button>
        </div>

        <div className='nested-items'>
          {formData.protectionMeans &&
            formData.protectionMeans.map((mean, index) => (
              <div key={index} className='nested-item'>
                <div className='nested-header'>
                  <span className='item-number'>Засіб {index + 1}</span>
                  <button
                    type='button'
                    className='btn-remove'
                    onClick={() => removeProtectionMean(index)}
                    title='Видалити'
                  >
                    ✕
                  </button>
                </div>

                <div className='form-grid'>
                  <div className='form-group full-width'>
                    <label>Назва *</label>
                    <input
                      type='text'
                      value={mean.name || ''}
                      onChange={(e) =>
                        updateProtectionMean(index, 'name', e.target.value)
                      }
                      required
                      placeholder='Назва засобу'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Серійний номер</label>
                    <input
                      type='text'
                      value={mean.serialNumber || ''}
                      onChange={(e) =>
                        updateProtectionMean(
                          index,
                          'serialNumber',
                          e.target.value,
                        )
                      }
                      placeholder='Серійний номер'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Рік випуску</label>
                    <input
                      type='number'
                      value={mean.releaseYear || new Date().getFullYear()}
                      onChange={(e) =>
                        updateProtectionMean(
                          index,
                          'releaseYear',
                          parseInt(e.target.value),
                        )
                      }
                      min='1990'
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div className='form-group full-width'>
                    <label>Дані про експертний висновок / сертифікат</label>
                    <input
                      type='text'
                      value={mean.certificateInfo || ''}
                      onChange={(e) =>
                        updateProtectionMean(
                          index,
                          'certificateInfo',
                          e.target.value,
                        )
                      }
                      placeholder='Дані про сертифікат'
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* ПРОГРАМНЕ ЗАБЕЗПЕЧЕННЯ */}
      <section className='form-section'>
        <div className='section-header'>
          <h3>💾 Перелік програмного забезпечення</h3>
          <button type='button' className='btn-add' onClick={addSoftware}>
            + Додати ПЗ
          </button>
        </div>

        <div className='nested-items'>
          {formData.software &&
            formData.software.map((sw, index) => (
              <div key={index} className='nested-item'>
                <div className='nested-header'>
                  <span className='item-number'>ПЗ {index + 1}</span>
                  <button
                    type='button'
                    className='btn-remove'
                    onClick={() => removeSoftware(index)}
                    title='Видалити'
                  >
                    ✕
                  </button>
                </div>

                <div className='form-grid'>
                  <div className='form-group full-width'>
                    <label>Назва ПЗ *</label>
                    <input
                      type='text'
                      value={sw.name || ''}
                      onChange={(e) =>
                        updateSoftware(index, 'name', e.target.value)
                      }
                      required
                      placeholder='Windows 10, Office 365'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Номер версії</label>
                    <input
                      type='text'
                      value={sw.version || ''}
                      onChange={(e) =>
                        updateSoftware(index, 'version', e.target.value)
                      }
                      placeholder='v1.0'
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* НАКАЗИ */}
      <section className='form-section'>
        <div className='section-header'>
          <h3>📋 Накази</h3>
          <button type='button' className='btn-add' onClick={addOrder}>
            + Додати наказ
          </button>
        </div>

        <div className='nested-items'>
          {formData.orders &&
            formData.orders.map((order, index) => (
              <div key={index} className='nested-item'>
                <div className='nested-header'>
                  <span className='item-number'>Наказ {index + 1}</span>
                  <button
                    type='button'
                    className='btn-remove'
                    onClick={() => removeOrder(index)}
                    title='Видалити'
                  >
                    ✕
                  </button>
                </div>

                <div className='form-grid'>
                  <div className='form-group'>
                    <label>Тип наказу *</label>
                    <select
                      value={order.orderType || ''}
                      onChange={(e) =>
                        updateOrder(index, 'orderType', e.target.value)
                      }
                      required
                    >
                      <option value='Введення в експлуатацію'>
                        Введення в експлуатацію
                      </option>
                      <option value='Призупинення обробки'>
                        Призупинення обробки
                      </option>
                    </select>
                  </div>
                  <div className='form-group'>
                    <label>Номер</label>
                    <input
                      type='text'
                      value={order.number || ''}
                      onChange={(e) =>
                        updateOrder(index, 'number', e.target.value)
                      }
                      placeholder='№'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Дата</label>
                    <input
                      type='date'
                      value={order.date || ''}
                      onChange={(e) =>
                        updateOrder(index, 'date', e.target.value)
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>Видавник</label>
                    <select
                      value={order.publisher || ''}
                      onChange={(e) =>
                        updateOrder(index, 'publisher', e.target.value)
                      }
                    >
                      <option value='ГУНП'>ГУНП</option>
                      <option value='Підрозділ'>Підрозділ</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
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
