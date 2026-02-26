import React from 'react';
import '../../styles/TabContent.css';

function CombinedOIDTab() {
  return (
    <div className="tab-layout">
      <main className="tab-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="setup-placeholder">
          <div className="placeholder-icon">🔗</div>
          <h3>Комбіновані ОІД</h3>
          <p>Форма для цієї вкладки в розробці</p>
          <p className="hint">Для формування структури даних контактуйте адміністратора</p>
        </div>
      </main>
    </div>
  );
}

export default CombinedOIDTab;