# AGENTS.md

## 목적
이 저장소는 **학원용 주간 리포트 MVP**를 빠르게 검증하는 것이 최우선입니다.
새 기능 추가 시 과한 추상화보다 **단순하고 유지보수 가능한 구현**을 우선합니다.

## 작업 원칙
1. **작게 변경**: 한 PR은 하나의 목적(버그 수정/기능 1개/품질 게이트 1개) 중심.
2. **타입 안전성 유지**: `TypeScript strict` 기준으로 `any`/무리한 단언 지양.
3. **스키마 정합성**: API 입력은 Zod로 검증하고, DB는 Prisma 모델과 필드명을 정확히 일치.
4. **실행 가능성 우선**: 변경 후 최소 `npm run typecheck && npm run build` 통과.
5. **민감정보 보호**: 로그에 개인정보(전화번호/실명/API key) 직접 출력 금지.

## 로컬 개발 표준 플로우
```bash
npm install
cp .env.example .env   # 없으면 생성
# sqlite 예시
export DATABASE_URL='file:./dev.db'
npx prisma db push
npm run dev
```

## 필수 체크리스트 (PR 전)
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- DB 관련 변경 시 `npm run db:seed` 재실행 확인

## AI/프롬프트 변경 가이드
- 프롬프트 문자열은 `lib/ai/prompts.ts`에서만 관리.
- 프롬프트 수정 시 `evals/`의 스모크 스크립트도 함께 갱신.
- 프롬프트에 실사용 개인정보 샘플 삽입 금지.

## 금지 사항
- import 구문을 try/catch로 감싸지 않기.
- UI 요구가 없는 작업에서 불필요한 대규모 리팩터링 금지.
- 실패한 품질 게이트를 무시한 채 머지 금지.
