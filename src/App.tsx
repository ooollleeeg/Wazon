import React, { useState, useEffect } from 'react';
import './styles/App.css';
import PersonnelTab from './components/tabs/PersonnelTab';
import ClassASTab from './components/tabs/ClassASTab';
import ServicePremisesTab from './components/tabs/ServicePremisesTab';
import KRTTab from './components/tabs/KRTTab';
import IKSTab from './components/tabs/IKSTab';
import TZIToolsTab from './components/tabs/TZIToolsTab';
import SearchControlEquipmentTab from './components/tabs/SearchControlEquipmentTab';
import AntivirusTab from './components/tabs/AntivirusTab';
import TZICheckTab from './components/tabs/TZICheckTab';
import RadioMonitoringTab from './components/tabs/RadioMonitoringTab';
import GUNPResearchTab from './components/tabs/GUNPResearchTab';
import NPUResearchTab from './components/tabs/NPUResearchTab';
import DocumentsTab from './components/tabs/DocumentsTab';

interface Tab {
  id: string;
  label: string;
  icon: string;
  component: React.FC;
  color: string;
}

const TABS: Tab[] = [
  {
    id: 'personnel',
    label: 'Особовий склад',
    icon: '👥',
    component: PersonnelTab,
    color: '#667eea',
  },
  {
    id: 'class-a',
    label: 'АС класу 1,2,3',
    icon: '📡',
    component: ClassASTab,
    color: '#764ba2',
  },
  {
    id: 'service-premises',
    label: 'Службові приміщення',
    icon: '🏠',
    component: ServicePremisesTab,
    color: '#f093fb',
  },
  {
    id: 'krt',
    label: 'КРТ',
    icon: '📞',
    component: KRTTab,
    color: '#43e97b',
  },
  {
    id: 'iks',
    label: 'ІКС',
    icon: '🌐',
    component: IKSTab,
    color: '#fa709a',
  },
  {
    id: 'tzi-tools',
    label: 'Засоби ТЗІ',
    icon: '🛡️',
    component: TZIToolsTab,
    color: '#fee140',
  },
  {
    id: 'search-control',
    label: 'Пошукова техніка',
    icon: '🔍',
    component: SearchControlEquipmentTab,
    color: '#30b0c0',
  },
  {
    id: 'antivirus',
    label: 'Антивірусне ПЗ',
    icon: '🦠',
    component: AntivirusTab,
    color: '#a8edea',
  },
  {
    id: 'tzi-check',
    label: 'Перевірки ТЗІ',
    icon: '✓',
    component: TZICheckTab,
    color: '#fed6e3',
  },
  {
    id: 'radio-monitoring',
    label: 'Радіомоніторинг',
    icon: '📻',
    component: RadioMonitoringTab,
    color: '#ff6348',
  },
  {
    id: 'gunp-research',
    label: 'Дослідження ГУНП',
    icon: '🔬',
    component: GUNPResearchTab,
    color: '#74b9ff',
  },
  {
    id: 'npu-research',
    label: 'Дослідження НПУ',
    icon: '⚗️',
    component: NPUResearchTab,
    color: '#81ecec',
  },
  {
    id: 'documents',
    label: 'Документи',
    icon: '📄',
    component: DocumentsTab,
    color: '#dfe6e9',
  },
];

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const CurrentComponent = TABS[currentTab].component;
  const currentTabData = TABS[currentTab];

  return (
    <div className='app'>
      <header
        className='app-header'
        style={{
          background: `linear-gradient(135deg, ${currentTabData.color} 0%, ${currentTabData.color}dd 100%)`,
        }}
      >
        {/* Left emblem - National Police of Ukraine */}
        <div className='header-emblem header-emblem-left'>
          <img
            src='/npu.png'
            alt='Емблема Національної поліції України'
            className='emblem-image'
          />
        </div>

        {/* Center content */}
        <div className='header-content'>
          <h1>📋 Інформаційно-пошукова система "ВАЗОН"</h1>
          <p className='subtitle'>Технічний захист інформації</p>
        </div>

        {/* Right vase decoration */}
        <div className='header-emblem header-emblem-right'>
          <img
            src='/vazon.png'
            alt='Вазончик із рослиною'
            className='emblem-image'
          />
        </div>

        <button
          className='menu-toggle'
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>
      </header>

      <div className='tabs-container'>
        <div className={`tabs-list ${sidebarOpen ? 'open' : 'closed'}`}>
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab-button ${currentTab === index ? 'active' : ''}`}
              onClick={() => {
                setCurrentTab(index);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              style={{
                borderColor: currentTab === index ? tab.color : 'transparent',
                color: currentTab === index ? tab.color : '#666',
              }}
              title={tab.label}
            >
              <span className='tab-icon'>{tab.icon}</span>
              <span className='tab-label'>{tab.label}</span>
              <span className='tab-number'>{index + 1}</span>
            </button>
          ))}
        </div>
      </div>

      <main className='tab-content'>
        <div className='tab-header'>
          <h2>
            {currentTabData.icon} {currentTabData.label}
          </h2>
        </div>
        <CurrentComponent />
      </main>

      {showScrollTop && (
        <button
          className='scroll-to-top'
          onClick={scrollToTop}
          title='Вгору'
          aria-label='Повернутися у верхню частину сторінки'
        >
          ⬆️
        </button>
      )}
    </div>
  );
}

export default App;
