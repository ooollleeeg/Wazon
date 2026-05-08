import React, { useState, useEffect } from 'react';
// @ts-ignore
import '../../styles/ExpirationMonitoring.css';

interface ExpirationDocument {
  id: number;
  parentId: number;
  parentName: string;
  tabId: string;
  tabLabel: string;
  documentType: string;
  fieldName: string;
  fieldLabel: string;
  expirationDate: string;
  status: 'expired' | 'critical' | 'warning' | 'ok';
  daysUntilExpiration: number;
}

const TABS_CONFIG = [
  {
    apiEndpoint: '/api/objects/class_a_systems',
    label: 'АС класу 1,2,3',
    tabId: 'class-a',
  },
  {
    apiEndpoint: '/api/objects/service_premises',
    label: 'Службові приміщення',
    tabId: 'service-premises',
  },
  { apiEndpoint: '/api/objects/krt', label: 'КРТ', tabId: 'krt' },
  { apiEndpoint: '/api/objects/iks', label: 'ІКС', tabId: 'iks' },
];

const DATE_FIELDS = [
  {
    field: 'protocolValidUntil',
    label: 'Протокол дійсний до',
    type: 'protocol',
  },
  { field: 'controlTermin', label: 'Контроль дійсний до', type: 'control' },
  {
    field: 'attestationValidUntil',
    label: 'Атестація дійсна до',
    type: 'atestation',
  },
  { field: 'validUntil', label: 'Документ дійсний до', type: 'compliance' },
  {
    field: 'nextAuthorizationDeadline',
    label: 'Авторизація дійсна до',
    type: 'authorization',
  },
];

const getStatus = (
  expirationDate: string,
): { status: 'expired' | 'critical' | 'warning' | 'ok'; days: number } => {
  if (!expirationDate) return { status: 'ok', days: Infinity };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);

  const diffMs = expDate.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return { status: 'expired', days };
  if (days < 7) return { status: 'critical', days };
  if (days < 30) return { status: 'warning', days };
  return { status: 'ok', days };
};

const getStatusIcon = (
  status: 'expired' | 'critical' | 'warning' | 'ok',
): string => {
  switch (status) {
    case 'expired':
      return '⚫';
    case 'critical':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'ok':
      return '🟢';
  }
};

const getStatusLabel = (
  status: 'expired' | 'critical' | 'warning' | 'ok',
): string => {
  switch (status) {
    case 'expired':
      return 'Закінчився';
    case 'critical':
      return 'Критично (< 7 днів)';
    case 'warning':
      return 'Попередження (< 30 днів)';
    case 'ok':
      return 'OK (> 30 днів)';
  }
};

