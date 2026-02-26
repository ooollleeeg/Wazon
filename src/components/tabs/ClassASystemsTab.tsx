import React from 'react';
import '../../styles/TabContent.css';

function ClassASystemsTab() {
  return (
    <div className="tab-layout">
      <main className="tab-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="setup-placeholder">
          <div className="placeholder-icon">📡</div>
          <h3>АС класу 1, 2, 3</h3>
          <p>Форма для цієї вкладки в розробці</p>
          <p className="hint">Для формування структури даних контактуйте адміністратора</p>
        </div>
      </main>
    </div>
  );
}

export default ClassASystemsTab;