import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MOCK_AUDIT_MD = `# Raport audytu treści

## 📊 Podsumowanie

Strona została przeanalizowana pod kątem jakości treści, struktury semantycznej oraz potencjału w AI Search.

### Główne wnioski

1. **Struktura nagłówków** wymaga poprawy - brak logicznej hierarchii H1 > H2 > H3
2. **Treść** jest dobrze napisana, ale brakuje odpowiedzi na pytania użytkowników
3. **E-E-A-T sygnały** są słabe - brak informacji o autorze i źródłach

## 🔧 Co poprawić

### Krytyczne
- [ ] Dodaj unikalne H1 na stronie
- [ ] Uzupełnij meta description (obecnie puste)
- [ ] Dodaj strukturę FAQ dla lepszej widoczności w AI Search

### Ważne
- [ ] Rozszerz treść o 300-500 słów w sekcji głównej
- [ ] Dodaj linki wewnętrzne do powiązanych artykułów
- [ ] Zoptymalizuj obrazy - brak atrybutów alt

### Do rozważenia
- [ ] Dodaj sekcję "O autorze" dla budowania E-E-A-T
- [ ] Rozważ dodanie schematu Article dla rich snippets

## 📝 Czego brakuje

### Brakujące elementy strukturalne
- Schema markup (Article, FAQ, HowTo)
- Breadcrumbs
- Spis treści dla długich artykułów

### Brakujące treści
- Odpowiedzi na popularne pytania użytkowników
- Porównanie z konkurencją
- Praktyczne przykłady i case studies

## 🏗️ Idealna struktura

\`\`\`
H1: Główny tytuł artykułu
├── H2: Wprowadzenie do tematu
├── H2: Główna sekcja 1
│   ├── H3: Podsekcja 1.1
│   └── H3: Podsekcja 1.2
├── H2: Główna sekcja 2
│   ├── H3: Podsekcja 2.1
│   └── H3: Podsekcja 2.2
├── H2: FAQ - Często zadawane pytania
└── H2: Podsumowanie
\`\`\`

## 🤖 AI Citability Analysis

Treść ma **średni potencjał** do cytowania przez AI:
- ✅ Zawiera konkretne fakty i dane
- ✅ Jasna struktura informacji
- ❌ Brak unikalnych insightów
- ❌ Brak cytowań źródeł zewnętrznych
`;

const MOCK_SCORES_MD = `# Szczegółowa analiza wymiarów

## Content Quality Score: 67/100

### Breakdown by dimension

| Wymiar | Wynik | Max | Opis |
|--------|-------|-----|------|
| 📐 Struktura | 6 | 10 | Podstawowa hierarchia, brak spisu treści |
| 📝 Jakość treści | 7 | 10 | Dobrze napisane, ale krótkie |
| 🎯 Trafność | 8 | 10 | Odpowiada na główne intencje |
| 🔍 SEO On-page | 5 | 10 | Brak meta, słabe nagłówki |
| 🔗 Linkowanie | 4 | 10 | Mało linków wewnętrznych |
| 📊 E-E-A-T | 5 | 10 | Brak sygnałów autorytetu |
| 🤖 AI-Ready | 6 | 10 | Średni potencjał dla AI Search |
| 📱 UX/Czytelność | 8 | 10 | Dobra czytelność, responsywność |
| 🎨 Media | 5 | 10 | Obrazy bez alt, brak video |

## Rekomendacje priorytetowe

1. **+15 pkt**: Dodaj kompletne meta tagi i zoptymalizuj nagłówki
2. **+10 pkt**: Rozbuduj treść o 500+ słów z FAQ
3. **+8 pkt**: Dodaj schema markup i dane strukturalne
`;

const MOCK_BENCHMARK_MD = `# Benchmark SERP - Top 5 wyników

## Twoja pozycja vs konkurencja

| Metryka | Twoja strona | Średnia TOP 5 | Lider |
|---------|--------------|---------------|-------|
| CQS | 67 | 78 | 92 |
| Długość treści | 850 słów | 1,420 słów | 2,100 słów |
| Nagłówków | 4 | 8 | 12 |
| Obrazów | 2 | 5 | 8 |
| Linków wewn. | 3 | 7 | 15 |

## Gap Analysis

### Co mają konkurenci, czego Ty nie masz:
- ❌ Sekcja FAQ (4/5 konkurentów)
- ❌ Video content (3/5 konkurentów)
- ❌ Schema Article (5/5 konkurentów)
- ❌ Spis treści (4/5 konkurentów)

## Top 3 quick wins

1. **Dodaj FAQ** - 80% konkurentów ma tę sekcję
2. **Rozbuduj treść** - Twoja strona ma 40% mniej treści niż średnia
3. **Schema markup** - Wszyscy konkurenci używają danych strukturalnych
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { job_id } = payload;

    if (!job_id) {
      return Response.json({ error: "Missing job_id" }, { status: 400 });
    }

    // Fetch the job
    const job = await base44.asServiceRole.entities.AuditJob.get(job_id);

    if (!job) {
      return Response.json({ error: "AuditJob not found" }, { status: 404 });
    }

    // Simulate processing steps with delays
    const steps = [
      { step: "crawling", progress: 10 },
      { step: "analyzing_structure", progress: 30 },
      { step: "scoring_dimensions", progress: 60 },
      { step: "generating_report", progress: 85 },
    ];

    // Mark as running first
    await base44.asServiceRole.entities.AuditJob.update(job_id, {
      status: "running",
      current_step: "crawling",
      progress_percent: 5,
    });

    // Simulate progress updates (quick for testing)
    for (const s of steps) {
      await new Promise(r => setTimeout(r, 500)); // 500ms delay per step
      await base44.asServiceRole.entities.AuditJob.update(job_id, {
        current_step: s.step,
        progress_percent: s.progress,
      });
    }

    // Generate mock scores
    const mockCqs = Math.floor(Math.random() * 30) + 55; // 55-85
    const mockCitability = Math.floor(Math.random() * 4) + 5; // 5-9

    // Final update with results
    await base44.asServiceRole.entities.AuditJob.update(job_id, {
      status: "done",
      progress_percent: 100,
      current_step: "completed",
      result_cqs: mockCqs,
      result_citability: mockCitability,
      result_audit_md: MOCK_AUDIT_MD,
      result_scores_md: MOCK_SCORES_MD,
      result_benchmark_md: MOCK_BENCHMARK_MD,
      completed_at: new Date().toISOString(),
    });

    return Response.json({ 
      success: true, 
      mock: true,
      cqs: mockCqs,
      citability: mockCitability 
    });

  } catch (error) {
    console.error(`[runMockAudit] Error: ${error.message}`);
    return Response.json({ error: error.message }, { status: 500 });
  }
});