import React, { useState } from 'react'
import { ExamConfig, ExamQuestionType, ExamScope, ExamScriptMode } from '@/types/exam'
import { useLanguage } from '@/context/LanguageContext'
import { useScript } from '@/context/ScriptContext'

interface ExamConfigCardProps {
  onStartExam: (config: ExamConfig) => void
  totalAvailableCharacters: number
}

export const ExamConfigCard: React.FC<ExamConfigCardProps> = ({
  onStartExam,
  totalAvailableCharacters,
}) => {
  const { t, language } = useLanguage()
  const { script } = useScript()
  const [scriptMode, setScriptMode] = useState<ExamScriptMode>(
    script === 'katakana' ? 'katakana' : 'hiragana'
  )
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [scope, setScope] = useState<ExamScope>('all')
  const [rowGroup, setRowGroup] = useState<string>('all')
  const [enabledTypes, setEnabledTypes] = useState<ExamQuestionType[]>([
    'romaji_to_kana',
    'kana_to_romaji',
    'blind_tracing',
  ])
  const [timerSeconds, setTimerSeconds] = useState<number>(0) // 0 = unlimited

  const toggleType = (type: ExamQuestionType) => {
    if (enabledTypes.includes(type)) {
      if (enabledTypes.length === 1) return // keep at least one
      setEnabledTypes(enabledTypes.filter((t) => t !== type))
    } else {
      setEnabledTypes([...enabledTypes, type])
    }
  }

  const handleStart = () => {
    onStartExam({
      scriptMode,
      questionCount,
      scope,
      rowGroup,
      enabledTypes,
      timerSecondsPerQuestion: timerSeconds,
    })
  }

  return (
    <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg dark:shadow-2xl text-slate-800 dark:text-slate-100 transition-colors">
      <div className="text-center max-w-xl mx-auto pb-6 border-b border-slate-200 dark:border-slate-800">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-2">
          <span>📝</span>
          <span>{t('exam.badge')}</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {t('exam.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
          {t('exam.subtitle')}
        </p>
      </div>

      <div className="mt-6 space-y-6 max-w-2xl mx-auto">
        {/* 0. PILIHAN AKSARA (HIRAGANA, KATAKANA, CAMPURAN) */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            {t('exam.section_script')}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                id: 'hiragana' as ExamScriptMode,
                icon: 'あ',
                label: t('exam.script_hiragana'),
                sub: t('exam.script_hiragana_sub'),
              },
              {
                id: 'katakana' as ExamScriptMode,
                icon: 'ア',
                label: t('exam.script_katakana'),
                sub: t('exam.script_katakana_sub'),
              },
              {
                id: 'mixed' as ExamScriptMode,
                icon: 'あ/ア',
                label: t('exam.script_mixed'),
                sub: t('exam.script_mixed_sub'),
              },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScriptMode(sc.id)}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center ${
                  scriptMode === sc.id
                    ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/30'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-xl font-serif font-black mb-1">{sc.icon}</span>
                <span className="text-xs font-bold leading-tight">{sc.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5 leading-tight">{sc.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 1. CAKUPAN KATEGORI KARAKTER */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            {t('exam.section_scope')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'all' as ExamScope, icon: '📚', label: t('exam.scope_all'), sub: t('exam.scope_all_sub') },
              { id: 'gojuon' as ExamScope, icon: '🌱', label: t('exam.scope_gojuon'), sub: t('exam.scope_gojuon_sub') },
              { id: 'dakuon_handakuon' as ExamScope, icon: '⚡', label: t('exam.scope_dakuon_handakuon'), sub: t('exam.scope_dakuon_handakuon_sub') },
              { id: 'yoon' as ExamScope, icon: '✨', label: t('exam.scope_yoon'), sub: t('exam.scope_yoon_sub') },
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setScope(sc.id)}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center ${
                  scope === sc.id
                    ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/30'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg mb-1">{sc.icon}</span>
                <span className="text-xs font-bold leading-tight">{sc.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5 leading-tight">{sc.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. JUMLAH SOAL */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            {t('exam.section_count')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { count: 10, label: t('exam.count_10'), sub: t('exam.count_10_sub') },
              { count: 20, label: t('exam.count_20'), sub: t('exam.count_20_sub') },
              { count: 46, label: t('exam.count_46'), sub: t('exam.count_46_sub') },
              { count: totalAvailableCharacters || 107, label: t('exam.count_all'), sub: t('exam.count_all_sub') },
            ].map((opt) => (
              <button
                key={opt.count}
                type="button"
                onClick={() => setQuestionCount(opt.count)}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  questionCount === opt.count
                    ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 dark:border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-400/30'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm sm:text-base font-black">{opt.label}</div>
                <div className="text-[10px] opacity-75">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. CAKUPAN BARIS */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            {t('exam.section_row')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'all', title: language === 'en' ? 'All Rows (46 Kana)' : 'Semua Baris (46 Karakter)', sub: language === 'en' ? 'Full A ~ N curriculum' : 'A ~ N lengkap' },
              { id: 'vowel_ka', title: language === 'en' ? 'Vowels & Ka Row (10)' : 'Vokal & Baris Ka (10)', sub: 'あ, い, う, え, お / か...' },
              { id: 'sa_ta', title: language === 'en' ? 'Sa & Ta Rows (10)' : 'Baris Sa & Ta (10)', sub: 'さ, し, す, せ, そ / た...' },
              { id: 'na_ha_ma', title: language === 'en' ? 'Na, Ha, Ma Rows (15)' : 'Baris Na, Ha, Ma (15)', sub: 'な, は, ま' },
              { id: 'ya_ra_wa_n', title: language === 'en' ? 'Ya, Ra, Wa, N Rows (11)' : 'Baris Ya, Ra, Wa, N (11)', sub: 'や, ら, わ, ん' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRowGroup(r.id)}
                className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                  rowGroup === r.id
                    ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-500 text-sky-700 dark:text-sky-300 ring-1 ring-sky-400/40'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="text-xs sm:text-sm font-bold">{r.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.sub}</div>
                </div>
                <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                  rowGroup === r.id ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {rowGroup === r.id && '✓'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. KOMBINASI TIPE SOAL */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            {t('exam.section_types')}
          </label>
          <div className="space-y-2">
            {[
              {
                type: 'romaji_to_kana' as ExamQuestionType,
                icon: '🔤',
                title: t('exam.type_romaji_to_kana'),
                desc: t('exam.type_romaji_to_kana_sub'),
              },
              {
                type: 'kana_to_romaji' as ExamQuestionType,
                icon: '📖',
                title: t('exam.type_kana_to_romaji'),
                desc: t('exam.type_kana_to_romaji_sub'),
              },
              {
                type: 'blind_tracing' as ExamQuestionType,
                icon: '✍️',
                title: t('exam.type_blind_tracing'),
                desc: t('exam.type_blind_tracing_sub'),
              },
            ].map((t) => {
              const isChecked = enabledTypes.includes(t.type)
              return (
                <div
                  key={t.type}
                  onClick={() => toggleType(t.type)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isChecked
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-400/50 text-indigo-900 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{t.icon}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold">{t.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.desc}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-sky-600 cursor-pointer pointer-events-none"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. TIMER PER SOAL */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2.5">
            {t('exam.section_timer')}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { val: 0, label: language === 'en' ? 'Relaxed' : 'Santai', sub: t('exam.timer_unlimited') },
              { val: 15, label: '15s', sub: t('exam.timer_15s') },
              { val: 30, label: '30s', sub: t('exam.timer_30s') },
            ].map((tm) => (
              <button
                key={tm.val}
                type="button"
                onClick={() => setTimerSeconds(tm.val)}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                  timerSeconds === tm.val
                    ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm sm:text-base font-bold">{tm.label}</div>
                <div className="text-[11px] opacity-75">{tm.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* START BUTTON */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleStart}
            type="button"
            className="w-full py-4 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-600 hover:from-sky-500 hover:via-indigo-500 hover:to-rose-500 text-white shadow-xl shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
          >
            <span>🚀</span>
            <span>{t('exam.start_btn')} ({questionCount} {language === 'en' ? 'Questions' : 'Soal'})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