function ExpirationMonitoringTab() {
  const [documents, setDocuments] = useState<ExpirationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'expired' | 'critical' | 'warning' | 'ok'
  >('all');

  useEffect(() => {
    // Add initial delay to ensure Express server is fully ready
    const timer = setTimeout(() => {
      fetchAllDocuments();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const fetchAllDocuments = async () => {
    setLoading(true);
    const allDocs: ExpirationDocument[] = [];

    for (const config of TABS_CONFIG) {
      try {
        const response = await fetch(config.apiEndpoint, {
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) continue;

        const data = await response.json();

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            // Define which nested sections to check for each tab
            const nestedFieldsToCheck: {
              [key: string]: { [key: string]: string[] };
            } = {
              'class-a': {
                categorization: ['categorizationValidUntil'],
                instrumentalControl: ['controlTermin'],
                atestation: ['attestationValidUntil'],
                complianceDocuments: ['validUntil'],
              },
              'service-premises': {
                categorization: ['categorizationValidUntil'],
                instrumentalControl: ['controlTermin'],
                atestation: ['attestationValidUntil'],
              },
              krt: {
                categorization: ['categorizationValidUntil'],
                instrumentalControl: ['controlTermin'],
                atestation: ['attestationValidUntil'],
              },
              iks: {
                categorization: ['categorizationValidUntil'],
                instrumentalControl: ['controlTermin'],
                atestation: ['attestationValidUntil'],
              },
            };

            const fieldsToCheck = nestedFieldsToCheck[config.tabId] || {};

            // Check nested fields - only take the FIRST (current) record
            Object.entries(fieldsToCheck).forEach(([nestedName, fields]) => {
              if (
                Array.isArray(item[nestedName]) &&
                item[nestedName].length > 0
              ) {
                // Take only the first record (idx = 0) which is the "current" version
                const nested = item[nestedName][0];

                fields.forEach((nestedField) => {
                  if (nested[nestedField]) {
                    const { status, days } = getStatus(nested[nestedField]);

                    // Map nested field names to display labels
                    const fieldLabelMap: { [key: string]: string } = {
                      categorizationValidUntil: 'Акт категоріювання дійсний до',
                      controlTermin: 'Протокол контролю дійсний до',
                      attestationValidUntil: 'Атестація дійсна до',
                      validUntil: 'Документ про відповідність дійсний до',
                    };

                    allDocs.push({
                      id: `${item.id}-${nestedName}-0`,
                      parentId: item.id,
                      parentName:
                        item.systemName ||
                        item.subdivisionName ||
                        item.name ||
                        'Без назви',
                      tabId: config.tabId,
                      tabLabel: config.label,
                      documentType: nestedName,
                      fieldName: nestedField,
                      fieldLabel: fieldLabelMap[nestedField] || nestedField,
                      expirationDate: nested[nestedField],
                      status,
                      daysUntilExpiration: days,
                    });
                  }
                });
              }
            });
          });
        }
      } catch (error) {
        console.error(`Error fetching ${config.label}:`, error);
      }

      // Add small delay between requests to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Also fetch documents
    try {
      const response = await fetch('/api/documents', {
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const docsData = await response.json();
        if (Array.isArray(docsData)) {
          docsData.forEach((doc: any) => {
            if (doc.expirationDate) {
              const { status, days } = getStatus(doc.expirationDate);
              allDocs.push({
                id: doc.id,
                parentId: doc.id,
                parentName: doc.name || 'Документ',
                tabId: 'documents',
                tabLabel: 'Документи',
                documentType: doc.type || 'Документ',
                fieldName: 'expirationDate',
                fieldLabel: 'Дата закінчення',
                expirationDate: doc.expirationDate,
                status,
                daysUntilExpiration: days,
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }

    setDocuments(allDocs);
    setLoading(false);
  };

  const filteredDocs = documents.filter((doc) => {
    if (filterStatus === 'all') return true;
    return doc.status === filterStatus;
  });

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    if (sortBy === 'date') {
      return a.daysUntilExpiration - b.daysUntilExpiration;
    } else {
      const statusOrder = { expired: 0, critical: 1, warning: 2, ok: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
  });

  const stats = {
    total: documents.length,
    expired: documents.filter((d) => d.status === 'expired').length,
    critical: documents.filter((d) => d.status === 'critical').length,
    warning: documents.filter((d) => d.status === 'warning').length,
    ok: documents.filter((d) => d.status === 'ok').length,
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('uk-UA');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className='expiration-monitoring'>
      <div className='monitoring-header'>
        <h2>📊 Моніторинг термінів дії документів</h2>
        <button
          className='refresh-btn'
          onClick={fetchAllDocuments}
          disabled={loading}
        >
          {loading ? 'Завантаження...' : '🔄 Оновити'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className='stats-grid'>
        <div className='stat-card stat-total'>
          <div className='stat-number'>{stats.total}</div>
          <div className='stat-label'>Всього документів</div>
        </div>
        <div className='stat-card stat-expired'>
          <div className='stat-icon'>⚫</div>
          <div className='stat-number'>{stats.expired}</div>
          <div className='stat-label'>Закінчилися</div>
        </div>
        <div className='stat-card stat-critical'>
          <div className='stat-icon'>🔴</div>
          <div className='stat-number'>{stats.critical}</div>
          <div className='stat-label'>Критично</div>
        </div>
        <div className='stat-card stat-warning'>
          <div className='stat-icon'>🟡</div>
          <div className='stat-number'>{stats.warning}</div>
          <div className='stat-label'>Попередження</div>
        </div>
        <div className='stat-card stat-ok'>
          <div className='stat-icon'>🟢</div>
          <div className='stat-number'>{stats.ok}</div>
          <div className='stat-label'>OK</div>
        </div>
      </div>

      {/* Filters */}
      <div className='monitoring-controls'>
        <div className='filter-group'>
          <label>Фільтр по статусу:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value='all'>Усі ({documents.length})</option>
            <option value='expired'>⚫ Закінчилися ({stats.expired})</option>
            <option value='critical'>🔴 Критично ({stats.critical})</option>
            <option value='warning'>🟡 Попередження ({stats.warning})</option>
            <option value='ok'>🟢 OK ({stats.ok})</option>
          </select>
        </div>

        <div className='sort-group'>
          <label>Сортування:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value='date'>По даті закінчення</option>
            <option value='status'>По статусу</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className='monitoring-table-container'>
        {sortedDocs.length > 0 ? (
          <table className='monitoring-table'>
            <thead>
              <tr>
                <th>Статус</th>
                <th>Документ</th>
                <th>Об'єкт</th>
                <th>Вкладка</th>
                <th>Дата закінчення</th>
                <th>Днів залишилось</th>
                <th>Дія</th>
              </tr>
            </thead>
            <tbody>
              {sortedDocs.map((doc, idx) => (
                <tr key={idx} className={`status-${doc.status}`}>
                  <td className='status-cell'>
                    <span
                      className='status-badge'
                      title={getStatusLabel(doc.status)}
                    >
                      {getStatusIcon(doc.status)}
                    </span>
                  </td>
                  <td>
                    <div className='doc-type'>{doc.documentType}</div>
                    <div className='doc-field'>{doc.fieldLabel}</div>
                  </td>
                  <td className='parent-name'>{doc.parentName}</td>
                  <td>
                    <span className='tab-badge'>{doc.tabLabel}</span>
                  </td>
                  <td className='expiration-date'>
                    {formatDate(doc.expirationDate)}
                  </td>
                  <td className='days-remaining'>
                    <strong className={`days-${doc.status}`}>
                      {doc.daysUntilExpiration < 0
                        ? `${Math.abs(doc.daysUntilExpiration)} днів тому`
                        : doc.daysUntilExpiration === 0
                          ? 'Сьогодні'
                          : `${doc.daysUntilExpiration} днів`}
                    </strong>
                  </td>
                  <td>
                    <a href={`#${doc.tabId}`} className='nav-link'>
                      → Перейти
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className='empty-state'>
            <p>🎉 Немає документів із цим статусом</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpirationMonitoringTab;
