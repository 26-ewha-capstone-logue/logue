import { useEffect, useState } from 'react';
import { InfoCard } from './components/InfoCard';
import { datasets, metrics, testCases } from './data/catalog';
import type { DatasetDefinition, SavedResults } from './types';

// 페이지 전반의 발표용 톤을 맞추는 기본 레이아웃 스타일이다.
const pageStyle: Record<string, string | number> = {
  minHeight: '100vh',
  padding: '40px 20px 80px',
  background: 'linear-gradient(180deg, #f7f4ea 0%, #e8f0e2 100%)',
  color: '#20331b',
  fontFamily: '"Segoe UI", "Apple SD Gothic Neo", sans-serif',
};

const shellStyle: Record<string, string | number> = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'grid',
  gap: 20,
};

const pillStyle: Record<string, string | number> = {
  display: 'inline-block',
  padding: '6px 12px',
  borderRadius: 999,
  background: '#dcead2',
  color: '#294222',
  fontSize: 13,
  fontWeight: 700,
};

const softBlockStyle: Record<string, string | number> = {
  background: '#f5f8f2',
  borderRadius: 16,
  padding: 16,
};

const codeBlockStyle: Record<string, string | number> = {
  margin: 0,
  overflowX: 'auto',
  background: '#20331b',
  color: '#eef5e9',
  padding: 14,
  borderRadius: 12,
  fontSize: 13,
  lineHeight: 1.5,
};

const metaLabelStyle: Record<string, string | number> = {
  fontSize: 13,
  color: '#556b50',
  fontWeight: 700,
};

// JSON 원문은 시연 시 그대로 보여주는 것이 중요하므로 별도 블록 컴포넌트로 분리한다.
function JsonBlock({ value, emptyText }: { value: unknown; emptyText?: string }) {
  const hasValue = value !== null && value !== undefined;

  return <pre style={codeBlockStyle}>{hasValue ? JSON.stringify(value, null, 2) : emptyText ?? '데이터가 없습니다.'}</pre>;
}

// 결과 파일이 없거나 깨졌을 때 화면이 비어 보이지 않도록 안내 상태를 표시한다.
function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        ...softBlockStyle,
        border: '1px dashed #bfd0b7',
        color: '#556b50',
      }}
    >
      <strong style={{ display: 'block', color: '#20331b' }}>{title}</strong>
      <p style={{ margin: '8px 0 0' }}>{description}</p>
    </div>
  );
}

// 케이스 성공/실패 상태를 어디서든 동일한 시각 언어로 보여주기 위한 배지다.
function StatusPill({ status }: { status: 'passed' | 'failed' | 'empty' }) {
  const palette =
    status === 'passed'
      ? { background: '#d8f0d0', color: '#1f5b1b' }
      : status === 'failed'
        ? { background: '#f4d9d4', color: '#7a2418' }
        : { background: '#e3e8de', color: '#556b50' };

  const label = status === 'passed' ? 'PASS' : status === 'failed' ? 'FAIL' : 'NO RESULT';

  return <span style={{ ...pillStyle, ...palette }}>{label}</span>;
}

// 결과 JSON에서 케이스 id 기준으로 빠르게 상세를 찾기 위해 Map으로 변환한다.
function getResultMap(savedResults: SavedResults | null) {
  return new Map(savedResults?.items.map((item) => [item.id, item]) ?? []);
}

function findDataset(datasetId: string): DatasetDefinition | undefined {
  return datasets.find((dataset) => dataset.id === datasetId);
}

// 결과 JSON은 없을 수도 있으므로 실패를 예외 대신 null로 흡수한다.
async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// 콘솔 로그 미리보기는 텍스트가 비어도 안내 문구를 보여준다.
async function fetchTextOrFallback(url: string, fallback: string): Promise<string> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    return fallback;
  }

  const text = await response.text();
  return text.trim() ? text : fallback;
}

function toBaseUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

export default function App() {
  const [selectedCaseId, setSelectedCaseId] = useState(testCases[0]?.id ?? '');
  const [savedResults, setSavedResults] = useState<SavedResults | null>(null);
  const [consoleText, setConsoleText] = useState('저장된 실행 로그를 불러오는 중입니다...');
  const [resultsError, setResultsError] = useState<string | null>(null);

  useEffect(() => {
    // 프런트는 OpenAI를 직접 호출하지 않고 저장된 결과 파일만 읽는다.
    async function loadSavedArtifacts() {
      try {
        const [resultsJson, consoleOutput] = await Promise.all([
          fetchJsonOrNull<SavedResults>(toBaseUrl('results/latest-results.json')),
          fetchTextOrFallback(
            toBaseUrl('results/latest-console.txt'),
            '아직 저장된 콘솔 로그가 없습니다. 먼저 npm run ai:test 를 실행하세요.',
          ),
        ]);

        setSavedResults(resultsJson);
        setConsoleText(consoleOutput);

        if (!resultsJson) {
          setResultsError('저장된 결과 파일이 없거나 비어 있습니다. 먼저 AI 테스트를 실행해 주세요.');
          return;
        }

        setResultsError(null);
      } catch {
        setSavedResults(null);
        setConsoleText('저장된 콘솔 로그를 불러오지 못했습니다.');
        setResultsError('저장된 결과 파일을 읽지 못했습니다. public/results 파일을 확인해 주세요.');
      }
    }

    void loadSavedArtifacts();
  }, []);

  const resultMap = getResultMap(savedResults);
  const selectedTestCase = testCases.find((testCase) => testCase.id === selectedCaseId) ?? testCases[0] ?? null;
  const selectedDataset = selectedTestCase ? findDataset(selectedTestCase.datasetId) : undefined;
  const selectedResult = selectedTestCase ? resultMap.get(selectedTestCase.id) ?? null : null;
  const hasRunSummary = Boolean(savedResults && (savedResults.items.length > 0 || savedResults.summary.total > 0));

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header
          style={{
            padding: '20px 24px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, #20331b 0%, #324f2a 100%)',
            color: '#eef5e9',
            boxShadow: '0 20px 50px rgba(33, 53, 24, 0.18)',
          }}
        >
          <div style={{ ...pillStyle, background: '#dcead2', color: '#20331b' }}>Phase 3 Demo</div>
          <h1 style={{ margin: '16px 0 10px', fontSize: 'clamp(34px, 5vw, 56px)', lineHeight: 1.05 }}>
            AI 질문 분석 데모
          </h1>
          <p style={{ maxWidth: 760, margin: 0, fontSize: 18, color: '#d9e7d2', lineHeight: 1.6 }}>
            로컬 AI 테스트 스크립트가 생성한 결과를 정적 프런트에서 바로 보여주는 발표용 화면입니다.
          </p>
          <div
            style={{
              marginTop: 18,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '10px 14px',
              borderRadius: 14,
            }}
          >
            <span style={{ fontWeight: 700 }}>AI 테스트 실행</span>
            <code style={{ fontSize: 14, color: '#f3f8ef' }}>npm run ai:test</code>
          </div>
        </header>

        <InfoCard title="Preset Metric" subtitle="현재 고정 지표는 가입 전환율 하나만 사용합니다." extra={<span style={pillStyle}>metric 1개</span>}>
          {metrics.map((metric) => (
            <div key={metric.id} style={{ ...softBlockStyle, display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <strong>{metric.businessLabel}</strong>
                <span style={{ ...pillStyle, fontSize: 12 }}>{metric.id}</span>
              </div>
              <p style={{ margin: 0, color: '#556b50' }}>{metric.description}</p>
              <div style={{ color: '#294222', fontWeight: 700 }}>계산식: {metric.formula}</div>
              <div style={{ color: '#556b50', fontSize: 14 }}>의미: 랜딩 세션 대비 가입 완료 비율을 비교합니다.</div>
            </div>
          ))}
        </InfoCard>

        <InfoCard title="데이터셋" subtitle="A는 명확한 스키마, B는 컬럼명 변형, C는 날짜 필드 모호성을 보여줍니다.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {datasets.map((dataset) => (
              <article key={dataset.id} style={{ ...softBlockStyle, display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                  <strong>{dataset.label}</strong>
                  <span style={{ ...pillStyle, fontSize: 12 }}>{dataset.id}</span>
                </div>
                <div style={{ color: '#556b50' }}>존재 이유: {dataset.description}</div>
                <div style={{ fontSize: 14, color: '#364b31' }}>테이블: {dataset.tableName}</div>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 700, color: '#20331b' }}>스키마 컬럼</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {dataset.fields.map((field) => (
                      <span
                        key={`${dataset.id}-${field.name}`}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 999,
                          background: '#ffffff',
                          border: '1px solid #d7dfd4',
                          fontSize: 13,
                          color: '#364b31',
                        }}
                      >
                        {field.label} ({field.name})
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="테스트 케이스" subtitle="상단 탭에서 케이스를 선택하면 아래에 해당 케이스만 표시됩니다." extra={<span style={pillStyle}>{testCases.length}개</span>}>
          <div style={{ display: 'grid', gap: 16 }}>
            {/* 케이스를 좌측 목록 대신 상단 탭 형태로 배치해 시연 중 전환을 쉽게 한다. */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {testCases.map((testCase) => {
                const result = resultMap.get(testCase.id);
                const isSelected = testCase.id === selectedCaseId;

                return (
                  <button
                    key={testCase.id}
                    type="button"
                    onClick={() => setSelectedCaseId(testCase.id)}
                    style={{
                      minWidth: 170,
                      textAlign: 'left',
                      border: isSelected ? '2px solid #294222' : '1px solid #d7dfd4',
                      background: isSelected ? '#edf4e8' : '#ffffff',
                      borderRadius: 16,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 8px 20px rgba(41, 66, 34, 0.12)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <strong>{testCase.id}</strong>
                      <StatusPill status={result ? result.status : 'empty'} />
                    </div>
                    <div style={{ marginTop: 8, color: '#556b50', fontSize: 13 }}>{testCase.datasetId}</div>
                    <div
                      style={{
                        marginTop: 8,
                        color: '#20331b',
                        fontSize: 14,
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {testCase.question}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedTestCase ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {/* 선택된 케이스의 핵심 메타정보를 먼저 보여주고 아래에서 세부 JSON을 비교한다. */}
                <div
                  style={{
                    ...softBlockStyle,
                    display: 'grid',
                    gap: 14,
                    background: 'linear-gradient(180deg, #f5f8f2 0%, #edf4e8 100%)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 18 }}>{selectedTestCase.id}</strong>
                        <StatusPill status={selectedResult ? selectedResult.status : 'empty'} />
                        <span style={{ ...pillStyle, fontSize: 12 }}>{selectedTestCase.datasetId}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 22, lineHeight: 1.45, color: '#20331b' }}>{selectedTestCase.question}</p>
                    </div>
                    <div style={{ ...softBlockStyle, minWidth: 220, background: '#ffffff', padding: 14 }}>
                      <div style={metaLabelStyle}>케이스 메모</div>
                      <div style={{ marginTop: 8, color: '#364b31', lineHeight: 1.5 }}>{selectedTestCase.note}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={{ ...softBlockStyle, background: '#ffffff' }}>
                      <div style={metaLabelStyle}>데이터셋</div>
                      <div style={{ marginTop: 8, color: '#20331b', fontWeight: 700 }}>
                        {selectedDataset ? `${selectedDataset.label} (${selectedDataset.id})` : selectedTestCase.datasetId}
                      </div>
                    </div>
                    <div style={{ ...softBlockStyle, background: '#ffffff' }}>
                      <div style={metaLabelStyle}>일치 필드 수</div>
                      <div style={{ marginTop: 8, color: '#1f5b1b', fontWeight: 800, fontSize: 24 }}>
                        {selectedResult?.matched_fields.length ?? 0}
                      </div>
                    </div>
                    <div style={{ ...softBlockStyle, background: '#ffffff' }}>
                      <div style={metaLabelStyle}>불일치 필드 수</div>
                      <div style={{ marginTop: 8, color: '#7a2418', fontWeight: 800, fontSize: 24 }}>
                        {selectedResult?.mismatched_fields.length ?? 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* expected / actual JSON을 나란히 보여줘 모델 출력을 바로 비교할 수 있게 한다. */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={softBlockStyle}>
                    <strong>기대 partial criteria</strong>
                    <div style={{ marginTop: 12 }}>
                      <JsonBlock value={selectedTestCase.expected} />
                    </div>
                  </div>
                  <div style={softBlockStyle}>
                    <strong>실제 criteria</strong>
                    <div style={{ marginTop: 12 }}>
                      <JsonBlock value={selectedResult?.actual_criteria ?? null} emptyText="아직 실행 결과가 없습니다." />
                    </div>
                  </div>
                </div>

                {/* 일치/불일치 필드는 발표 중 원인 설명이 쉽도록 별도 영역으로 분리한다. */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={softBlockStyle}>
                    <strong>일치한 필드</strong>
                    {selectedResult && selectedResult.matched_fields.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                        {selectedResult.matched_fields.map((field) => (
                          <span
                            key={field}
                            style={{
                              padding: '7px 10px',
                              borderRadius: 999,
                              background: '#d8f0d0',
                              color: '#1f5b1b',
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: '12px 0 0', color: '#556b50' }}>일치한 필드가 없거나 아직 결과가 없습니다.</p>
                    )}
                  </div>
                  <div style={softBlockStyle}>
                    <strong>불일치한 필드</strong>
                    {selectedResult && selectedResult.mismatched_fields.length > 0 ? (
                      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                        {selectedResult.mismatched_fields.map((item) => (
                          <div key={item.field} style={{ background: '#ffffff', borderRadius: 12, padding: 12, border: '1px solid #e4d0ca' }}>
                            <div style={{ fontWeight: 700, color: '#7a2418' }}>{item.field}</div>
                            <div style={{ marginTop: 8, fontSize: 13, color: '#556b50' }}>expected</div>
                            <pre style={{ ...codeBlockStyle, marginTop: 6 }}>{JSON.stringify(item.expected, null, 2)}</pre>
                            <div style={{ marginTop: 8, fontSize: 13, color: '#556b50' }}>actual</div>
                            <pre style={{ ...codeBlockStyle, marginTop: 6 }}>{JSON.stringify(item.actual, null, 2)}</pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: '12px 0 0', color: '#556b50' }}>불일치 필드가 없거나 아직 결과가 없습니다.</p>
                    )}
                  </div>
                </div>

                {selectedResult?.error ? (
                  <div style={{ ...softBlockStyle, border: '1px solid #e4d0ca' }}>
                    <strong style={{ color: '#7a2418' }}>오류</strong>
                    <p style={{ margin: '10px 0 0', color: '#7a2418' }}>{selectedResult.error}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState title="선택된 케이스가 없습니다." description="fixtures/test-cases.json을 확인해 주세요." />
            )}
          </div>
        </InfoCard>

        <InfoCard title="최신 실행 요약" subtitle="저장된 latest-results.json 기준으로 pass/fail과 필드 정확도를 보여줍니다.">
          {hasRunSummary && savedResults ? (
            <div style={{ display: 'grid', gap: 16 }}>
              {/* 데모 화면에서는 전체 성공률과 모델명을 먼저 보여주는 편이 설명하기 쉽다. */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={softBlockStyle}>
                  <div style={{ color: '#556b50', fontSize: 14 }}>전체 케이스</div>
                  <div style={{ marginTop: 6, fontSize: 34, fontWeight: 800 }}>{savedResults.summary.total}</div>
                </div>
                <div style={softBlockStyle}>
                  <div style={{ color: '#556b50', fontSize: 14 }}>성공</div>
                  <div style={{ marginTop: 6, fontSize: 34, fontWeight: 800, color: '#1f5b1b' }}>{savedResults.summary.passed}</div>
                </div>
                <div style={softBlockStyle}>
                  <div style={{ color: '#556b50', fontSize: 14 }}>실패</div>
                  <div style={{ marginTop: 6, fontSize: 34, fontWeight: 800, color: '#7a2418' }}>{savedResults.summary.failed}</div>
                </div>
                <div style={softBlockStyle}>
                  <div style={{ color: '#556b50', fontSize: 14 }}>모델</div>
                  <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>{savedResults.model ?? '-'}</div>
                </div>
              </div>

              {/* field_accuracy는 어떤 항목이 취약한지 설명하기 위한 테이블이다. */}
              <div style={softBlockStyle}>
                <strong>필드 정확도</strong>
                {Object.keys(savedResults.summary.field_accuracy).length > 0 ? (
                  <div style={{ overflowX: 'auto', marginTop: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: '#556b50' }}>
                          <th style={{ padding: '10px 12px', borderBottom: '1px solid #d7dfd4' }}>필드</th>
                          <th style={{ padding: '10px 12px', borderBottom: '1px solid #d7dfd4' }}>일치</th>
                          <th style={{ padding: '10px 12px', borderBottom: '1px solid #d7dfd4' }}>전체</th>
                          <th style={{ padding: '10px 12px', borderBottom: '1px solid #d7dfd4' }}>정확도</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(savedResults.summary.field_accuracy).map(([field, value]) => (
                          <tr key={field}>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #e7ede3' }}>{field}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #e7ede3' }}>{value.matched}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #e7ede3' }}>{value.total}</td>
                            <td style={{ padding: '10px 12px', borderBottom: '1px solid #e7ede3' }}>{(value.accuracy * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ margin: '12px 0 0', color: '#556b50' }}>아직 집계된 필드 정확도가 없습니다.</p>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              title="아직 저장된 실행 결과가 없습니다."
              description={resultsError ?? '먼저 npm run ai:test 를 실행하면 이 영역에 최신 요약이 표시됩니다.'}
            />
          )}
        </InfoCard>

        <InfoCard title="콘솔 로그 미리보기" subtitle="latest-console.txt 내용을 발표용으로 바로 확인할 수 있습니다.">
          <div style={{ ...softBlockStyle, padding: 0, overflow: 'hidden' }}>
            <pre
              style={{
                margin: 0,
                padding: 16,
                minHeight: 220,
                maxHeight: 420,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                background: '#eef5e9',
                color: '#294222',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {consoleText}
            </pre>
          </div>
        </InfoCard>
      </div>
    </main>
  );
}
